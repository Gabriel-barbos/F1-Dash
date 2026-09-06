import {
  CarTelemetryData2,
  PacketCarTelemetry2
} from '../models/car-telemetry2';
import { HeaderParser } from './header-parser';
import { BinaryReader } from '../utils/binary-reader';

export class Telemetry2Parser {
  /**
   * Decodifica o pacote de Car Telemetry 2 (Packet ID 16 - Regulamento 2026).
   * Formato oficial: 269 bytes no total (Header 29b + 24 carros * 10b).
   */
  public static parse(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): PacketCarTelemetry2 {
    const reader = new BinaryReader(data);
    const header = HeaderParser.parse(reader);

    const isFormat2026 = header.packetFormat === 2026;
    const numCars = isFormat2026 ? 24 : 22;
    const carTelemetryData2: CarTelemetryData2[] = [];

    const payloadLength = reader.remainingBytes();
    // No formato oficial do F1 25, cada entrada de carro tem 10 bytes
    const entrySize = payloadLength >= numCars * 10 ? 10 : Math.max(4, Math.floor(payloadLength / numCars));

    for (let i = 0; i < numCars; i++) {
      if (!reader.hasRemaining(4)) break;
      const startOffset = reader.getOffset();
      const entry = Telemetry2Parser.parseTelemetry2Entry(reader);
      carTelemetryData2.push(entry);

      const bytesRead = reader.getOffset() - startOffset;
      if (bytesRead < entrySize && reader.hasRemaining(entrySize - bytesRead)) {
        reader.skip(entrySize - bytesRead);
      }
    }

    const playerIndex = header.playerCarIndex;
    const playerCarTelemetry2 =
      playerIndex >= 0 && playerIndex < carTelemetryData2.length
        ? carTelemetryData2[playerIndex]
        : (carTelemetryData2[0] || Telemetry2Parser.createEmpty());

    return {
      header,
      carTelemetryData2,
      playerCarTelemetry2
    };
  }

  public static parseTelemetry2Entry(reader: BinaryReader): CarTelemetryData2 {
    const activeAeroMode = reader.readUInt8(); // 0 = Modo Curva (Z), 1 = Modo Reta (X)
    const activeAeroAvailable = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
    const activeAeroActivationDistance = reader.hasRemaining(2) ? reader.readUInt16LE() : 0;
    const overtakeAvailable = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
    const overtakeActive = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
    const overtakeActivationDistance = reader.hasRemaining(2) ? reader.readUInt16LE() : 0;
    const is2026Regulations = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
    const drivingWrongWay = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;

    return {
      activeAeroMode,
      activeAeroAvailable,
      activeAeroActivationDistance,
      overtakeAvailable,
      overtakeActive,
      overtakeModeActive: overtakeActive,
      overtakeActivationDistance,
      is2026Regulations,
      drivingWrongWay
    };
  }

  public static createEmpty(): CarTelemetryData2 {
    return {
      activeAeroMode: 0,
      activeAeroAvailable: false,
      activeAeroActivationDistance: 0,
      overtakeAvailable: false,
      overtakeActive: false,
      overtakeModeActive: false,
      overtakeActivationDistance: 0,
      is2026Regulations: false,
      drivingWrongWay: false
    };
  }
}
