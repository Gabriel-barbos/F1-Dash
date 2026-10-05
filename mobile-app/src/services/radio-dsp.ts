/**
 * DSP de rádio de capacete F1 — 100% TypeScript puro (roda no celular, sem backend).
 *
 * Recebe o WAV (PCM16 mono) do Gemini TTS e devolve:
 *  - o WAV processado (banda limitada + presença + saturação suave + chiado + click de PTT + squelch final)
 *  - o envelope de amplitude (um valor 0..1 a cada ENVELOPE_STEP_MS) para animar as ondinhas em sincronia com a voz
 */

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const B64_LOOKUP = new Uint8Array(256);
for (let i = 0; i < B64_CHARS.length; i++) B64_LOOKUP[B64_CHARS.charCodeAt(i)] = i;

export const ENVELOPE_STEP_MS = 40;

export function base64ToBytes(base64: string): Uint8Array {
  const clean = base64.replace(/[^A-Za-z0-9+/=]/g, '');
  let len = (clean.length * 3) / 4;
  if (clean.endsWith('==')) len -= 2;
  else if (clean.endsWith('=')) len -= 1;
  const bytes = new Uint8Array(len);
  let p = 0;
  for (let i = 0; i < clean.length; i += 4) {
    const e1 = B64_LOOKUP[clean.charCodeAt(i)];
    const e2 = B64_LOOKUP[clean.charCodeAt(i + 1)];
    const e3 = B64_LOOKUP[clean.charCodeAt(i + 2)];
    const e4 = B64_LOOKUP[clean.charCodeAt(i + 3)];
    if (p < len) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < len) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < len) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  const parts: string[] = [];
  const len = bytes.length;
  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;
    parts.push(
      B64_CHARS[b0 >> 2] +
        B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)] +
        (i + 1 < len ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '=') +
        (i + 2 < len ? B64_CHARS[b2 & 63] : '=')
    );
  }
  return parts.join('');
}

/** Biquad RBJ (Direct Form I). */
class Biquad {
  private x1 = 0;
  private x2 = 0;
  private y1 = 0;
  private y2 = 0;
  constructor(
    private b0: number,
    private b1: number,
    private b2: number,
    private a1: number,
    private a2: number
  ) {}

  process(x: number): number {
    const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2 - this.a1 * this.y1 - this.a2 * this.y2;
    this.x2 = this.x1;
    this.x1 = x;
    this.y2 = this.y1;
    this.y1 = y;
    return y;
  }

  static highpass(fs: number, f0: number, q: number): Biquad {
    const w0 = (2 * Math.PI * f0) / fs;
    const alpha = Math.sin(w0) / (2 * q);
    const cos = Math.cos(w0);
    const a0 = 1 + alpha;
    return new Biquad((1 + cos) / 2 / a0, -(1 + cos) / a0, (1 + cos) / 2 / a0, (-2 * cos) / a0, (1 - alpha) / a0);
  }

  static lowpass(fs: number, f0: number, q: number): Biquad {
    const w0 = (2 * Math.PI * f0) / fs;
    const alpha = Math.sin(w0) / (2 * q);
    const cos = Math.cos(w0);
    const a0 = 1 + alpha;
    return new Biquad((1 - cos) / 2 / a0, (1 - cos) / a0, (1 - cos) / 2 / a0, (-2 * cos) / a0, (1 - alpha) / a0);
  }

  static peaking(fs: number, f0: number, q: number, gainDb: number): Biquad {
    const A = Math.pow(10, gainDb / 40);
    const w0 = (2 * Math.PI * f0) / fs;
    const alpha = Math.sin(w0) / (2 * q);
    const cos = Math.cos(w0);
    const a0 = 1 + alpha / A;
    return new Biquad((1 + alpha * A) / a0, (-2 * cos) / a0, (1 - alpha * A) / a0, (-2 * cos) / a0, (1 - alpha / A) / a0);
  }
}

