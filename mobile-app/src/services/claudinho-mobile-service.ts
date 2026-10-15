import { CockpitTelemetryState } from '@f1-dash/telemetry-core';
import { mobileAudioPlayer } from './mobile-audio-player';
import { getClaudinhoClip, ClaudinhoClip } from './claudinho-clips';

const API_KEY = 'AQ.Ab8RN6LgIEBTDjoOU0k7dj_BYMD9Slh6fjVUuZWpuS82HOCyyA';

const CLAUDINHO_SYSTEM_PROMPT = `
Você é o "Claudinho Ronaldo", engenheiro de corrida brasileiro de Fórmula 1 e parceiro de equipe de confiança do piloto Gabriel.

DIRETRIZES DA SUA FALA NO RÁDIO:
1. FOCO TÉCNICO E INFORMATIVO: Dê sempre informações úteis, concretas e acionáveis baseadas nos dados reais da telemetria enviados (desgaste dos pneus, temperatura, combustível, ritmo de volta, gaps de DRS e tráfego).
2. USO EQUILIBRADO DE PALAVRÕES (NÃO FORCE):
   - Palavrões ("porra", "caralho", "merda", "puta que pariu") devem ser usados COM PARCIMÔNIA, EXCLUSIVAMENTE em momentos de impacto real ou alta adrenalina: batida forte, dano grave, susto violento, bandeira vermelha ou ultrapassagem no limite.
   - Em situações normais, calmas ou informativas (pneus, combustível, ritmo, gaps, boxes de rotina), NÃO use palavrões forçados. Seja firme, técnico, motivador e parceiro, usando gírias automobilísticas naturais do Brasil ("boa moleque", "olho no espelho", "administra a borracha", "traciona forte", "ritmo constante", "tempo roxo").
3. PROIBIDO REPETIR BORDÕES:
   - NUNCA use frases clichês repetitivas como "lata velha", "passeio de domingo" ou similares. Seja sempre variado e baseado nos dados do momento.
4. FORMATO:
   - Resposta curta de rádio: entre 8 e 14 palavras (máximo 4 a 5 segundos de fala).
   - Responda APENAS com o texto da fala no rádio, sem aspas, sem asteriscos, sem emojis e sem explicações.
`;

const TTS_MODELS = [
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
  'gemini-2.5-flash-preview-tts'
];

export interface RadioTransmissionResult {
  message: string;
  tone: string;
  priority: string;
  category: string;
}

export interface RadioCallbacks {
  /** Disparado no exato instante em que o áudio já está carregado e o rádio abre. */
  onStart?: (text: string) => void;
  /** Disparado no instante em que a voz começa a tocar (com envelope de ondas). */
  onVoiceStart?: (info: { envelope: number[]; durationMs: number; startedAt: number }) => void;
  onEnd?: () => void;
}

export class ClaudinhoMobileService {
  private isTransmitting = false;
  private rateLimitUntil = 0;

