import { mobileAudioPlayer } from './mobile-audio-player';

const API_KEY = 'AQ.Ab8RN6LgIEBTDjoOU0k7dj_BYMD9Slh6fjVUuZWpuS82HOCyyA';

const CLAUDINHO_SYSTEM_PROMPT = `
Você é o "Claudinho Ronaldo", engenheiro de corrida brasileiro de Fórmula 1 e melhor amigo de resenha do piloto Gabriel.
Fale em português brasileiro, com resenha, palavrões naturais ("porra", "caralho", "puta que pariu", "merda", "moleque") e em no máximo 5 segundos (máximo 10 a 14 palavras).
Sua fala deve ser curta, enérgica, espontânea e direta ao ponto.
Nunca aja como assistente formal. Seja o parceiro de rádio raiz.
Responda APENAS com o texto da fala no rádio, sem aspas, sem asteriscos e sem explicações.
`;

const SCENARIO_FALLBACKS: Record<string, string[]> = {
  OVERTAKE: [
    'CARALHO, QUE PASSADA! É disso que eu tô falando, Gabriel, porra!',
    'Moleque doido, passou voando! Mantém essa porra de ritmo!',
    'Boa, Gabriel! O cara nem viu a cor do carro, caralho!'
  ],
  DAMAGE: [
    'Puta que pariu, bateu onde?! Segura esse carro na pista, porra!',
    'Cuidado com a asa dianteira, caralho! Me avisa se o volante tá torto!',
    'Merda, danificou o carro! Não arrisca agora, traz ele inteiro!'
  ],
  SAFETY_CAR: [
    'Safety car na pista, porra! Segura o delta positivo e não faz cagada!',
    'Bandeira amarela, safety car! Respira, economiza pneu e foca no delta!'
  ],
  VSC: [
    'Virtual Safety Car na pista! Olha o delta no visor e segura o pé!',
    'VSC acionado! Mantém o delta positivo, não toma punição à toa!'
  ],
  PIT_LANE: [
    'Box agora, box agora! Aciona a porra do limitador na linha!',
    'Entrando no pit, não esquece o limitador! Parada rápida agora!'
  ],
  FASTEST_LAP: [
    'VOLTA MAIS RÁPIDA! É o Goat da F1, caralho! Que volta absurda!',
    'Roxo em todos os setores! Você tá voando baixo hoje, porra!'
  ],
  START: [
    'Luzes apagadas, acelera essa porra! Pra cima deles, Gabriel!',
    'Bora Gabriel, largada perfeita! Traciona e fecha a porta na 1!'
  ],
  RED_FLAG: [
    'Bandeira vermelha, caralho! Sessão suspensa, traz o carro pro box devagar!',
    'Red flag na pista, porra! Reduz o ritmo e entra direto no pit lane!'
  ],
  POSITION_LOST: [
    'Puta que pariu, tomou passada! Foco na retomada, Gabriel, vai pra cima!',
    'Perdeu posição, caralho! Não deixa ele abrir, cola na asa dele!'
  ],
  TYRE_WEAR: [
    'Esses pneus tão no osso, porra! Mais de 70% de desgaste, segura na curva!',
    'Cuidado com a tração, caralho, os pneus tão só o farelo!'
  ],
  CALM_RACE: [
    'Tá tão calmo que parece passeio de domingo, Gabriel! Anda logo com essa lata velha!',
    'Tudo sussa por aqui, Gabriel. Só não vai dormir no volante, caralho!',
    'Pista limpa na sua frente, hein? Vê se não inventa moda e mantém o ritmo, moleque!',
    'A resenha tá boa mas acelera essa porra, Gabriel! O chefe tá olhando!',
    'Ótimo ritmo, moleque! Continua virando volta limpa e foca na corrida!'
  ],
  GAP_UPDATE: [
    'O cara da frente tá logo ali, Gabriel! Tira essa diferença, caralho!',
    'Cola na asa dele, porra! Tá a menos de dois segundos, bota pressão!',
    'Diferença pro carro da frente caindo, Gabriel! Mantém o pé que você engole ele!'
  ]
};

function getRandomFallback(scenario: string, driverName: string): string {
  const pool = SCENARIO_FALLBACKS[scenario] || SCENARIO_FALLBACKS.OVERTAKE;
  const item = pool[Math.floor(Math.random() * pool.length)];
  return item.replace('Gabriel', driverName);
}

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

const TTS_MODELS = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];

