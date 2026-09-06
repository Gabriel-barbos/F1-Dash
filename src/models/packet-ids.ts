/**
 * F1 2024 / 2025 / 2026 Official UDP Packet IDs
 * Identifica o tipo de pacote binário recebido.
 */
export enum PacketId {
  Motion = 0,               // Contém dados de física e movimento de todos os carros
  Session = 1,              // Clima, tipo de sessão, voltas totais, safety car, etc.
  LapData = 2,              // Tempos de volta, setores, posições, penalidades
  Event = 3,                // Eventos especiais (ex: ultrapassagens, colisões, volta mais rápida)
  Participants = 4,         // Nomes dos pilotos, nacionalidades, IDs de equipe
  CarSetups = 5,            // Configurações mecânicas/aerodinâmicas dos carros
  CarTelemetry = 6,         // Velocidade, RPM, marcha, acelerador, freio, pneus
  CarStatus = 7,            // Modo ERS, combustível, tipo de composto de pneu, DRS permitido
  FinalClassification = 8,  // Classificação final ao término da sessão
  LobbyInfo = 9,            // Informações dos jogadores no lobby multiplayer
  CarDamage = 10,           // Danos em asas, assoalho, desgaste de pneus e motor
  SessionHistory = 11,      // Histórico de voltas e tempos de setor anteriores
  TyreSets = 12,            // Conjuntos de pneus disponíveis e usados na sessão
  MotionEx = 13,            // Dados extras de movimento (rodas, suspensão)
  TimeTrial = 14,           // Dados específicos do modo Tomada de Tempo
  LapPositions = 15,        // Posições volta a volta de todos os carros (1231 bytes)
  CarTelemetry2 = 16        // Regulamento 2026: Active Aero (Modo Reta/Curva) e Overtake (269 bytes)
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
  [PacketId.CarTelemetry2]: 'Car Telemetry 2 (2026 Spec)'
};
