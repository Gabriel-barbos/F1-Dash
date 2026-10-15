import { CockpitTelemetryState } from '@f1-dash/telemetry-core';

export type AmbientLightingMode = 'DAY' | 'NIGHT';
export type WeatherLightingMode = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'STORM';
export type TrackStatusLightingMode = 'CLEAR' | 'GREEN' | 'YELLOW' | 'RED' | 'SAFETY_CAR' | 'VSC' | 'CHEQUERED';
export type ActiveAeroLightingMode = 'OFF' | 'Z_MODE_CORNER' | 'X_MODE_STRAIGHT';

/**
 * Contrato de Estado completo enviado para o ESP32 / WLED.
 * O ESP32 lê esse objeto e aciona os efeitos, presets e cores nas 3 fitas de LED.
 */
export interface Esp32RaceStatePayload {
  // 1. Ambiente e Clima
  ambient: AmbientLightingMode;       // "DAY" (branco quente) ou "NIGHT" (branco frio)
  weather: WeatherLightingMode;       // "CLEAR", "CLOUDY", "RAIN" (efeito gotas), "STORM"
  trackTempCelsius: number;

  // 2. Estado da Pista e Bandeiras FIA
  trackStatus: TrackStatusLightingMode; // Bandeiras amarela, vermelha, safety car, etc.
  chequeredFlag: boolean;             // Fim de corrida / vitória

  // 3. Modos do Carro e Pilotagem
  overtake: boolean;                  // Modo ultrapassagem / boost ativo (animação azul)
  activeAero: ActiveAeroLightingMode; // Modo reta X (animação speed roxa) ou curva Z
  drsActive: boolean;
  drsAllowed: boolean;
  pitLimiter: boolean;                // Limitador de box acionado
  inPits: boolean;                    // Carro dentro do pit lane

  // 4. Incidentes
  isCrash: boolean;                   // Choque / batida violenta
  engineBlown: boolean;               // Motor estourado

  // 5. RPM & Shift Lights (caso o ESP32 queira renderizar tacômetro em uma das fitas)
  rpmPercent: number;
  revLightsPercent: number;
  shiftFlash: boolean;                // Ponto ótimo de troca de marcha (> 96%)

  // Metadados
  timestamp: number;
}

export interface Esp32BridgeConfig {
  ipAddress: string;           // IP do ESP32 na rede local (ex: 192.168.1.150)
  port: number;                // Porta UDP do ESP32 (ex: 4210) ou HTTP 80 para WLED
  transport: 'UDP' | 'WLED_HTTP';
  wledPresetMapping?: {
    dayPreset?: number;
    nightPreset?: number;
    rainPreset?: number;
    overtakePreset?: number;
    speedStraightPreset?: number;
    pitPreset?: number;
    yellowFlagPreset?: number;
    redFlagPreset?: number;
    crashPreset?: number;
    chequeredPreset?: number;
  };
}

export interface Esp32Status {
  connected: boolean;
  ipAddress: string;
  port: number;
  transport: 'UDP' | 'WLED_HTTP';
  lastStateSent: Esp32RaceStatePayload | null;
  packetsSent: number;
  lastSendTimestamp: number;
}
