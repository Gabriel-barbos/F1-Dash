import { GeminiAiConfig } from '../config/engineer-config';
import { GeminiRaceContext, RadioMessageOutput } from '../brain/types';
import { CLAUDINHO_RONALDO_SYSTEM_INSTRUCTION, buildGeminiUserPrompt } from './prompts';

export class GeminiEngineerClient {
  constructor(private config: GeminiAiConfig) {}

  public updateApiKey(key: string): void {
    this.config.apiKey = key;
  }

  /**
   * Envia o contexto compacto para o Gemini no Google AI Studio e retorna a fala estruturada do rádio.
   */
  public async generateRadioMessage(context: GeminiRaceContext): Promise<RadioMessageOutput> {
    const apiKey = this.config.apiKey?.trim();

    // Se não houver chave de API configurada, utiliza fallbacks realistas do Claudinho Ronaldo
    if (!apiKey) {
      return this.generateOfflineFallback(context);
    }

    const model = this.config.model || 'gemini-3.8-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    const requestBody = {
      systemInstruction: {
        parts: [{ text: CLAUDINHO_RONALDO_SYSTEM_INSTRUCTION }]
      },
      contents: [
        {
          role: 'user',
          parts: [{ text: buildGeminiUserPrompt(context) }]
        }
      ],
      generationConfig: {
        temperature: this.config.temperature ?? 0.75,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'OBJECT',
          properties: {
            shouldSpeak: { type: 'BOOLEAN' },
            message: { type: 'STRING' },
            tone: {
              type: 'STRING',
              enum: ['urgent', 'calm', 'celebratory', 'tactical', 'humorous']
            },
            category: { type: 'STRING' },
            priority: {
              type: 'STRING',
              enum: ['CRITICAL', 'HIGH', 'STRATEGIC', 'INFORMATIONAL', 'FUN']
            }
          },
          required: ['shouldSpeak', 'message', 'tone', 'category', 'priority']
        }
      }
    };

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[GeminiClient] Erro na API do Google AI Studio (${response.status}):`, errorText);
        return this.generateOfflineFallback(context);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        return this.generateOfflineFallback(context);
      }

      const parsed = JSON.parse(rawText) as RadioMessageOutput;
      const finalMessage: RadioMessageOutput = {
        shouldSpeak: parsed.shouldSpeak !== false,
        message: parsed.message || 'Câmbio, foco na corrida.',
        tone: parsed.tone || 'calm',
        category: parsed.category || 'general',
        priority: parsed.priority || context.priority
      };

      // Se o modelo TTS oficial estiver configurado (Gemini 3.8 Flash TTS), gera o áudio WAV de alta fidelidade
      if (this.config.ttsModel && finalMessage.shouldSpeak && finalMessage.message) {
        const audioResult = await this.synthesizeSpeechAudio(finalMessage.message, apiKey);
        if (audioResult) {
          finalMessage.audioBase64 = audioResult.data;
          finalMessage.mimeType = audioResult.mimeType;
        }
      }

      return finalMessage;
    } catch (err) {
      console.warn('[GeminiClient] Falha na requisição, utilizando fallback:', err);
      return this.generateOfflineFallback(context);
    }
  }

  /**
   * Converte o texto gerado em áudio humano e dinâmico usando o Gemini 3.8 Flash TTS
   */
  private async synthesizeSpeechAudio(
    text: string,
    apiKey: string
  ): Promise<{ data: string; mimeType: string } | null> {
    try {
      const ttsModel = this.config.ttsModel || 'gemini-3.8-flash-tts';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${ttsModel}:generateContent`;

      const ttsBody = {
        contents: [
          {
            parts: [{ text }]
          }
        ],
        generationConfig: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: this.config.voiceName || 'Puck'
              }
            }
          }
        }
      };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey
        },
        body: JSON.stringify(ttsBody)
      });

      if (!res.ok) {
        console.warn(`[GeminiClient TTS] Falha ao sintetizar áudio (${res.status})`);
        return null;
      }

      const ttsData = await res.json();
      const inlineData = ttsData?.candidates?.[0]?.content?.parts?.[0]?.inlineData;

      if (inlineData?.data) {
        return {
          data: inlineData.data,
          mimeType: inlineData.mimeType || 'audio/wav'
        };
      }
    } catch (err) {
      console.warn('[GeminiClient TTS] Erro ao sintetizar áudio:', err);
    }
    return null;
  }

  /**
   * Respostas pré-calibradas do Claudinho Ronaldo caso a rede falhe ou a chave não esteja definida.
   */
  private generateOfflineFallback(context: GeminiRaceContext): RadioMessageOutput {
    const driver = context.driverName || 'Gabriel';

    switch (context.event) {
      case 'OVERTAKE':
      case 'POSITION_GAINED':
        return {
          shouldSpeak: true,
          message: `CARALHO, QUE PASSADA! É disso que eu tô falando, ${driver}, porra!`,
          tone: 'celebratory',
          category: 'overtake',
          priority: 'HIGH'
        };
      case 'POSITION_LOST':
        return {
          shouldSpeak: true,
          message: `Perdeu a posição, ${driver}! Acorda pra vida e vai buscar essa merda!`,
          tone: 'urgent',
          category: 'gap',
          priority: 'HIGH'
        };
      case 'SAFETY_CAR':
        return {
          shouldSpeak: true,
          message: 'Safety Car na pista! Segura essa porra e respeita o delta positivo!',
          tone: 'urgent',
          category: 'safety_car',
          priority: 'CRITICAL'
        };
      case 'VSC':
        return {
          shouldSpeak: true,
          message: 'VSC acionado! Alivia o pé, olha o delta no volante, caralho!',
          tone: 'urgent',
          category: 'safety_car',
          priority: 'CRITICAL'
        };
      case 'RED_FLAG':
        return {
          shouldSpeak: true,
          message: 'Bandeira Vermelha! Para a palhaçada e traz essa carroça pros boxes.',
          tone: 'urgent',
          category: 'safety_car',
          priority: 'CRITICAL'
        };
      case 'CAR_DAMAGE':
        return {
          shouldSpeak: true,
          message: `Puta que pariu, ${driver}! Quebrou a asa?! Que cagada foi essa, caralho?!`,
          tone: 'urgent',
          category: 'damage',
          priority: 'CRITICAL'
        };
      case 'PENALTY':
        return {
          shouldSpeak: true,
          message: `Tomou punição de graça, porra! Para de cortar curva feito maluco!`,
          tone: 'urgent',
          category: 'penalty',
          priority: 'CRITICAL'
        };
      case 'TYRE_WEAR_CRITICAL':
        return {
          shouldSpeak: true,
          message: `Esse pneu tá uma bosta lisa, ${driver}! Box logo nessa porra!`,
          tone: 'tactical',
          category: 'tyres',
          priority: 'STRATEGIC'
        };
      case 'TYRE_WEAR_WARNING':
        return {
          shouldSpeak: true,
          message: 'Pneus já tão na metade da vida. Para de fritar borracha à toa!',
          tone: 'tactical',
          category: 'tyres',
          priority: 'STRATEGIC'
        };
      case 'FASTEST_LAP':
        return {
          shouldSpeak: true,
          message: 'Puta que pariu, melhor volta da corrida! Voou baixo agora, moleque!',
          tone: 'celebratory',
          category: 'pace',
          priority: 'HIGH'
        };
      case 'CALM_RACE':
        return {
          shouldSpeak: true,
          message: `Pista limpa na sua frente, ${driver}. Mantém esse ritmo e cuida dos pneus.`,
          tone: 'calm',
          category: 'pace',
          priority: 'INFORMATIONAL'
        };
      case 'TYRE_TEMP_HIGH':
        return {
          shouldSpeak: true,
          message: `Temperatura dos pneus subindo, ${driver}. Alivia nas curvas rápidas.`,
          tone: 'tactical',
          category: 'tyres',
          priority: 'STRATEGIC'
        };
      case 'BRAKE_TEMP_HIGH':
        return {
          shouldSpeak: true,
          message: `Temperatura dos freios no limite, ${driver}. Alivia na freada.`,
          tone: 'urgent',
          category: 'damage',
          priority: 'HIGH'
        };
      case 'FUEL_LOW':
        return {
          shouldSpeak: true,
          message: `Combustível no limite negativo, ${driver}. Faz lift and coast nessa volta.`,
          tone: 'tactical',
          category: 'fuel',
          priority: 'STRATEGIC'
        };
      case 'ERS_FULL':
        return {
          shouldSpeak: true,
          message: `Bateria cheia, ${driver}! Solta o modo ultrapassagem na reta!`,
          tone: 'celebratory',
          category: 'pace',
          priority: 'HIGH'
        };
      case 'LAP_PACE':
        return {
          shouldSpeak: true,
          message: `Bela volta, ${driver}! Mantém esse ritmo constante.`,
          tone: 'calm',
          category: 'pace',
          priority: 'INFORMATIONAL'
        };
      default:
        return {
          shouldSpeak: true,
          message: `${driver}, ritmo tá constante e sob controle. Foca no traçado.`,
          tone: 'calm',
          category: 'general',
          priority: 'INFORMATIONAL'
        };
    }
  }
}
