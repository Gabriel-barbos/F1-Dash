import {
  CockpitTelemetryState,
  PitStatus,
  SafetyCarStatus,
  SessionType,
  VisualTyreCompound,
  Weather
} from '@f1-dash/telemetry-core';
import { mobileAudioPlayer } from './mobile-audio-player';
import { getClaudinhoClip } from './claudinho-clips';

const API_KEY = 'AQ.Ab8RN6LgIEBTDjoOU0k7dj_BYMD9Slh6fjVUuZWpuS82HOCyyA';

const CLAUDINHO_SYSTEM_PROMPT = `
Você é o "Claudinho Ronaldo", engenheiro de corrida brasileiro de Fórmula 1 e parceiro de equipe de confiança do piloto Gabriel.

DIRETRIZES DA SUA FALA NO RÁDIO:
1. FOCO TÉCNICO E CONTEXTO REAL: Dê informações úteis, concretas e coerentes com o momento da corrida (tipo de sessão, boxes, safety car, clima, desgaste dos pneus, temperatura, combustível, ritmo de volta, gaps e punições). NUNCA diga que o piloto fez volta mais rápida se ele não detém a volta mais rápida da sessão, e NUNCA reclame de perda de posição se ele estiver nos boxes.
2. PERSONALIDADE, RESENHA E PIADAS DO GRID:
   - Em momentos calmos (CALM_RACE, LAP_PACE) ou de comemoração/ultrapassagem, você pode ocasionalmente soltar piadas rápidas de automobilismo ou zoar pilotos do grid da F1 (Verstappen, Hamilton, Leclerc, Norris, Piastri, Alonso, Sainz, Russell, Stroll, Tsunoda, Bortoleto, etc.), mantendo o ritmo de rádio curto.
3. USO EQUILIBRADO DE PALAVRÕES (NÃO FORCE):
   - Palavrões ("porra", "caralho", "merda", "puta que pariu") devem ser usados COM PARCIMÔNIA, EXCLUSIVAMENTE em momentos de impacto real ou alta adrenalina: batida forte, dano grave, bandeira vermelha ou ultrapassagem no limite.
   - Em situações normais, calmas ou informativas, seja firme, técnico, motivador e bem-humorado.
4. PROIBIDO REPETIR BORDÕES:
   - NUNCA use frases clichês repetitivas como "lata velha", "passeio de domingo" ou similares.
5. FORMATO:
   - Resposta curta de rádio: entre 8 e 16 palavras (máximo 4 a 5 segundos de fala).
   - Responda APENAS com o texto da fala no rádio, sem aspas, sem asteriscos, sem emojis e sem explicações.
`;

const TTS_MODELS = [
  'gemini-3.8-flash-tts',
  'gemini-3.8-flash-lite-tts',
  'gemini-2.5-flash-preview-tts'
];

