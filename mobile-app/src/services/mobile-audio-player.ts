import * as FileSystem from 'expo-file-system/legacy';
import { processRadioVoice, RadioVoiceResult } from './radio-dsp';

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
  private audioModeReady = false;

  private async ensureAudioMode(): Promise<void> {
    if (this.audioModeReady || !expoAudioModule) return;
    try {
      await expoAudioModule.setAudioModeAsync?.({
        playsInSilentMode: true,
        interruptionMode: 'mixWithOthers'
      });
      await expoAudioModule.setIsAudioActiveAsync?.(true);
      this.audioModeReady = true;
    } catch (err) {
      console.warn('[MobileAudioPlayer] Falha ao configurar modo de áudio:', err);
    }
  }

  /** Toca o asset oficial de abertura de rádio. Resolve quando o bipe termina (ou após timeout de segurança). */
  public async playRadioBeep(): Promise<void> {
    if (!expoAudioModule?.createAudioPlayer) return;
    try {
      await this.ensureAudioMode();
      const player = expoAudioModule.createAudioPlayer(BEEP_ASSET);
      this.beepPlayer = player;
      return await new Promise<void>((resolve) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          try {
            sub?.remove?.();
            player.remove?.();
          } catch {}
          if (this.beepPlayer === player) this.beepPlayer = null;
          resolve();
        };
        const sub = player.addListener?.('playbackStatusUpdate', (status: any) => {
          if (status?.didJustFinish) finish();
        });
        player.play();
        console.log('[MobileAudioPlayer] 📻 Bipe oficial do rádio F1 disparado');
        setTimeout(finish, 1800);
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
  ): Promise<void> {
    this.stopVoice();
    if (!asset || !expoAudioModule?.createAudioPlayer) {
      console.warn('[MobileAudioPlayer] Asset de áudio indisponível.');
      return;
    }

    try {
      await this.ensureAudioMode();
      const player = expoAudioModule.createAudioPlayer(asset);
      this.currentPlayer = player;

      await new Promise<void>((resolve) => {
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          try {
            sub?.remove?.();
            player.remove?.();
          } catch {}
          if (this.currentPlayer === player) this.currentPlayer = null;
          resolve();
        };

        const sub = player.addListener?.('playbackStatusUpdate', (status: any) => {
          if (status?.didJustFinish) finish();
        });

        player.play();
        callbacks.onPlaybackStart?.({
          envelope,
          durationMs,
          startedAt: Date.now()
        });

        setTimeout(finish, durationMs + 1200);
      });
    } catch (err) {
      console.error('[MobileAudioPlayer] Falha ao tocar asset:', err);
    }
  }

  /**
   * Aplica o efeito de rádio (DSP em TS puro) no WAV do Gemini TTS e toca.
   * Nunca cai em voz robótica: sem WAV, apenas não fala.
   */
  public async playVoice(wavBase64?: string, callbacks: VoicePlaybackCallbacks = {}): Promise<void> {
    this.stopVoice();
    if (!wavBase64 || !expoAudioModule?.createAudioPlayer) {
      console.warn('[MobileAudioPlayer] Sem áudio da IA para tocar.');
      return;
    }

    try {
      await this.ensureAudioMode();

      let processed: RadioVoiceResult;
      const t0 = Date.now();
      try {
        processed = processRadioVoice(wavBase64);
        console.log(
          `[MobileAudioPlayer] 🎛️ DSP de rádio aplicado em ${Date.now() - t0}ms ` +
            `(RMS ${processed.stats.rmsBefore.toFixed(3)} → ${processed.stats.rmsAfter.toFixed(3)}, ` +
            `pico ${processed.stats.peakAfter.toFixed(2)}, ${processed.durationMs}ms)`
        );
      } catch (dspErr) {
        console.error('[MobileAudioPlayer] ❌ DSP de rádio FALHOU (tocando áudio original):', dspErr);
        processed = { wavBase64, envelope: [], durationMs: 3500, stats: { rmsBefore: 0, rmsAfter: 0, peakAfter: 0 } };
      }

      const fileUri = `${FileSystem.cacheDirectory}claudinho_radio_${Date.now()}.wav`;
      await FileSystem.writeAsStringAsync(fileUri, processed.wavBase64, {
        encoding: FileSystem.EncodingType.Base64
      });

      const player = expoAudioModule.createAudioPlayer(fileUri);
      this.currentPlayer = player;

      await new Promise<void>((resolve) => {
        let finished = false;
        const finish = () => {
          if (finished) return;
          finished = true;
          try {
            sub?.remove?.();
            player.remove?.();
          } catch {}
          if (this.currentPlayer === player) this.currentPlayer = null;
          FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
          resolve();
        };

        const sub = player.addListener?.('playbackStatusUpdate', (status: any) => {
          if (status?.didJustFinish) finish();
        });

        player.play();
        callbacks.onPlaybackStart?.({
          envelope: processed.envelope,
          durationMs: processed.durationMs,
          startedAt: Date.now()
        });

        setTimeout(finish, processed.durationMs + 1500);
      });
    } catch (err) {
      console.error('[MobileAudioPlayer] Falha ao tocar voz:', err);
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
