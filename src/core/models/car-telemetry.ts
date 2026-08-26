import { PacketHeader } from './header';

export interface CarTelemetryData {
  speed: number;                       // km/h
  throttle: number;                    // 0.0 a 1.0
  steer: number;                       // -1.0 (esquerda) a 1.0 (direita)
  brake: number;                       // 0.0 a 1.0
  clutch: number;                      // 0 a 100
  gear: number;                        // -1 = R, 0 = N, 1..8
  engineRPM: number;                   // RPM do motor
  drs: boolean;                        // DRS acionado
  revLightsPercent: number;            // % para ativação dos LEDs do shift-light
  revLightsBitValue: number;           // Bitmask dos LEDs
  brakesTemperature: [number, number, number, number];       // [RL, RR, FL, FR] em Celsius
  tyresSurfaceTemperature: [number, number, number, number]; // [RL, RR, FL, FR] em Celsius
  tyresInnerTemperature: [number, number, number, number];   // [RL, RR, FL, FR] em Celsius
  engineTemperature: number;           // Celsius
  tyresPressure: [number, number, number, number];           // [RL, RR, FL, FR] em PSI
  surfaceType: [number, number, number, number];             // Tipo de superfície em cada roda
}

export interface PacketCarTelemetry {
  header: PacketHeader;
  carTelemetryData: CarTelemetryData[];
  playerCarTelemetry: CarTelemetryData;
  mfdPanelIndex?: number;
  mfdPanelIndexSecondaryPlayer?: number;
  suggestedGear?: number;
}

export const PACKET_CAR_TELEMETRY_SIZE_BYTES = 1352;