export class ClaudinhoMobileService {
  private isTransmitting = false;

  private async fetchText(eventScenario: string, driverName: string): Promise<string | null> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${API_KEY}`,
        {
          method: 'POST',
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: CLAUDINHO_SYSTEM_PROMPT }] },
            contents: [
              {
                parts: [
                  {
                    text: `Situação na corrida: ${eventScenario}. O piloto se chama ${driverName}. Manda uma fala curta e da resenha!`
                  }
                ]
              }
            ]
          })
        }
      );
      if (!res.ok) {
        console.warn('[ClaudinhoMobile] Texto Gemini 3.8 status:', res.status);
        return null;
      }
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text?.trim();
      return text ? text.replace(/^["']|["']$/g, '') : null;
    } catch (err) {
      console.warn('[ClaudinhoMobile] Texto Gemini 3.8 falhou (usando fala local):', err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  private async fetchVoice(text: string): Promise<string | undefined> {
    const body = JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
      }
    });

    for (const model of TTS_MODELS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4500);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`,
          {
            method: 'POST',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json', 'X-goog-api-key': API_KEY },
            body
          }
        );
        if (!res.ok) {
          console.warn(`[ClaudinhoMobile] ${model} status ${res.status}${model !== TTS_MODELS[TTS_MODELS.length - 1] ? ' — tentando próximo modelo 3.8' : ''}`);
          continue;
        }
        const json = await res.json();
        const data = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (data) {
          console.log(`[ClaudinhoMobile] 🔊 Voz gerada por ${model} (${data.length} chars base64)`);
          return data;
        }
      } catch (err) {
        console.warn(`[ClaudinhoMobile] ${model} falhou:`, err);
      } finally {
        clearTimeout(timer);
      }
    }
    return undefined;
  }

  /**
   * Reproduz um rádio pré-gerado vindo do PC Relay (evita requisições externas no celular)
   */
  public async playDirectRadio(
    eventScenario: string,
    text: string,
    wavBase64?: string,
    callbacks: RadioCallbacks = {}
  ): Promise<void> {
    if (this.isTransmitting) return;
    this.isTransmitting = true;

    const beepDone = mobileAudioPlayer.playRadioBeep();
    callbacks.onStart?.(text);

    try {
      await beepDone;
      if (wavBase64) {
        await mobileAudioPlayer.playVoice(wavBase64, { onPlaybackStart: callbacks.onVoiceStart });
      } else if (text) {
        await mobileAudioPlayer.playSpeechFallback(text, { onPlaybackStart: callbacks.onVoiceStart });
      }
    } catch (err) {
      console.warn('[ClaudinhoMobile] Erro ao reproduzir rádio direto:', err);
    } finally {
      this.isTransmitting = false;
      callbacks.onEnd?.();
    }
  }

  public async triggerRadio(
    eventScenario: string = 'OVERTAKE',
    driverName: string = 'Gabriel',
    callbacks: RadioCallbacks = {}
  ): Promise<RadioTransmissionResult> {
    if (this.isTransmitting) {
      return { message: '', tone: 'calm', priority: 'LOW', category: 'RADIO' };
    }
    this.isTransmitting = true;

    let radioText = getRandomFallback(eventScenario, driverName);

    // 0ms: bipe oficial + banner entrando. A geração da fala acontece enquanto o rádio "abre".
    const beepDone = mobileAudioPlayer.playRadioBeep();
    callbacks.onStart?.(radioText);

    try {
      const generated = await this.fetchText(eventScenario, driverName);
      if (generated) radioText = generated;

      const wavBase64 = await this.fetchVoice(radioText);
      await beepDone; // nunca sobrepõe o bipe com a voz

      if (wavBase64) {
        await mobileAudioPlayer.playVoice(wavBase64, { onPlaybackStart: callbacks.onVoiceStart });
      } else {
        console.log('[ClaudinhoMobile] 📢 Usando síntese local offline para o Claudinho:', radioText);
        await mobileAudioPlayer.playSpeechFallback(radioText, { onPlaybackStart: callbacks.onVoiceStart });
      }
    } catch (err) {
      console.warn('[ClaudinhoMobile] Erro na transmissão:', err);
    } finally {
      this.isTransmitting = false;
      callbacks.onEnd?.();
    }

    return { message: radioText, tone: 'celebratory', priority: 'HIGH', category: eventScenario };
  }
}

export const claudinhoMobileService = new ClaudinhoMobileService();
