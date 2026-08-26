/**
 * IDs dos Pacotes UDP da F1 (Compatível com F1 22, 23, 24 e 25).
 */
export enum PacketId {
  Motion = 0,
  Session = 1,
  LapData = 2,
  Event = 3,
  Participants = 4,
  CarSetups = 5,
  CarTelemetry = 6,
  CarStatus = 7,
  FinalClassification = 8,
  LobbyInfo = 9,
  CarDamage = 10,
  SessionHistory = 11,
  TyreSets = 12,
  MotionEx = 13,
  TimeTrial = 14
}

export const PACKET_NAMES: Record<PacketId, string> = {
  [PacketId.Motion]: 'Motion',
  [PacketId.Session]: 'Session (Clima/Safety Car/Bandeiras)',
  [PacketId.LapData]: 'Lap Data (Tempos/Boxes/Setores)',
  [PacketId.Event]: 'Event (Incidentes/Ultrapassagens)',
  [PacketId.Participants]: 'Participants (Pilotos/Equipes)',
  [PacketId.CarSetups]: 'Car Setups',
  [PacketId.CarTelemetry]: 'Car Telemetry (RPM/Velocidade/Pedais)',
  [PacketId.CarStatus]: 'Car Status (ERS/DRS/Bandeiras FIA)',
  [PacketId.FinalClassification]: 'Final Classification',
  [PacketId.LobbyInfo]: 'Lobby Info',
  [PacketId.CarDamage]: 'Car Damage (Desgaste/Danos)',
  [PacketId.SessionHistory]: 'Session History (Volta a Volta)',
  [PacketId.TyreSets]: 'Tyre Sets',
  [PacketId.MotionEx]: 'Motion Ex',
  [PacketId.TimeTrial]: 'Time Trial'
};
