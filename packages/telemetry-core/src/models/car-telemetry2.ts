import { PacketHeader } from './header';

/**
 * Dados de Telemetria Específicos para o Regulamento 2026 (Packet ID 16 - 269 bytes).
 * Introduz a aerodinâmica ativa (Modo Z de Curva vs Modo X de Reta),
 * e a autorização de ultrapassagem / Manual Override (quando a < 1s de um rival).
 */
export interface CarTelemetryData2 {
  activeAeroMode: number;                 // 0 = Corner Mode (Modo Z), 1 = Straight Mode (Modo X)
  activeAeroAvailable: boolean;          // Zona de ativação de Active Aero disponível
  activeAeroActivationDistance: number;  // Distância métrica em metros para a zona ativa
  overtakeAvailable: boolean;            // Modo Overtake autorizado (< 1s atrás do rival)
  overtakeActive: boolean;               // Modo Overtake acionado (potência extra ativa)
  overtakeModeActive?: boolean;          // Alias de compatibilidade para overtakeActive
  overtakeActivationDistance: number;    // Distância métrica para zona de ativação do Overtake
  is2026Regulations: boolean;            // 1 = Regulamento 2026 ativo, 0 = Regulamento 2025
  drivingWrongWay: boolean;              // Indica se o carro está trafegando em contramão
  ersEnergyHarvestedMGUK?: number;        // Compatibilidade
  ersEnergyDeployed?: number;             // Compatibilidade
  ersEnergyStore?: number;                // Compatibilidade
}

export interface PacketCarTelemetry2 {
  header: PacketHeader;
  carTelemetryData2: CarTelemetryData2[];
  playerCarTelemetry2: CarTelemetryData2;
}
