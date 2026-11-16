import * as FileSystem from 'expo-file-system/legacy';
import { base64ToBytes, bytesToBase64, RadioVoiceResult } from './radio-dsp';

/**
 * Garante que o áudio Base64 vindo do Gemini TTS possua cabeçalho RIFF/WAVE (44 bytes).
 * O Gemini TTS frequentemente retorna PCM16 mono 24kHz puro sem cabeçalho RIFF,
 * o que faz o ExoPlayer/MediaPlayer no Android falhar silenciosamente ao tentar tocar `.wav`.
 */
function ensureWavHeaderBase64(b64: string, sampleRate = 24000): string {
  // 'RIFF' em Base64 sempre começa com 'UklGR'
  if (b64.startsWith('UklGR')) {
    return b64;
  }
  const pcm = base64ToBytes(b64);
  const dataSize = pcm.length;
  const wav = new Uint8Array(44 + dataSize);
  const view = new DataView(wav.buffer);

  // 'RIFF'
  view.setUint32(0, 0x52494646, false);
  view.setUint32(4, 36 + dataSize, true);
  // 'WAVE'
  view.setUint32(8, 0x57415645, false);
  // 'fmt '
  view.setUint32(12, 0x666d7420, false);
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  // 'data'
  view.setUint32(36, 0x64617461, false);
  view.setUint32(40, dataSize, true);
  wav.set(pcm, 44);

  return bytesToBase64(wav);
}

let expoAudioModule: any = null;
try {
  expoAudioModule = require('expo-audio');
} catch (e) {
  console.warn('[MobileAudioPlayer] expo-audio não disponível neste ambiente.');
}

let expoSpeechModule: any = null;
try {
  expoSpeechModule = require('expo-speech');
} catch (e) {
  console.warn('[MobileAudioPlayer] expo-speech não disponível neste ambiente.');
}

const BEEP_ASSET = require('../../assets/engineer/formula-1-radio-notification.mp3');

export interface VoicePlaybackCallbacks {
  /** Disparado no instante em que a voz começa a tocar — envelope de amplitude p/ animar as ondinhas. */
  onPlaybackStart?: (info: { envelope: number[]; durationMs: number; startedAt: number }) => void;
}

export class MobileAudioPlayer {
  private currentPlayer: any = null;
  private beepPlayer: any = null;
  private lastAudioModeAt = 0;

  private async ensureAudioMode(force = false): Promise<void> {
    if (!expoAudioModule) return;
    const now = Date.now();
    // Revalida o AudioFocus a cada 2 minutos para evitar que notificações/corridas longas silenciem o canal
    if (!force && now - this.lastAudioModeAt < 120000) return;
    try {
      await expoAudioModule.setAudioModeAsync?.({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers'
      });
      await expoAudioModule.setIsAudioActiveAsync?.(true);
      this.lastAudioModeAt = now;
    } catch (err) {
      console.warn('[MobileAudioPlayer] Falha ao configurar modo de áudio:', err);
    }
  }

  /** Toca o asset oficial de abertura de rádio. Resolve quando o bipe termina (ou após timeout de segurança). */
  public async playRadioBeep(): Promise<void> {
    if (!expoAudioModule?.createAudioPlayer) return;
    try {
      await this.ensureAudioMode();
      if (this.beepPlayer) {
        try {
          this.beepPlayer.pause?.();
          this.beepPlayer.remove?.();
        } catch {}
        this.beepPlayer = null;
      }
      const player = expoAudioModule.createAudioPlayer(BEEP_ASSET);
      this.beepPlayer = player;
      return await new Promise<void>((resolve) => {
        let done = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const finish = () => {
          if (done) return;
          done = true;
          if (timeoutId) clearTimeout(timeoutId);
          try {
            sub?.remove?.();
            player.pause?.();
            player.remove?.();
          } catch {}
          if (this.beepPlayer === player) this.beepPlayer = null;
          resolve();
        };
        const sub = player.addListener?.('playbackStatusUpdate', (status: any) => {
          if (status?.didJustFinish || status?.error) finish();
        });
        player.play();
        console.log('[MobileAudioPlayer] 📻 Bipe oficial do rádio F1 disparado');
        timeoutId = setTimeout(finish, 1800);
      });
    } catch (err) {
      console.warn('[MobileAudioPlayer] Falha ao tocar bipe do rádio:', err);
    }
  }

