/**
 * Configurações Centrais do Módulo Race Engineer (Claudinho Ronaldo)
 * F1 Dash - Team Radio Virtual
 */

export interface RadioAudioConfig {
  /** Habilita ou desabilita o efeito sonoro de rádio na voz */
  enabled: boolean;
  /** Intensidade do efeito de rádio (0.0 = voz limpa, 1.0 = rádio clássico). Padrão sutil: 0.35 */
  subtleLevel: number;
  /** Frequência de corte inferior (remove sub-graves sem afinar a voz). Padrão: 320Hz */
  highpassCutoff: number;
  /** Frequência de corte superior (corta agudos excessivos com suavidade). Padrão: 4200Hz */
  lowpassCutoff: number;
  /** Toca o efeito sutil de rádio no fechamento (bip suave + microestática) */
  playClosingBeep: boolean;
  /** Volume do som de fechamento (0.0 a 1.0) */
  closingBeepVolume: number;
  /** Caminho do asset oficial de abertura configurado pelo usuário */
  openingAssetUri: string;
}

export interface EngineerPersonalityConfig {
  /** Nome do Engenheiro no Rádio */
  name: string;
  /** Nome do Piloto */
  driverName: string;
  /** Nível de zoeira/humor em momentos de calmaria (0 a 10) */
  humorLevel: number;
  /** Grau de urgência em disputas e incidentes (0 a 10) */
  urgencyLevel: number;
  /** Identidade visual do engenheiro / cockpit */
  theme: {
    primaryTerracotta: string;   // Ex: #E05A36 (Terracota vivo)
    secondaryTerracotta: string; // Ex: #B84A28 (Terracota escuro)
    accentOrange: string;        // Ex: #FF7043 (Laranja destaque)
    darkBackground: string;      // Ex: #12100E (Fundo cockpit com tom terracota)
    glowColor: string;           // Ex: rgba(224, 90, 54, 0.4)
  };
}

export interface GeminiAiConfig {
  /** Chave de API do Google AI Studio */
  apiKey: string;
  /** Modelo de texto e raciocínio de resenha */
  model: string;
  /** Modelo de síntese de voz TTS humana oficial do Google AI Studio */
  ttsModel: string;
  /** Nome da voz do Google: 'Puck' (enérgico), 'Charon' (grave), 'Fenrir' (pesado), 'Aoede' (suave) */
  voiceName: string;
  /** Temperatura de amostragem criativa */
  temperature: number;
}

export interface CooldownConfig {
  /** Intervalo mínimo geral entre falas (em segundos). Padrão: 22s */
  minSecondsBetweenMessages: number;
  /** Máximo de mensagens comuns por volta. Padrão: 1 */
  maxRoutineMessagesPerLap: number;
  /** Cooldown específico para mensagens de humor/calmaria (em segundos). Padrão: 120s */
  funCooldownSeconds: number;
}

export interface RaceEngineerConfig {
  enabled: boolean;
  personality: EngineerPersonalityConfig;
  ai: GeminiAiConfig;
  audio: RadioAudioConfig;
  cooldown: CooldownConfig;
}

export const DEFAULT_RACE_ENGINEER_CONFIG: RaceEngineerConfig = {
  enabled: true,
  personality: {
    name: 'Claudinho Ronaldo',
    driverName: 'Gabriel',
    humorLevel: 8,
    urgencyLevel: 10,
    theme: {
      primaryTerracotta: '#E05A36',
      secondaryTerracotta: '#B84A28',
      accentOrange: '#FF7043',
      darkBackground: '#141110',
      glowColor: 'rgba(224, 90, 54, 0.35)'
    }
  },
  ai: {
    apiKey: 'AQ.Ab8RN6LgIEBTDjoOU0k7dj_BYMD9Slh6fjVUuZWpuS82HOCyyA',
    model: 'gemini-3.8-flash',
    ttsModel: 'gemini-3.8-flash-tts',
    voiceName: 'Puck', // Puck: Voz masculina jovem, ágil e perfeita para resenha e palavrão
    temperature: 0.75
  },
  audio: {
    enabled: true,
    subtleLevel: 0.35, // Efeito sutil e natural de rádio
    highpassCutoff: 320,
    lowpassCutoff: 4200,
    playClosingBeep: true,
    closingBeepVolume: 0.25,
    openingAssetUri: '/assets/sounds/f1-radio-beep.mp3'
  },
  cooldown: {
    minSecondsBetweenMessages: 20,
    maxRoutineMessagesPerLap: 1,
    funCooldownSeconds: 120
  }
};