/** Tempo máximo total (texto + voz) antes de cair no clipe local, para o rádio nunca chegar atrasado. */
const AI_TOTAL_BUDGET_MS = 6500;

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

    const sessionLabel =
      telemetry.sessionType === SessionType.Qualifying1 ||
      telemetry.sessionType === SessionType.Qualifying2 ||
      telemetry.sessionType === SessionType.Qualifying3 ||
      telemetry.sessionType === SessionType.ShortQualifying ||
      telemetry.sessionType === SessionType.OneShotQualifying
        ? 'Classificação'
        : telemetry.sessionType === SessionType.Practice1 ||
            telemetry.sessionType === SessionType.Practice2 ||
            telemetry.sessionType === SessionType.Practice3 ||
            telemetry.sessionType === SessionType.ShortPractice
          ? 'Treino Livre'
          : telemetry.sessionType === SessionType.TimeTrial
            ? 'Time Trial'
            : 'Corrida';

    const isPitting =
      telemetry.pitStatus === PitStatus.Pitting ||
      telemetry.pitStatus === PitStatus.InPitArea ||
      !!telemetry.pitLimiterActive;

    const scLabel = telemetry.isRedFlagActive
      ? 'BANDEIRA VERMELHA'
      : telemetry.safetyCarStatus === SafetyCarStatus.Full
        ? 'Safety Car na pista'
        : telemetry.safetyCarStatus === SafetyCarStatus.Virtual
          ? 'Virtual Safety Car (VSC)'
          : telemetry.safetyCarStatus === SafetyCarStatus.FormationLap
            ? 'Volta de apresentação'
            : 'Pista livre (bandeira verde)';

    const weatherLabel =
      telemetry.weather === Weather.Storm || telemetry.weather === Weather.HeavyRain
        ? 'Chuva forte'
        : telemetry.weather === Weather.LightRain
          ? 'Chuva leve'
          : telemetry.weather === Weather.Overcast
            ? 'Nublado'
            : 'Seco';

    const compoundLabel =
      telemetry.visualTyreCompound === VisualTyreCompound.F1_Soft
        ? 'Macio'
        : telemetry.visualTyreCompound === VisualTyreCompound.F1_Medium
          ? 'Médio'
          : telemetry.visualTyreCompound === VisualTyreCompound.F1_Hard
            ? 'Duro'
            : telemetry.visualTyreCompound === VisualTyreCompound.F1_Inter
              ? 'Intermediário'
              : telemetry.visualTyreCompound === VisualTyreCompound.F1_Wet
                ? 'Chuva Extrema'
                : undefined;

    const parts: string[] = [
      `Evento detectado: ${eventScenario}`,
      `Sessão: ${sessionLabel} | Status: ${scLabel} | Clima: ${weatherLabel}`,
      `Piloto: ${driverName}`,
      `Posição: P${telemetry.carPosition || 1} (Volta ${telemetry.currentLapNum || 1}${telemetry.totalLaps ? `/${telemetry.totalLaps}` : ''})`
    ];

    if (isPitting) parts.push(`Nos boxes / Pit Lane (paradas: ${telemetry.numPitStops ?? 0})`);
    if (compoundLabel) parts.push(`Pneu: ${compoundLabel} (${telemetry.tyresAgeLaps ?? 0} voltas de uso)`);
    if (lastLap) parts.push(`Última volta: ${lastLap} (Melhor pessoal: ${bestLap || lastLap})`);
    if (telemetry.isPlayerFastestLap) parts.push(`Dono da volta mais rápida da sessão até agora`);
    if (gapFront) parts.push(`Gap pro carro da frente: ${gapFront}`);
    if (gapBehind) parts.push(`Gap pro carro de trás: ${gapBehind}`);
    if (tyreWear !== undefined) parts.push(`Desgaste máx dos pneus: ${tyreWear}%`);
    if (tyreTemp !== undefined) parts.push(`Temp pneus: ${tyreTemp}°C`);
    if (brakeTemp !== undefined) parts.push(`Temp freios: ${brakeTemp}°C`);
    if (fuelLaps) parts.push(`Combustível restante: ${fuelLaps}`);
    if (ersPct) parts.push(`Bateria ERS: ${ersPct}`);
    if (telemetry.penalties && telemetry.penalties > 0) parts.push(`Punições acumuladas: ${telemetry.penalties}s`);
    const wingDmg = Math.max(telemetry.frontLeftWingDamage ?? 0, telemetry.frontRightWingDamage ?? 0);
    if (wingDmg > 0 || (telemetry.floorDamage ?? 0) > 0) {
      parts.push(`Danos: asa dianteira ${wingDmg}%, assoalho ${telemetry.floorDamage ?? 0}%`);
    }

    return `DADOS DA CORRIDA:\n${parts.join('\n')}\n\nInstrução: Dê uma instrução útil e direta ao piloto usando os dados acima. Respeite o contexto da sessão e pista. Em momentos calmos (CALM_RACE, LAP_PACE), pode mandar uma resenha rápida ou piada leve sobre pilotos do grid da F1. Palavrão SOMENTE se for batida, bandeira vermelha ou perigo iminente.`;
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

    try {
      const userPromptText = this.buildTelemetryPrompt(eventScenario, driverName, telemetry);
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
  private async fetchVoice(text: string, deadline: number = Date.now() + AI_TOTAL_BUDGET_MS): Promise<string | null> {
    const body = JSON.stringify({
      contents: [{ parts: [{ text }] }],
      generationConfig: {
        responseModalities: ['AUDIO'],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
      }
    });

    for (const model of TTS_MODELS) {
      const remaining = deadline - Date.now();
      if (remaining < 800) {
        console.warn('[ClaudinhoMobile] Orçamento de tempo da IA esgotado, usando clipe local.');
        return null;
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), Math.min(3500, remaining));
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
      // 1. CAMINHO DA IA (isolado): qualquer erro aqui cai no fallback local, nunca em silêncio
      let generatedText: string | null = null;
      let dynamicWavBase64: string | null = null;
      try {
        const deadline = Date.now() + AI_TOTAL_BUDGET_MS;
        generatedText = await this.fetchText(eventScenario, driverName, telemetry);
        if (generatedText && Date.now() < deadline) {
          dynamicWavBase64 = await this.fetchVoice(generatedText, deadline);
        }
      } catch (aiErr) {
        console.warn('[ClaudinhoMobile] Caminho IA falhou, usando clipe local:', aiErr);
        generatedText = null;
        dynamicWavBase64 = null;
      }

      let playedDynamic = false;
      if (generatedText && dynamicWavBase64) {
        try {
          finalMessage = generatedText;
          callbacks.onStart?.(generatedText);
          await mobileAudioPlayer.playRadioBeep();
          playedDynamic = await mobileAudioPlayer.playVoice(dynamicWavBase64, {
            onPlaybackStart: callbacks.onVoiceStart
          });
        } catch (playErr) {
          console.warn('[ClaudinhoMobile] Falha ao tocar voz dinâmica, usando clipe local:', playErr);
          playedDynamic = false;
        }
      }

      if (!playedDynamic) {
        // 2. FALLBACK GARANTIDO: clipe autêntico local (Puck) em memória
        console.log(`[ClaudinhoMobile] 🛡️ Ativando áudio autêntico local do Claudinho para ${eventScenario}...`);
        const clip = getClaudinhoClip(eventScenario, driverName);
        finalMessage = clip.text;
        callbacks.onStart?.(clip.text);
        await mobileAudioPlayer.playRadioBeep();
        const assetOk = await mobileAudioPlayer.playAsset(
          clip.asset,
          clip.envelope,
          clip.durationMs,
          { onPlaybackStart: callbacks.onVoiceStart }
        );
        if (!assetOk) {
          await mobileAudioPlayer.playSpeechFallback(finalMessage, { onPlaybackStart: callbacks.onVoiceStart });
        }
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
