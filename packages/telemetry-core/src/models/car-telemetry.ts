import { PacketHeader } from './header';

export type FourWheelsTuple<T> = [T, T, T, T]; // [RearLeft, RearRight, FrontLeft, FrontRight]

export interface FourWheels<T> {
  rearLeft: T;
  rearRight: T;
  frontLeft: T;
  frontRight: T;
}

export interface CarTelemetryData {
  speed: number;                        // Velocidade em km/h (uint16)
  throttle: number;                     // 0.0 a 1.0 (float32)
  steer: number;                        // -1.0 (esquerda) a 1.0 (direita) (float32)
  brake: number;                        // 0.0 a 1.0 (float32)
  clutch: number;                       // 0 a 100 (uint8)
  gear: number;                         // -1 = R, 0 = N, 1..8 (int8)
  engineRPM: number;                    // RPM do motor (uint16)
  drs: boolean;                         // DRS acionado (booleano)
  revLightsPercent: number;             // % LEDs shift-light (uint8)
  revLightsBitValue: number;            // Bitmask dos LEDs do volante (uint16)
  brakesTemperature: FourWheelsTuple<number>;       // [RL, RR, FL, FR] em Celsius (uint16)
  tyresSurfaceTemperature: FourWheelsTuple<number>; // [RL, RR, FL, FR] em Celsius (uint8)
  tyresInnerTemperature: FourWheelsTuple<number>;   // [RL, RR, FL, FR] em Celsius (uint8)
  engineTemperature: number;            // Temperatura do motor em Celsius (uint8 ou uint16)
  tyresPressure: FourWheelsTuple<number>;           // [RL, RR, FL, FR] em PSI (float32)
  surfaceType: FourWheelsTuple<number>;             // Tipo de piso em cada roda (uint8)
}

export interface PacketCarTelemetry {
  header: PacketHeader;
  carTelemetryData: CarTelemetryData[]; // Telemetria de todos os carros do grid
  playerCarTelemetry: CarTelemetryData; // Atalho direto para o carro do jogador
  mfdPanelIndex: number;                // Painel MFD aberto (255 = fechado)
  mfdPanelIndexSecondaryPlayer: number;
  suggestedGear: number;                // Marcha sugerida (1..8, 0 = sem sugestão)
}
