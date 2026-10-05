import test from 'node:test';
import assert from 'node:assert/strict';
import { processRadioVoice, bytesToBase64, base64ToBytes } from '../mobile-app/src/services/radio-dsp.ts';

const SR = 24000;

function makeWav(seconds: number): string {
  const n = SR * seconds;
  const dataSize = n * 2;
  const wav = new Uint8Array(44 + dataSize);
  const v = new DataView(wav.buffer);
  const w = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  w(0, 'RIFF');
  v.setUint32(4, 36 + dataSize, true);
  w(8, 'WAVE');
  w(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, SR, true);
  v.setUint32(28, SR * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  w(36, 'data');
  v.setUint32(40, dataSize, true);
  // sinal "voz-like": harmÃ´nicos de 130Hz (com muito grave e muito agudo de estÃºdio)
  for (let i = 0; i < n; i++) {
    const t = i / SR;
    let s = 0;
    for (let k = 1; k <= 80; k++) {
      const f = 130 * k;
      if (f > 11000) break;
      s += Math.sin(2 * Math.PI * f * t) / k;
    }
    s *= 0.12 * (0.6 + 0.4 * Math.sin(2 * Math.PI * 3 * t));
    v.setInt16(44 + i * 2, Math.round(Math.max(-1, Math.min(1, s)) * 32767), true);
  }
  return bytesToBase64(wav);
}

function bandEnergy(samples: ArrayLike<number>, lo: number, hi: number): number {
  let e = 0;
  for (let k = 1; 130 * k < 12000; k++) {
    const f = 130 * k;
    if (f < lo || f >= hi) continue;
    let re = 0;
    let im = 0;
    for (let i = 0; i < samples.length; i += 1) {
      const a = (2 * Math.PI * f * i) / SR;
      re += samples[i] * Math.cos(a);
      im += samples[i] * Math.sin(a);
    }
    e += re * re + im * im;
  }
  return e;
}

function decodePcm(b64: string): number[] {
  const bytes = base64ToBytes(b64);
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const out: number[] = [];
  for (let i = 44; i + 1 < bytes.length; i += 2) out.push(v.getInt16(i, true) / 32768);
  return out;
}

test('Radio DSP: base64 encode/decode Ã© lossless', () => {
  const b64 = makeWav(1);
  const bytes = base64ToBytes(b64);
  assert.equal(bytesToBase64(bytes), b64);
});

test('Radio DSP: gera WAV vÃ¡lido com envelope e cauda de squelch', () => {
  const b64 = makeWav(1);
  const r = processRadioVoice(b64);
  const bytes = base64ToBytes(r.wavBase64);
  assert.equal(String.fromCharCode(...bytes.slice(0, 4)), 'RIFF');
  assert.equal(String.fromCharCode(...bytes.slice(8, 12)), 'WAVE');
  assert.ok(r.durationMs > 1000, 'precisa ter lead + cauda alÃ©m da voz');
  assert.ok(r.envelope.length > 20);
  assert.ok(r.stats.peakAfter <= 1 && r.stats.peakAfter > 0.5);
});

test('Radio DSP: o efeito Ã© AUDÃVEL (corta graves e agudos de estÃºdio)', () => {
  const b64 = makeWav(1);
  const r = processRadioVoice(b64);
  const before = decodePcm(b64);
  const after = decodePcm(r.wavBase64);

  const tb = bandEnergy(before, 50, 12000);
  const ta = bandEnergy(after, 50, 12000);
  const lowB = bandEnergy(before, 50, 300) / tb;
  const lowA = bandEnergy(after, 50, 300) / ta;
  const highB = bandEnergy(before, 4500, 12000) / tb;
  const highA = bandEnergy(after, 4500, 12000) / ta;

  assert.ok(lowA < lowB * 0.5, `grave deve cair pelo menos 50% (antes ${lowB}, depois ${lowA})`);
  assert.ok(highA < highB * 0.5, `agudo deve cair pelo menos 50% (antes ${highB}, depois ${highA})`);
});


