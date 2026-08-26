import {
  CarTelemetryData2,
  PacketCarTelemetry2
} from '../models/car-telemetry2.js';
import { HeaderParser } from './header-parser.js';
import { BufferReader } from '../utils/buffer-reader.js';

export class Telemetry2Parser {
  /**
   * Decodifica o pacote de Car Telemetry 2 (Packet ID 15 - Regulamento 2026).
   */
  public static parse(buffer: Buffer): PacketCarTelemetry2 {
    if (buffer.length < 29) {
      throw new Error(`Buffer insuficiente para Telemetry2: ${buffer.length} bytes.`);
    }

    const header = HeaderParser.parse(buffer);
    const reader = new BufferReader(buffer, 29);

    const isFormat2026 = header.packetFormat === 2026;
    const numCars = isFormat2026 ? 24 : 22;
    const carTelemetryData2: CarTelemetryData2[] = [];

    // Calcula o tamanho da entrada por carro dinamicamente
    const payloadLength = buffer.length - 29;
    const entrySize = Math.max(1, Math.floor(payloadLength / numCars));

    for (let i = 0; i < numCars; i++) {
      if (!reader.hasRemaining(4)) break;
      const startOffset = reader.getOffset();
      const entry = Telemetry2Parser.parseTelemetry2Entry(reader);
      carTelemetryData2.push(entry);

      // Avança para a próxima entrada de forma alinhada
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

  public static parseTelemetry2Entry(reader: BufferReader): CarTelemetryData2 {
    const activeAeroMode = reader.readUInt8(); // 0 = Corner, 1 = Straight
    const activeAeroAvailable = reader.readUInt8() === 1;
    const activeAeroActivationDistance = reader.hasRemaining(2) ? reader.readUInt16LE() : 0;
    const overtakeModeActive = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
    const ersEnergyHarvestedMGUK = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
    const ersEnergyHarvestedMGUH = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
    const ersEnergyDeployed = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
    const ersEnergyStore = reader.hasRemaining(4) ? reader.readFloatLE() : 0;

    return {
      activeAeroMode,
      activeAeroAvailable,
      activeAeroActivationDistance,
      overtakeModeActive,
      ersEnergyHarvestedMGUK,
      ersEnergyHarvestedMGUH,
      ersEnergyDeployed,
      ersEnergyStore
    };
  }

  private static createEmpty(): CarTelemetryData2 {
    return {
      activeAeroMode: 0,
      activeAeroAvailable: false,
      activeAeroActivationDistance: 0,
      overtakeModeActive: false,
      ersEnergyHarvestedMGUK: 0,
      ersEnergyHarvestedMGUH: 0,
      ersEnergyDeployed: 0,
      ersEnergyStore: 0
    };
  }
}
