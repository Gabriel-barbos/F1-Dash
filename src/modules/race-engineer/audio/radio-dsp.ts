import { RadioAudioConfig } from '../config/engineer-config';

/**
 * Processador de Áudio com Efeito Sutil de Rádio (Web Audio API)
 * Projetado para soar sutil, limpo e agradável aos ouvidos do piloto.
 */
export class RadioDspProcessor {
  private audioCtx: AudioContext | null = null;

  constructor(private config: RadioAudioConfig) {}

  public getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Cria uma cadeia de filtros de rádio sutil para conectar a um AudioNode.
   */
  public createRadioFilterGraph(ctx: AudioContext, destination: AudioNode): AudioNode {
    if (!this.config.enabled || this.config.subtleLevel <= 0.05) {
      return destination; // Sem efeito ou quase nulo
    }

    // 1. High-Pass suave para tirar graves pesados (320 Hz)
    const highpass = ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.value = this.config.highpassCutoff;
    highpass.Q.value = 0.7;

    // 2. Low-Pass suave para tirar chiados agudos extremos (4200 Hz)
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = this.config.lowpassCutoff;
    lowpass.Q.value = 0.7;

    // 3. Peaking sutil nos médios para presença de comunicação de rádio (+2dB em 2kHz)
    const midPresence = ctx.createBiquadFilter();
    midPresence.type = 'peaking';
    midPresence.frequency.value = 2100;
    midPresence.Q.value = 1.0;
    midPresence.gain.value = 2.0 * this.config.subtleLevel;

    // 4. Compressor broadcast suave para nivelar a voz
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.setValueAtTime(-18, ctx.currentTime);
    compressor.knee.setValueAtTime(12, ctx.currentTime);
    compressor.ratio.setValueAtTime(3, ctx.currentTime);
    compressor.attack.setValueAtTime(0.005, ctx.currentTime);
    compressor.release.setValueAtTime(0.05, ctx.currentTime);

    // Encadeamento: Input -> Highpass -> Lowpass -> MidPresence -> Compressor -> Destination
    highpass.connect(lowpass);
    lowpass.connect(midPresence);
    midPresence.connect(compressor);
    compressor.connect(destination);

    return highpass;
  }

  /**
   * Toca o efeito sonoro de fechamento do rádio (clique suave + microestática discreta).
   * O usuário solicitou que o efeito sonoro seja inserido especificamente no fechamento.
   */
  public playClosingSound(): Promise<void> {
    if (!this.config.playClosingBeep) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        const now = ctx.currentTime;
        const volume = Math.min(0.4, Math.max(0.05, this.config.closingBeepVolume));

        // 1. Ganho Geral do Fechamento
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(volume, now);
        masterGain.connect(ctx.destination);

        // 2. Tom de término de rádio (dois beeps microscópicos bem discretos)
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1400, now);
        osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);

        oscGain.gain.setValueAtTime(0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

        osc.connect(oscGain);
        oscGain.connect(masterGain);

        osc.start(now);
        osc.stop(now + 0.09);

        // 3. Microestática suave (apenas 70ms de ruído rosa suave)
        const bufferSize = ctx.sampleRate * 0.08;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = (Math.random() * 2 - 1) * 0.15;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuffer;

        const noiseFilter = ctx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 1800;
        noiseFilter.Q.value = 1.2;

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0.2, now + 0.02);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        noise.start(now + 0.02);
        noise.stop(now + 0.10);

        setTimeout(resolve, 110);
      } catch (err) {
        console.warn('[RadioDsp] Não foi possível reproduzir som de fechamento:', err);
        resolve();
      }
    });
  }

  /**
   * Toca o asset de abertura oficial fornecido pelo usuário.
   */
  public playOpeningAsset(): Promise<void> {
    return new Promise((resolve) => {
      try {
        if (!this.config.openingAssetUri) {
          resolve();
          return;
        }
        const audio = new Audio(this.config.openingAssetUri);
        audio.volume = 0.5;
        audio.onended = () => resolve();
        audio.onerror = () => {
          // Se o arquivo ainda não existir no disco, segue o fluxo normalmente sem travar
          resolve();
        };
        const playPromise = audio.play();
        if (playPromise) {
          playPromise.catch(() => resolve());
        }
      } catch {
        resolve();
      }
    });
  }
}