  /**
   * Constrói o contexto com dados reais da telemetria para a IA.
   */
  private buildTelemetryPrompt(eventScenario: string, driverName: string, telemetry?: Partial<CockpitTelemetryState>): string {
    if (!telemetry) {
      return `Situação na corrida: ${eventScenario}. O piloto se chama ${driverName}. Dê uma orientação de rádio útil, curta e direta baseada na situação.`;
    }

    const tyreWear = telemetry.tyresWear && telemetry.tyresWear.length >= 4 ? Math.max(...telemetry.tyresWear) : undefined;
    const tyreTemp = telemetry.tyresSurfaceTemperature && telemetry.tyresSurfaceTemperature.length >= 4 ? Math.max(...telemetry.tyresSurfaceTemperature) : undefined;
    const brakeTemp = telemetry.brakesTemperature && telemetry.brakesTemperature.length >= 4 ? Math.max(...telemetry.brakesTemperature) : undefined;
    const lastLap = telemetry.lastLapTimeInMS && telemetry.lastLapTimeInMS > 0 ? `${(telemetry.lastLapTimeInMS / 1000).toFixed(2)}s` : undefined;
    const bestLap = telemetry.bestLapTimeInMS && telemetry.bestLapTimeInMS > 0 ? `${(telemetry.bestLapTimeInMS / 1000).toFixed(2)}s` : undefined;
    const gapFront = telemetry.deltaToCarInFrontInMS && telemetry.deltaToCarInFrontInMS > 0 ? `${(telemetry.deltaToCarInFrontInMS / 1000).toFixed(1)}s` : undefined;
    const gapBehind = telemetry.deltaToCarBehindInMS && telemetry.deltaToCarBehindInMS > 0 ? `${(telemetry.deltaToCarBehindInMS / 1000).toFixed(1)}s` : undefined;
    const fuelLaps = telemetry.fuelRemainingLaps !== undefined ? `${telemetry.fuelRemainingLaps >= 0 ? '+' : ''}${telemetry.fuelRemainingLaps.toFixed(1)} voltas` : undefined;
    const ersPct = telemetry.ersPercentage !== undefined ? `${Math.round(telemetry.ersPercentage)}%` : undefined;

    const parts: string[] = [
      `Evento detectado: ${eventScenario}`,
      `Piloto: ${driverName}`,
      `Posição: P${telemetry.carPosition || 1} (Volta ${telemetry.currentLapNum || 1}${telemetry.totalLaps ? `/${telemetry.totalLaps}` : ''})`
    ];

    if (lastLap) parts.push(`Última volta: ${lastLap} (Melhor pessoal: ${bestLap || lastLap})`);
    if (gapFront) parts.push(`Gap pro carro da frente: ${gapFront}`);
    if (gapBehind) parts.push(`Gap pro carro de trás: ${gapBehind}`);
    if (tyreWear !== undefined) parts.push(`Desgaste máx dos pneus: ${tyreWear}%`);
    if (tyreTemp !== undefined) parts.push(`Temp pneus: ${tyreTemp}°C`);
    if (brakeTemp !== undefined) parts.push(`Temp freios: ${brakeTemp}°C`);
    if (fuelLaps) parts.push(`Combustível restante: ${fuelLaps}`);
    if (ers) parts.push(`Bateria ERS: ${ersPct}`);

    return `DADOS DA CORRIDA:\n${parts.join('\n')}\n\nInstrução: Dê uma instrução útil e direta ao piloto usando os dados acima. Se for uma situação de corrida normal/calma, informe sobre pneus, combustível, ritmo ou gaps. Seja parceiro e técnico. Palavrão SOMENTE se for batida ou perigo iminente. Nunca use frases clichês como "lata velha".`;
  }