  /**
   * Toca um asset de áudio pré-renderizado do Claudinho (WAV com Puck + DSP de rádio).
   * 0ms de delay de rede, sem risco de timeout ou voz robótica.
   */
  public async playAsset(
    asset: any,
    envelope: number[],
    durationMs: number,
    callbacks: VoicePlaybackCallbacks = {}
  ): Promise<boolean> {
    this.stopVoice();
    if (!asset || !expoAudioModule?.createAudioPlayer) {
      console.warn('[MobileAudioPlayer] Asset de áudio indisponível.');
      return false;
    }

    try {
      await this.ensureAudioMode();
      const player = expoAudioModule.createAudioPlayer(asset);
      this.currentPlayer = player;

      return await new Promise<boolean>((resolve) => {
        let finished = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const finish = (ok: boolean) => {
          if (finished) return;
          finished = true;
          if (timeoutId) clearTimeout(timeoutId);
          try {
            sub?.remove?.();
            player.pause?.();
            player.remove?.();
          } catch {}
          if (this.currentPlayer === player) this.currentPlayer = null;
          resolve(ok);
        };

        const sub = player.addListener?.('playbackStatusUpdate', (status: any) => {
          if (status?.error) {
            console.warn('[MobileAudioPlayer] Erro no playback do asset:', status.error);
            this.lastAudioModeAt = 0;
            finish(false);
          } else if (status?.didJustFinish) {
            finish(true);
          }
        });

        player.play();
        callbacks.onPlaybackStart?.({
          envelope,
          durationMs,
          startedAt: Date.now()
        });

        timeoutId = setTimeout(() => finish(true), durationMs + 1200);
      });
    } catch (err) {
      console.error('[MobileAudioPlayer] Falha ao tocar asset:', err);
      this.lastAudioModeAt = 0;
      return false;
    }
  }