export interface RadioVoiceResult {
  wavBase64: string;
  envelope: number[];
  durationMs: number;
  stats: { rmsBefore: number; rmsAfter: number; peakAfter: number };
}

function findDataChunk(view: DataView, length: number): { offset: number; size: number } | null {
  let pos = 12;
  while (pos + 8 <= length) {
    const id = String.fromCharCode(view.getUint8(pos), view.getUint8(pos + 1), view.getUint8(pos + 2), view.getUint8(pos + 3));
    let size = view.getUint32(pos + 4, true);
    if (id === 'data') {
      // Alguns encoders de streaming gravam 0 / 0xFFFFFFFF no tamanho: usa o resto do arquivo.
      if (size === 0 || pos + 8 + size > length) size = length - (pos + 8);
      return { offset: pos + 8, size };
    }
    pos += 8 + size + (size % 2);
  }
  return null;
}

function buildWav(samples: Int16Array, sampleRate: number): Uint8Array {
  const dataSize = samples.length * 2;
  const out = new Uint8Array(44 + dataSize);
  const v = new DataView(out.buffer);
  const wr = (o: number, s: string) => {
    for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i));
  };
  wr(0, 'RIFF');
  v.setUint32(4, 36 + dataSize, true);
  wr(8, 'WAVE');
  wr(12, 'fmt ');
  v.setUint32(16, 16, true);
  v.setUint16(20, 1, true);
  v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true);
  v.setUint32(28, sampleRate * 2, true);
  v.setUint16(32, 2, true);
  v.setUint16(34, 16, true);
  wr(36, 'data');
  v.setUint32(40, dataSize, true);
  for (let i = 0; i < samples.length; i++) v.setInt16(44 + i * 2, samples[i], true);
  return out;
}

/**
 * Aplica o "som de rádio de capacete": presente e reconhecível, mas ainda agradável de ouvir.
 */
