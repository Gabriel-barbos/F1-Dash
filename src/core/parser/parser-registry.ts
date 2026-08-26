import { PacketId } from '../models/packet-ids';
import { HeaderParser } from './header-parser';
import { TelemetryParser } from './telemetry-parser';
import { SessionParser } from './session-parser';
import { LapDataParser } from './lap-data-parser';
import { CarStatusParser } from './car-status-parser';
import { CarDamageParser } from './car-damage-parser';
import { PacketHeader } from '../models/header';
import { PacketCarTelemetry } from '../models/car-telemetry';
import { PacketSessionData } from '../models/session';
import { PacketLapData } from '../models/lap-data';
import { PacketCarStatus } from '../models/car-status';
import { PacketCarDamage } from '../models/car-damage';

export type ParsedPacket =
  | { type: PacketId.CarTelemetry; data: PacketCarTelemetry }
  | { type: PacketId.Session; data: PacketSessionData }
  | { type: PacketId.LapData; data: PacketLapData }
  | { type: PacketId.CarStatus; data: PacketCarStatus }
  | { type: PacketId.CarDamage; data: PacketCarDamage }
  | { type: 'unknown'; header: PacketHeader; raw: ArrayBuffer | Uint8Array };

export class ParserRegistry {
  /**
   * Decodifica qualquer pacote de telemetria F1 dinamicamente com base no PacketId.
   */
  public static parse(buffer: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): ParsedPacket | null {
    try {
      const packetId = HeaderParser.peekPacketId(buffer);

      switch (packetId) {
        case PacketId.CarTelemetry:
          return {
            type: PacketId.CarTelemetry,
            data: TelemetryParser.parse(buffer)
          };

        case PacketId.Session:
          return {
            type: PacketId.Session,
            data: SessionParser.parse(buffer)
          };

        case PacketId.LapData:
          return {
            type: PacketId.LapData,
            data: LapDataParser.parse(buffer)
          };

        case PacketId.CarStatus:
          return {
            type: PacketId.CarStatus,
            data: CarStatusParser.parse(buffer)
          };

        case PacketId.CarDamage:
          return {
            type: PacketId.CarDamage,
            data: CarDamageParser.parse(buffer)
          };

        default: {
          const header = HeaderParser.parse(buffer);
          return {
            type: 'unknown',
            header,
            raw: buffer as any
          };
        }
      }
    } catch (err) {
      console.warn('[ParserRegistry] Erro ao decodificar pacote:', err);
      return null;
    }
  }
}