  /**
   * Aplica o cabeçalho WAV (se PCM puro) e reproduz o áudio do Gemini TTS.
   * Retorna false se houver falha para permitir fallback imediato ao clipe local.
   */
  public async playVoice(
    wavBase64?: string,
    callbacks: VoicePlaybackCallbacks = {},
    options?: {
      envelope?: number[];
      durationMs?: number;
      dspAlreadyApplied?: boolean;
    }
  ): Promise<boolean> {
    this.stopVoice();
    if (!wavBase64 || !expoAudioModule?.createAudioPlayer) {
      console.warn('[MobileAudioPlayer] Sem áudio da IA para tocar.');
      return false;
    }

    try {
      await this.ensureAudioMode();

      const validWavBase64 = ensureWavHeaderBase64(wavBase64);
      let processed: RadioVoiceResult;
      if (options?.dspAlreadyApplied) {
        processed = {
          wavBase64: validWavBase64,
          envelope: options.envelope || [],
          durationMs: options.durationMs || (options.envelope?.length ? options.envelope.length * 40 : 3500),
          stats: { rmsBefore: 0, rmsAfter: 0, peakAfter: 0 }
        };
        console.log(`[MobileAudioPlayer] 🚀 DSP pré-processado no PC Relay (0ms de carga no Hermes, ${processed.durationMs}ms)`);
      } else {
        const fastEnvelope = [0.15, 0.45, 0.85, 0.95, 0.7, 0.85, 0.9, 0.75, 0.5, 0.85, 0.95, 0.65, 0.4, 0.8, 0.9, 0.6, 0.35, 0.15];
        const approxDuration = Math.max(2500, Math.min(8000, Math.round(((validWavBase64.length * 0.75 - 44) / 48000) * 1000)));
        processed = {
          wavBase64: validWavBase64,
          envelope: fastEnvelope,
          durationMs: approxDuration,
          stats: { rmsBefore: 0, rmsAfter: 0, peakAfter: 0 }
        };
        console.log(`[MobileAudioPlayer] ⚡ Áudio dinâmico da IA reproduzido direto no celular (${approxDuration}ms)`);
      }

      const fileUri = `${FileSystem.cacheDirectory}claudinho_radio_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(fileUri, processed.wavBase64, {
        encoding: FileSystem.EncodingType.Base64
      });

      const player = expoAudioModule.createAudioPlayer(fileUri);
      this.currentPlayer = player;

      return await new Promise<boolean>((resolve) => {
        let finished = false;
        let timeoutId: ReturnType<typeof setTimeout> | null = null;
        const finish = (ok: boolean) => {
          if (finished) return;
          finished = true;
          if (timeoutId) clearTimeout(timeoutId);
          try {
            sub?.remove?.();
            player.pause?.();
            player.remove?.();
          } catch {}
          if (this.currentPlayer === player) this.currentPlayer = null;
          FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
          resolve(ok);
        };

        const sub = player.addListener?.('playbackStatusUpdate', (status: any) => {
          if (status?.error) {
            console.warn('[MobileAudioPlayer] Erro no playback da voz dinâmica:', status.error);
            this.lastAudioModeAt = 0;
            finish(false);
          } else if (status?.didJustFinish) {
            finish(true);
          }
        });

        player.play();
        callbacks.onPlaybackStart?.({
          envelope: processed.envelope,
          durationMs: processed.durationMs,
          startedAt: Date.now()
        });

        timeoutId = setTimeout(() => finish(true), processed.durationMs + 1500);
      });
    } catch (err) {
      console.error('[MobileAudioPlayer] Falha ao tocar voz:', err);
      this.lastAudioModeAt = 0;
      return false;
    }
  }

  /**
   * Síntese local de voz offline (caso o Gemini TTS falhe ou o celular fique sem internet momentaneamente).
   * Garante que o Claudinho Ronaldo fale 100% das vezes.
   */
  public async playSpeechFallback(text: string, callbacks: VoicePlaybackCallbacks = {}): Promise<void> {
    this.stopVoice();
    if (!expoSpeechModule?.speak) {
      console.warn('[MobileAudioPlayer] expo-speech indisponível.');
      return;
    }

    try {
      await this.ensureAudioMode();
      await new Promise<void>((resolve) => {
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          resolve();
        };

        callbacks.onPlaybackStart?.({
          envelope: [0.35, 0.75, 0.95, 0.6, 0.45, 0.85, 0.55],
          durationMs: 3200,
          startedAt: Date.now()
        });

        expoSpeechModule.speak(text, {
          language: 'pt-BR',
          pitch: 0.9,
          rate: 1.05,
          onDone: finish,
          onError: finish,
        });

        setTimeout(finish, 4500);
      });
    } catch (err) {
      console.warn('[MobileAudioPlayer] Erro na síntese local de voz:', err);
    }
  }

  private stopVoice(): void {
    try {
      if (expoSpeechModule?.stop) {
        expoSpeechModule.stop();
      }
      if (this.currentPlayer) {
        this.currentPlayer.pause?.();
        this.currentPlayer.remove?.();
        this.currentPlayer = null;
      }
    } catch {}
  }

  public stop(): void {
    this.stopVoice();
    try {
      if (this.beepPlayer) {
        this.beepPlayer.pause?.();
        this.beepPlayer.remove?.();
        this.beepPlayer = null;
      }
    } catch {}
  }
}

export const mobileAudioPlayer = new MobileAudioPlayer();