export function processRadioVoice(wavBase64: string): RadioVoiceResult {
  const bytes = base64ToBytes(wavBase64);
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const isRiff = bytes.length > 44 && view.getUint32(0, false) === 0x52494646; // 'RIFF'

  let sampleRate = 24000;
  let pcmOffset = 0;
  let pcmBytes = bytes.length;
  if (isRiff) {
    sampleRate = view.getUint32(24, true) || 24000;
    const chunk = findDataChunk(view, bytes.length);
    if (chunk) {
      pcmOffset = chunk.offset;
      pcmBytes = chunk.size;
    } else {
      pcmOffset = 44;
      pcmBytes = bytes.length - 44;
    }
  }

  const n = Math.floor(pcmBytes / 2);
  const input = new Float32Array(n);
  let sumSqBefore = 0;
  for (let i = 0; i < n; i++) {
    const s = view.getInt16(pcmOffset + i * 2, true) / 32768;
    input[i] = s;
    sumSqBefore += s * s;
  }
  const rmsBefore = Math.sqrt(sumSqBefore / Math.max(1, n));

  // Cadeia de filtros (2ª ordem — corte bem mais firme que um RC simples)
  const hp = [Biquad.highpass(sampleRate, 380, 0.75), Biquad.highpass(sampleRate, 380, 0.75)];
  const lp = [Biquad.lowpass(sampleRate, 3300, 0.75), Biquad.lowpass(sampleRate, 3300, 0.75)];
  const presence = Biquad.peaking(sampleRate, 1700, 0.9, 4.5);

  // Cauda: 40ms de respiro + 90ms de squelch; início: 25ms (click de PTT + chiado de abertura)
  const leadSamples = Math.floor(sampleRate * 0.025);
  const tailSamples = Math.floor(sampleRate * 0.13);
  const total = leadSamples + n + tailSamples;
  const out = new Float32Array(total);

  // Ruído branco filtrado (chiado de rádio) com PRNG determinístico rápido
  let seed = 0x2f6e2b1;
  const rnd = () => {
    seed ^= seed << 13;
    seed ^= seed >>> 17;
    seed ^= seed << 5;
    return ((seed >>> 0) / 4294967295) * 2 - 1;
  };
  const noiseHp = Biquad.highpass(sampleRate, 1200, 0.7);
  const noiseLp = Biquad.lowpass(sampleRate, 4200, 0.7);

  const DRIVE = 1.9;
  const NORM = Math.tanh(DRIVE);
  let env = 0; // seguidor de envelope p/ gate do chiado
  const attack = 1 - Math.exp(-1 / (sampleRate * 0.004));
  const release = 1 - Math.exp(-1 / (sampleRate * 0.08));

  // Click de abertura do PTT (rápido, sutil)
  for (let i = 0; i < leadSamples; i++) {
    const t = i / leadSamples;
    const burst = noiseLp.process(noiseHp.process(rnd())) * Math.exp(-t * 7) * 0.22;
    out[i] = burst;
  }

  for (let i = 0; i < n; i++) {
    let x = input[i];
    for (const f of hp) x = f.process(x);
    for (const f of lp) x = f.process(x);
    x = presence.process(x);

    // Compressão/saturação suave: "calor" de rádio sem estourar
    x = (Math.tanh(x * DRIVE) / NORM) * 0.92;

    // Chiado ligado ao envelope da voz (mais presente quando fala, some no silêncio)
    const a = Math.abs(x);
    env += (a > env ? attack : release) * (a - env);
    const hiss = noiseLp.process(noiseHp.process(rnd())) * (0.012 + Math.min(0.03, env * 0.07));

    out[leadSamples + i] = x + hiss;
  }

  // Squelch final: pequeno silêncio + estalo de "soltar o PTT"
  const gap = Math.floor(sampleRate * 0.035);
  const squelchLen = tailSamples - gap;
  for (let i = 0; i < squelchLen; i++) {
    const t = i / squelchLen;
    const burst = noiseLp.process(noiseHp.process(rnd())) * Math.exp(-t * 6.5) * 0.3 * (t < 0.04 ? t / 0.04 : 1);
    out[leadSamples + n + gap + i] = burst;
  }

  // Normaliza para pico seguro e converte para PCM16 + calcula envelope p/ UI
  let peak = 0;
  for (let i = 0; i < total; i++) peak = Math.max(peak, Math.abs(out[i]));
  const gain = peak > 0 ? Math.min(1.6, 0.89 / peak) : 1;

  const pcm = new Int16Array(total);
  let sumSqAfter = 0;
  let peakAfter = 0;
  for (let i = 0; i < total; i++) {
    const s = Math.max(-1, Math.min(1, out[i] * gain));
    pcm[i] = Math.round(s * 32767);
    sumSqAfter += s * s;
    peakAfter = Math.max(peakAfter, Math.abs(s));
  }

  const stepSamples = Math.max(1, Math.floor((sampleRate * ENVELOPE_STEP_MS) / 1000));
  const envelope: number[] = [];
  let envPeak = 0.0001;
  for (let i = 0; i < total; i += stepSamples) {
    let acc = 0;
    const end = Math.min(total, i + stepSamples);
    for (let j = i; j < end; j++) {
      const s = pcm[j] / 32768;
      acc += s * s;
    }
    const rms = Math.sqrt(acc / (end - i));
    envelope.push(rms);
    envPeak = Math.max(envPeak, rms);
  }
  for (let i = 0; i < envelope.length; i++) envelope[i] = Math.min(1, Math.pow(envelope[i] / envPeak, 0.7));

  return {
    wavBase64: bytesToBase64(buildWav(pcm, sampleRate)),
    envelope,
    durationMs: Math.round((total / sampleRate) * 1000),
    stats: {
      rmsBefore: rmsBefore,
      rmsAfter: Math.sqrt(sumSqAfter / Math.max(1, total)),
      peakAfter
    }
  };
}