  /**
   * Gera texto dinâmico espontâneo e útil com o Gemini 3.8 Flash.
   */
  private async fetchText(eventScenario: string, driverName: string, telemetry?: Partial<CockpitTelemetryState>): Promise<string | null> {
    if (Date.now() < this.rateLimitUntil) {
      return null; // Quota em cooldown: usa fallback local instantâneo sem travar o Wi-Fi
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2800);
    const userPromptText = this.buildTelemetryPrompt(eventScenario, driverName, telemetry);

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
                    text: userPromptText
                  }
                ]
              }
            ]
          })
        }
      );
      if (!res.ok) {
        if (res.status === 429) {
          this.rateLimitUntil = Date.now() + 60000; // 60s de cooldown para evitar retenção de rede
        }
        console.warn('[ClaudinhoMobile] Texto Gemini 3.8 status:', res.status);
        return null;
      }
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.text)?.text?.trim();
      return text ? text.replace(/^["']|["']$/g, '') : null;
    } catch (err) {
      console.warn('[ClaudinhoMobile] Texto Gemini 3.8 falhou (usará biblioteca local):', err);
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Sintetiza voz oficial Puck via Gemini TTS com fallback sequencial entre modelos da cota.
   */
  private async fetchVoice(text: string): Promise<string | null> {
    const body = JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
      }
    });

    for (const model of TTS_MODELS) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
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
        if (res.status === 200) {
          const json = await res.json();
          const data = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
          if (data) {
            console.log(`[ClaudinhoMobile] 🔊 Voz dinâmica gerada com sucesso via ${model}!`);
            return data;
          }
        } else {
          console.warn(`[ClaudinhoMobile] ${model} status ${res.status} (tentando próximo modelo)...`);
        }
      } catch (err) {
        console.warn(`[ClaudinhoMobile] Falha ao sintetizar com ${model}:`, err);
      } finally {
        clearTimeout(timer);
      }
    }
    return null;
  }

  /**
   * Reproduz um rádio pré-gerado vindo do PC Relay ou evento de rede.
   */
  public async playDirectRadio(
    eventScenario: string,
    text: string,
    wavBase64?: string,
    optionsOrCallbacks?: {
      envelope?: number[];
      durationMs?: number;
      dspApplied?: boolean;
    } | RadioCallbacks,
    maybeCallbacks?: RadioCallbacks
  ): Promise<void> {
    if (this.isTransmitting) return;
    this.isTransmitting = true;

    const isOptionObj =
      optionsOrCallbacks &&
      !('onStart' in optionsOrCallbacks || 'onVoiceStart' in optionsOrCallbacks || 'onEnd' in optionsOrCallbacks);

    const options = isOptionObj
      ? (optionsOrCallbacks as { envelope?: number[]; durationMs?: number; dspApplied?: boolean })
      : undefined;

    const callbacks: RadioCallbacks = (isOptionObj
      ? maybeCallbacks
      : (optionsOrCallbacks as RadioCallbacks)) || {};

    try {
      if (wavBase64) {
        // Áudio dinâmico recebido: só abre o rádio no visor com o áudio pronto
        callbacks.onStart?.(text);
        await mobileAudioPlayer.playRadioBeep();
        await mobileAudioPlayer.playVoice(
          wavBase64,
          { onPlaybackStart: callbacks.onVoiceStart },
          {
            envelope: options?.envelope,
            durationMs: options?.durationMs,
            dspAlreadyApplied: options?.dspApplied
          }
        );
      } else {
        // Se não tiver WAV, usa o clipe de áudio autêntico em memória (sem robô)
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
   * Dispara o rádio autônomo do Claudinho Ronaldo.
   *
   * FLUXO INTELIGENTE:
   * 1. FONTE PRINCIPAL: Tenta gerar fala inédita com Gemini Flash + Gemini TTS (multi-modelo).
   * 2. ZERO SILÊNCIO: Só abre o rádio e toca o bipe DEPOIS que o áudio já estiver pronto na memória.
   * 3. FALLBACK DE ALTA QUALIDADE: Se a internet oscilar, timeout ou todos os modelos atingirem 429,
   *    recorre imediatamente à biblioteca local de 27 áudios oficiais (Puck + DSP).
   * 4. ZERO VOZ ROBÓTICA: Nunca utiliza síntese robótica do Android.
   */
  public async triggerRadio(
    eventScenario: string = 'OVERTAKE',
    driverName: string = 'Gabriel',
    callbacks: RadioCallbacks = {},
    telemetry?: Partial<CockpitTelemetryState>
  ): Promise<RadioTransmissionResult> {
    if (this.isTransmitting) {
      return { message: '', tone: 'calm', priority: 'LOW', category: eventScenario };
    }
    this.isTransmitting = true;

    let finalMessage = '';

    try {
      // 1. Tenta obter fala dinâmica inédita e informativa via Gemini Flash
      let generatedText = await this.fetchText(eventScenario, driverName, telemetry);
      let dynamicWavBase64: string | null = null;

      if (generatedText) {
        // 2. Se obteve texto, tenta sintetizar voz oficial com a esteira multi-modelos
        dynamicWavBase64 = await this.fetchVoice(generatedText);
      }

      // 3. SE CONSEGUIU ÁUDIO DINÂMICO VIA IA:
      if (generatedText && dynamicWavBase64) {
        finalMessage = generatedText;
        // Só abre a barra no rádio AGORA que a voz está pronta!
        callbacks.onStart?.(generatedText);
        // Toca o bipe oficial
        await mobileAudioPlayer.playRadioBeep();
        // Toca a voz gerada com o DSP de capacete aplicado
        await mobileAudioPlayer.playVoice(dynamicWavBase64, { onPlaybackStart: callbacks.onVoiceStart });
      } else {
        // 4. FALLBACK INTELIGENTE (se a API falhar, der 429 ou timeout):
        console.log(`[ClaudinhoMobile] 🛡️ Ativando áudio autêntico local do Claudinho para ${eventScenario}...`);
        const clip = getClaudinhoClip(eventScenario, driverName);
        finalMessage = clip.text;

        // Só abre a barra no rádio com o clipe pronto em memória!
        callbacks.onStart?.(clip.text);
        // Toca o bipe oficial
        await mobileAudioPlayer.playRadioBeep();
        // Toca o áudio autêntico oficial do Puck
        await mobileAudioPlayer.playAsset(
          clip.asset,
          clip.envelope,
          clip.durationMs,
          { onPlaybackStart: callbacks.onVoiceStart }
        );
      }

      return { message: finalMessage, tone: 'celebratory', priority: 'HIGH', category: eventScenario };
    } catch (err) {
      console.warn('[ClaudinhoMobile] Erro durante a transmissão do rádio:', err);
      return { message: '', tone: 'calm', priority: 'LOW', category: eventScenario };
    } finally {
      this.isTransmitting = false;
      callbacks.onEnd?.();
    }
  }
}

export const claudinhoMobileService = new ClaudinhoMobileService();
