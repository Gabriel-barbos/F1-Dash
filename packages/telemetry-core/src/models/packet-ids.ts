/**
 * F1 2024 / 2025 / 2026 Official UDP Packet IDs.
 */
export enum PacketId {
  Motion = 0,               // Física e dinâmica de movimento
  Session = 1,              // Clima, tipo de sessão, safety car, bandeiras
  LapData = 2,              // Tempos de volta, setores, posições, penalidades
  Event = 3,                // Eventos de corrida (largada, ultrapassagens, colisões)
  Participants = 4,         // Nomes dos pilotos, equipes, nacionalidades
  CarSetups = 5,            // Configurações mecânicas e aerodinâmicas
  CarTelemetry = 6,         // Velocidade, RPM, marcha, pedais, temperaturas de pneus
  CarStatus = 7,            // Modo ERS, combustível, compostos, bandeiras FIA
  FinalClassification = 8,  // Classificação final ao término da sessão
  LobbyInfo = 9,            // Informações dos jogadores no lobby multiplayer
  CarDamage = 10,           // Danos em asas, assoalho, difusor, desgaste de pneus e motor
  SessionHistory = 11,      // Histórico de voltas e setores anteriores
  TyreSets = 12,            // Conjuntos de pneus alocados para o fim de semana
  MotionEx = 13,            // Telemetria estendida de movimento (suspensão, wheel slip)
  TimeTrial = 14,           // Tomada de tempo (fantasmas pessoal e rival)
  LapPositions = 15,        // Posições volta a volta de todos os carros (1231 bytes)
  CarTelemetry2 = 16        // Regulamento 2026: Active Aero (Modo X/Z) e Manual Override / Overtake (269 bytes)
}

export const PACKET_NAMES: Record<PacketId, string> = {
  [PacketId.Motion]: 'Motion',
  [PacketId.Session]: 'Session',
  [PacketId.LapData]: 'Lap Data',
  [PacketId.Event]: 'Event',
  [PacketId.Participants]: 'Participants',
  [PacketId.CarSetups]: 'Car Setups',
  [PacketId.CarTelemetry]: 'Car Telemetry',
  [PacketId.CarStatus]: 'Car Status',
  [PacketId.FinalClassification]: 'Final Classification',
  [PacketId.LobbyInfo]: 'Lobby Info',
  [PacketId.CarDamage]: 'Car Damage',
  [PacketId.SessionHistory]: 'Session History',
  [PacketId.TyreSets]: 'Tyre Sets',
  [PacketId.MotionEx]: 'Motion Extended',
  [PacketId.TimeTrial]: 'Time Trial',
  [PacketId.LapPositions]: 'Lap Positions',
  [PacketId.CarTelemetry2]: 'Car Telemetry 2 (2026 Active Aero & Overtake)'
};
