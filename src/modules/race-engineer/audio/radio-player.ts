import { RadioAudioConfig } from '../config/engineer-config';
import { RadioMessageOutput } from '../brain/types';
import { RadioDspProcessor } from './radio-dsp';

export interface RadioPlaybackCallbacks {
  onTransmissionStart?: (msg: RadioMessageOutput) => void;
  onVoiceStart?: (msg: RadioMessageOutput) => void;
  onTransmissionEnd?: (msg: RadioMessageOutput) => void;
}

export class RadioPlayer {
  private dsp: RadioDspProcessor;
  private isPlaying: boolean = false;
  private selectedVoice: SpeechSynthesisVoice | null = null;

  constructor(private config: RadioAudioConfig) {
    this.dsp = new RadioDspProcessor(config);
    this.initVoiceSelector();
  }

  private initVoiceSelector(): void {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    const pickBestPtVoice = () => {
      const voices = window.speechSynthesis.getVoices();
      // Procura primeiro por vozes masculinas naturais em pt-BR (estilo Claudinho Ronaldo)
      const ptBrVoices = voices.filter(v => v.lang.startsWith('pt') || v.lang.includes('BR'));
      const naturalOrGoogle = ptBrVoices.find(v => 
        v.name.toLowerCase().includes('google') || 
        v.name.toLowerCase().includes('natural') ||
        v.name.toLowerCase().includes('neural') ||
        v.name.toLowerCase().includes('brazil')
      );
      this.selectedVoice = naturalOrGoogle || ptBrVoices[0] || null;
    };

    pickBestPtVoice();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = pickBestPtVoice;
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Executa a sequência completa de transmissão de Team Radio:
   * 1. Abertura: Asset oficial fornecido pelo usuário
   * 2. Fala: Claudinho Ronaldo com tom calibrado
   * 3. Fechamento: Som sutil de rádio (click + suave estática)
   */
  public async playRadioMessage(
    msg: RadioMessageOutput,
    callbacks?: RadioPlaybackCallbacks
  ): Promise<void> {
    if (this.isPlaying) {
      console.log('[RadioPlayer] Rádio ocupado, ignorando sobreposição de transmissão.');
      return;
    }

    this.isPlaying = true;
    callbacks?.onTransmissionStart?.(msg);

    try {
      // 1. Asset Oficial de Abertura do Rádio
      await this.dsp.playOpeningAsset();

      // 2. Voz Sintetizada com Entonação Brasileira Natural
      callbacks?.onVoiceStart?.(msg);
      if (msg.audioBase64) {
        await this.playBase64Audio(msg.audioBase64);
      } else {
        await this.speakText(msg);
      }

      // 3. Efeito Sonoro de Fechamento do Rádio (conforme solicitado pelo usuário)
      await this.dsp.playClosingSound();
    } catch (err) {
      console.warn('[RadioPlayer] Erro na reprodução do rádio:', err);
    } finally {
      this.isPlaying = false;
      callbacks?.onTransmissionEnd?.(msg);
    }
  }

  /**
   * Decodifica e toca o áudio WAV de alta fidelidade do Gemini 3.8 Flash TTS
   * passando pela cadeia de filtros sutis de rádio
   */
  private async playBase64Audio(base64: string): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      const binaryString = atob(base64);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      const ctx = this.dsp.getAudioContext();
      const audioBuffer = await ctx.decodeAudioData(bytes.buffer.slice(0));

      return new Promise((resolve) => {
        const source = ctx.createBufferSource();
        source.buffer = audioBuffer;

        // Conecta ao processador DSP sutil de rádio
        const filteredNode = this.dsp.createRadioFilterGraph(ctx, ctx.destination);
        source.connect(filteredNode);

        source.onended = () => resolve();
        source.start(0);
      });
    } catch (err) {
      console.warn('[RadioPlayer] Falha ao decodificar áudio base64:', err);
    }
  }

  private speakText(msg: RadioMessageOutput): Promise<void> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !window.speechSynthesis) {
        // Fallback para ambientes sem speech synthesis
        setTimeout(resolve, 2500);
        return;
      }

      window.speechSynthesis.cancel(); // Garante fila limpa

      const utterance = new SpeechSynthesisUtterance(msg.message);
      utterance.lang = 'pt-BR';

      if (this.selectedVoice) {
        utterance.voice = this.selectedVoice;
      }

      // Ajustes dinâmicos de entonação de acordo com o tom da mensagem
      switch (msg.tone) {
        case 'urgent':
          utterance.rate = 1.15; // Fala mais rápida e enérgica
          utterance.pitch = 1.05;
          break;
        case 'celebratory':
          utterance.rate = 1.08;
          utterance.pitch = 1.1;
          break;
        case 'tactical':
          utterance.rate = 1.02;
          utterance.pitch = 0.98;
          break;
        case 'humorous':
          utterance.rate = 0.95; // Fala relaxada e descontraída
          utterance.pitch = 1.0;
          break;
        default:
          utterance.rate = 1.05;
          utterance.pitch = 1.0;
          break;
      }

      utterance.onend = () => resolve();
      utterance.onerror = (e) => {
        console.warn('[RadioPlayer] SpeechSynthesis error:', e);
        resolve();
      };

      window.speechSynthesis.speak(utterance);
    });
  }

  public stop(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
  }
}
