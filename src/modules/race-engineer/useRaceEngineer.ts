import { useEffect, useRef, useState, useCallback } from 'react';
import { TelemetryStore, RaceState, RaceEvent } from '@f1-dash/telemetry-core';
import { EngineerBrain } from './brain/engineer-brain';
import { GeminiEngineerClient } from './ai/gemini-client';
import { RadioPlayer } from './audio/radio-player';
import {
  RaceEngineerConfig,
  DEFAULT_RACE_ENGINEER_CONFIG
} from './config/engineer-config';
import { RadioMessageOutput, GeminiRaceContext } from './brain/types';

export function useRaceEngineer(customConfig?: Partial<RaceEngineerConfig>) {
  const configRef = useRef<RaceEngineerConfig>({
    ...DEFAULT_RACE_ENGINEER_CONFIG,
    ...customConfig,
    personality: {
      ...DEFAULT_RACE_ENGINEER_CONFIG.personality,
      ...customConfig?.personality
    },
    audio: {
      ...DEFAULT_RACE_ENGINEER_CONFIG.audio,
      ...customConfig?.audio
    },
    cooldown: {
      ...DEFAULT_RACE_ENGINEER_CONFIG.cooldown,
      ...customConfig?.cooldown
    }
  });

  const brainRef = useRef<EngineerBrain>(new EngineerBrain(configRef.current));
  const aiClientRef = useRef<GeminiEngineerClient>(new GeminiEngineerClient(configRef.current.ai));
  const playerRef = useRef<RadioPlayer>(new RadioPlayer(configRef.current.audio));

  const [currentMessage, setCurrentMessage] = useState<RadioMessageOutput | null>(null);
  const [isRadioActive, setIsRadioActive] = useState<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);

  // Executa uma mensagem de rádio completa (chamada AI + reprodução + UI)
  const dispatchRadioTransmission = useCallback(async (context: GeminiRaceContext) => {
    if (isProcessingRef.current || playerRef.current.getIsPlaying()) {
      return;
    }
    isProcessingRef.current = true;

    try {
      // 1. Gera mensagem curta com Gemini AI Studio (ou fallback offline instantâneo)
      const radioMsg = await aiClientRef.current.generateRadioMessage(context);

      if (!radioMsg.shouldSpeak || !radioMsg.message) {
        isProcessingRef.current = false;
        return;
      }

      setCurrentMessage(radioMsg);
      setIsRadioActive(true);

      // Notifica o Brain para registrar o cooldown
      brainRef.current.onMessageSpoken(radioMsg, context.event);

      // 2. Toca a sequência sonora: Abertura -> Voz -> Fechamento Sutil
      await playerRef.current.playRadioMessage(radioMsg, {
        onTransmissionEnd: () => {
          // Mantém a mensagem visível por mais 1.5s após o áudio para leitura confortável
          setTimeout(() => {
            setIsRadioActive(false);
            setCurrentMessage(null);
            isProcessingRef.current = false;
          }, 1500);
        }
      });
    } catch (err) {
      console.warn('[useRaceEngineer] Falha na transmissão do rádio:', err);
      setIsRadioActive(false);
      setCurrentMessage(null);
      isProcessingRef.current = false;
    }
  }, []);

  // Monitora TelemetryStore e Eventos de Corrida
  useEffect(() => {
    const store = TelemetryStore.getInstance();

    // 1. Ouve eventos discretos do RaceEventBus (Overtake, Safety Car, Red Flag, Danos)
    const unsubEvents = store.getEventBus().subscribe((event: RaceEvent) => {
      const state = store.getState();
      const decision = brainRef.current.evaluateRaceEvent(event, state);
      if (decision.shouldTriggerGemini && decision.context) {
        dispatchRadioTransmission(decision.context);
      }
    });

    // 2. Verificação periódica do RaceState (a cada 1 segundo) para desgaste de pneus e ritmo
    const interval = setInterval(() => {
      const state = store.getState();
      const decision = brainRef.current.evaluateContinuousState(state);
      if (decision.shouldTriggerGemini && decision.context) {
        dispatchRadioTransmission(decision.context);
      }
    }, 1000);

    return () => {
      unsubEvents();
      clearInterval(interval);
      playerRef.current.stop();
    };
  }, [dispatchRadioTransmission]);

  // Função manual para testar o rádio a qualquer momento na interface
  const triggerManualTest = useCallback((eventType: string = 'OVERTAKE') => {
    const store = TelemetryStore.getInstance();
    const state = store.getState();

    const mockContext: GeminiRaceContext = {
      event: eventType,
      priority: eventType === 'OVERTAKE' ? 'HIGH' : 'CRITICAL',
      lap: state.timing.currentLap || 14,
      totalLaps: state.timing.totalLaps || 53,
      position: state.timing.carPosition || 4,
      driverName: configRef.current.personality.driverName,
      engineerName: configRef.current.personality.name,
      speedKmH: Math.round(state.car.speed || 285),
      rivalName: 'Hamilton',
      additionalDetail: 'Ultrapassagem na freada da curva 1'
    };

    dispatchRadioTransmission(mockContext);
  }, [dispatchRadioTransmission]);

  const updateApiKey = useCallback((key: string) => {
    configRef.current.ai.apiKey = key;
    aiClientRef.current.updateApiKey(key);
  }, []);

  return {
    isRadioActive,
    currentMessage,
    triggerManualTest,
    updateApiKey,
    config: configRef.current
  };
}
