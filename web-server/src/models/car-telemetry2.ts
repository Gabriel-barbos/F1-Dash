import { PacketHeader } from './header.js';

export interface CarTelemetryData2 {
  activeAeroMode: number;               // 0 = Corner Mode (Curva), 1 = Straight Mode (Reta)
  activeAeroAvailable: boolean;        // 0 = Unavailable, 1 = Available
  activeAeroActivationDistance: number;// Distância em metros para ativar Active Aero
  overtakeModeActive: boolean;         // 0 = Inativo, 1 = Ativo (Modo Boost / Ultrapassagem)
  ersEnergyHarvestedMGUK: number;      // Energia recuperada MGUK
  ersEnergyHarvestedMGUH: number;      // Energia recuperada MGUH
  ersEnergyDeployed: number;           // Energia entregue
  ersEnergyStore: number;              // Bateria ERS em Joules (2026 Spec)
}

export interface PacketCarTelemetry2 {
  header: PacketHeader;
  carTelemetryData2: CarTelemetryData2[];
  playerCarTelemetry2: CarTelemetryData2;
}
