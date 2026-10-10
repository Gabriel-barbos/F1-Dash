import { mobileAudioPlayer } from './mobile-audio-player';
import { getClaudinhoClip, ClaudinhoClip } from './claudinho-clips';

export interface RadioTransmissionResult {
  message: string;
  tone: string;
  priority: string;
  category: string;
}

export interface RadioCallbacks {
  /** Bipe de abertura já disparado — hora de mostrar o banner (fase "conectando"). */
  onStart?: (text: string) => void;
  /** Voz começou a tocar — envelope de amplitude p/ sincronizar as ondinhas. */
  onVoiceStart?: (info: { envelope: number[]; durationMs: number; startedAt: number }) => void;
  onEnd?: () => void;
}

export class ClaudinhoMobileService {
  private isTransmitting = false;

  /**
   * Reproduz um rádio pré-gerado vindo do PC Relay ou evento de rede.
   * Só abre o banner no momento em que o áudio já está na memória, eliminando silêncios.
   */
  public async playDirectRadio(
    eventScenario: string,
    text: string,
    wavBase64?: string,
    callbacks: RadioCallbacks = {}
  ): Promise<void> {
    if (this.isTransmitting) return;
    this.isTransmitting = true;

    try {
      if (wavBase64) {
        // Áudio dinâmico em base64 recebido do PC com DSP:
        // Abre o banner no momento exato em que o áudio está disponível
        callbacks.onStart?.(text);
        await mobileAudioPlayer.playRadioBeep();
        await mobileAudioPlayer.playVoice(wavBase64, { onPlaybackStart: callbacks.onVoiceStart });
      } else {
        // Se veio sem áudio bruto, usa o clipe autêntico do Claudinho em memória
        const clip = getClaudinhoClip(eventScenario, 'Gabriel');
        callbacks.onStart?.(text || clip.text);
        await mobileAudioPlayer.playRadioBeep();
        await mobileAudioPlayer.playAsset(
          clip.asset,
          clip.envelope,
          clip.durationMs,
          { onPlaybackStart: callbacks.onVoiceStart }
        );
      }
    } catch (err) {
      console.warn('[ClaudinhoMobile] Erro ao reproduzir rádio direto:', err);
    } finally {
      this.isTransmitting = false;
      callbacks.onEnd?.();
    }
  }

  /**
   * Dispara o rádio do Claudinho Ronaldo 100% autônomo no celular.
   *
   * Garantias:
   * 1. ZERO segundos de silêncio: o banner só abre quando o clipe já está na memória.
   * 2. ZERO latência de rede: áudios autênticos pré-carregados (Puck + DSP de capacete).
   * 3. ZERO voz robótica: nunca cai em síntese robótica do Android (expo-speech).
   * 4. Rotação sem repetições: frases variadas por cenário com anti-repetição.
   */
  public async triggerRadio(
    eventScenario: string = 'OVERTAKE',
    driverName: string = 'Gabriel',
    callbacks: RadioCallbacks = {}
  ): Promise<RadioTransmissionResult> {
    if (this.isTransmitting) {
      return { message: '', tone: 'calm', priority: 'LOW', category: eventScenario };
    }
    this.isTransmitting = true;

    try {
      // 1. Obtém o clipe de áudio autêntico do Claudinho para a situação (0ms)
      const clip = getClaudinhoClip(eventScenario, driverName);

      // 2. CRUCIAL: Só aciona o rádio na tela AGORA que o áudio está 100% pronto!
      callbacks.onStart?.(clip.text);

      // 3. Toca o bipe oficial do rádio F1
      await mobileAudioPlayer.playRadioBeep();

      // 4. Sem qualquer intervalo mudo, reproduz a voz oficial com DSP de capacete
      await mobileAudioPlayer.playAsset(
        clip.asset,
        clip.envelope,
        clip.durationMs,
        { onPlaybackStart: callbacks.onVoiceStart }
      );

      return { message: clip.text, tone: 'celebratory', priority: 'HIGH', category: eventScenario };
    } catch (err) {
      console.warn('[ClaudinhoMobile] Erro na transmissão do rádio:', err);
      return { message: '', tone: 'calm', priority: 'LOW', category: eventScenario };
    } finally {
      this.isTransmitting = false;
      callbacks.onEnd?.();
    }
  }
}

export const claudinhoMobileService = new ClaudinhoMobileService();
