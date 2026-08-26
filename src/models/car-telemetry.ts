import { PacketHeader } from './header.js';

export interface FourWheels<T> {
  rearLeft: T;
  rearRight: T;
  frontLeft: T;
  frontRight: T;
}

/**
 * Telemetria individual de um carro específico no grid.
 */
export interface CarTelemetryData {
  speed: number;                         // Velocidade do carro em km/h (uint16)
  throttle: number;                      // Acelerador de 0.0 a 1.0 (float32)
  steer: number;                         // Direção de -1.0 (esquerda) a 1.0 (direita) (float32)
  brake: number;                         // Freio de 0.0 a 1.0 (float32)
  clutch: number;                        // Embreagem de 0 a 100% (uint8)
  gear: number;                          // Marcha: 1 a 8, 0 = Neutro, -1 = Ré (int8)
  engineRPM: number;                     // Rotações por minuto do motor (uint16)
  drs: boolean;                          // Status do DRS: true = Ativo, false = Desligado
  revLightsPercent: number;              // Porcentagem dos LEDs de troca de marcha (0-100) (uint8)
  revLightsBitValue: number;             // Valor binário dos LEDs de rotação (uint16)
  brakesTemperature: FourWheels<number>; // Temperatura dos freios em Celsius
  tyresSurfaceTemperature: FourWheels<number>; // Temperatura da superfície dos pneus em Celsius
  tyresInnerTemperature: FourWheels<number>;   // Temperatura interna da carcaça do pneu em Celsius
  engineTemperature: number;             // Temperatura do motor em Celsius (uint16)
  tyresPressure: FourWheels<number>;     // Pressão dos pneus em PSI (float32)
  surfaceType: FourWheels<number>;       // Tipo de superfície em que cada pneu está rodando
}

/**
 * Pacote completo de telemetria recebido do jogo (Packet ID 6).
 */
export interface PacketCarTelemetry {
  header: PacketHeader;
  carTelemetryData: CarTelemetryData[];  // Telemetria para todos os 22 carros da sessão
  playerCarTelemetry: CarTelemetryData;  // Atalho direto para a telemetria do carro do jogador
  mfdPanelIndex: number;                 // Painel multifuncional aberto (255 = fechado)
  mfdPanelIndexSecondaryPlayer: number;
  suggestedGear: number;                 // Marcha sugerida (1-8, 0 = sem sugestão)
}

export const CAR_TELEMETRY_SIZE_BYTES = 60;
export const TOTAL_CARS_IN_SESSION = 22;
export const PACKET_CAR_TELEMETRY_SIZE_BYTES = 29 + (CAR_TELEMETRY_SIZE_BYTES * TOTAL_CARS_IN_SESSION) + 3; // 1352 bytes
