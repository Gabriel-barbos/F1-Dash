import { PacketId, PACKET_NAMES } from '../models/packet-ids.js';
import { PacketHeader } from '../models/header.js';
import { HeaderParser } from './header-parser.js';
import { TelemetryParser } from './telemetry-parser.js';
import { Telemetry2Parser } from './telemetry2-parser.js';
import { CarStatusParser } from './car-status-parser.js';
import { CarDamageParser } from './car-damage-parser.js';
import { LapDataParser } from './lap-data-parser.js';
import { PacketCarTelemetry } from '../models/car-telemetry.js';
import { PacketCarTelemetry2 } from '../models/car-telemetry2.js';
import { PacketCarStatus } from '../models/car-status.js';
import { PacketCarDamage } from '../models/car-damage.js';
import { PacketLapData } from '../models/lap-data.js';

export type ParsedPacket =
  | { type: PacketId.CarTelemetry; data: PacketCarTelemetry }
  | { type: PacketId.CarTelemetry2; data: PacketCarTelemetry2 }
  | { type: PacketId.CarStatus; data: PacketCarStatus }
  | { type: PacketId.CarDamage; data: PacketCarDamage }
  | { type: PacketId.LapData; data: PacketLapData }
  | { type: PacketId; header: PacketHeader; rawLength: number };

export class ParserRegistry {
  /**
   * Identifica o Packet ID e processa o pacote binário conforme registrado.
   */
  public static parse(buffer: Buffer): ParsedPacket | null {
    if (buffer.length < 29) {
      return null;
    }

    const packetId = HeaderParser.peekPacketId(buffer);
    if (packetId === null) {
      return null;
    }

    try {
      switch (packetId) {
        case PacketId.CarTelemetry: {
          const data = TelemetryParser.parse(buffer);
          return { type: PacketId.CarTelemetry, data };
        }
        case PacketId.CarTelemetry2: {
          const data = Telemetry2Parser.parse(buffer);
          return { type: PacketId.CarTelemetry2, data };
        }
        case PacketId.CarStatus: {
          const data = CarStatusParser.parse(buffer);
          return { type: PacketId.CarStatus, data };
        }
        case PacketId.CarDamage: {
          const data = CarDamageParser.parse(buffer);
          return { type: PacketId.CarDamage, data };
        }
        case PacketId.LapData: {
          const data = LapDataParser.parse(buffer);
          return { type: PacketId.LapData, data };
        }
        default: {
          const header = HeaderParser.parse(buffer);
          return { type: packetId, header, rawLength: buffer.length };
        }
      }
    } catch (err) {
      console.error(`Erro ao decodificar pacote ID ${packetId} (${PACKET_NAMES[packetId] ?? 'Desconhecido'}):`, err);
      return null;
    }
  }
}
