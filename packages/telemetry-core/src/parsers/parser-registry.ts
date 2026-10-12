import { PacketId } from '../models/packet-ids';
import { PacketHeader } from '../models/header';
import { PacketCarTelemetry } from '../models/car-telemetry';
import { PacketCarTelemetry2 } from '../models/car-telemetry2';
import { PacketSessionData } from '../models/session';
import { PacketLapData } from '../models/lap-data';
import { PacketCarStatus } from '../models/car-status';
import { PacketCarDamage } from '../models/car-damage';
import { PacketEventData } from '../models/events';

import { HeaderParser } from './header-parser';
import { TelemetryParser } from './telemetry-parser';
import { Telemetry2Parser } from './telemetry2-parser';
import { SessionParser } from './session-parser';
import { LapDataParser } from './lap-data-parser';
import { CarStatusParser } from './car-status-parser';
import { CarDamageParser } from './car-damage-parser';
import { EventParser } from './event-parser';

export type ParsedPacket =
  | { type: PacketId.CarTelemetry; data: PacketCarTelemetry }
  | { type: PacketId.CarTelemetry2; data: PacketCarTelemetry2 }
  | { type: PacketId.Session; data: PacketSessionData }
  | { type: PacketId.LapData; data: PacketLapData }
  | { type: PacketId.CarStatus; data: PacketCarStatus }
  | { type: PacketId.CarDamage; data: PacketCarDamage }
  | { type: PacketId.Event; data: PacketEventData }
  | { type: 'unknown'; header: PacketHeader; raw: ArrayBuffer | Uint8Array };

export class ParserRegistry {
  /**
   * Decodifica qualquer pacote de telemetria da F1 dinamicamente pelo PacketId.
   */
  public static parse(
    buffer: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer },
    options: { playerOnly?: boolean } = {}
  ): ParsedPacket | null {
    try {
      const packetId = HeaderParser.peekPacketId(buffer);

      switch (packetId) {
        case PacketId.CarTelemetry:
          return {
            type: PacketId.CarTelemetry,
            data: TelemetryParser.parse(buffer, options)
          };

        case PacketId.CarTelemetry2:
          return {
            type: PacketId.CarTelemetry2,
            data: Telemetry2Parser.parse(buffer, options)
          };

        case PacketId.Session:
          return {
            type: PacketId.Session,
            data: SessionParser.parse(buffer)
          };

        case PacketId.LapData:
          return {
            type: PacketId.LapData,
            data: LapDataParser.parse(buffer, options)
          };

        case PacketId.CarStatus:
          return {
            type: PacketId.CarStatus,
            data: CarStatusParser.parse(buffer, options)
          };

        case PacketId.CarDamage:
          return {
            type: PacketId.CarDamage,
            data: CarDamageParser.parse(buffer, options)
          };

        case PacketId.Event:
          return {
            type: PacketId.Event,
            data: EventParser.parse(buffer)
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
