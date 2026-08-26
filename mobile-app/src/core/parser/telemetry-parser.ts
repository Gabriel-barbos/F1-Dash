import {
  CarTelemetryData,
  PacketCarTelemetry
} from '../models/car-telemetry';
import { HeaderParser } from './header-parser';
import { BinaryReader } from '../utils/binary-reader';

export class TelemetryParser {
  /**
   * Decodifica o pacote completo de Telemetria (Packet ID 6).
   * Suporta dinamicamente 60 bytes (2024/22 carros) e 59 bytes (2026/24 carros).
   */
  public static parse(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): PacketCarTelemetry {
    const header = HeaderParser.parse(data);
    const reader = new BinaryReader(data, 29);

    const isFormat2026 = header.packetFormat === 2026;
    const numCars = isFormat2026 ? 24 : 22;
    const carTelemetryData: CarTelemetryData[] = [];

    const payloadLength = reader.remainingBytes();
    const detectedEntrySize = isFormat2026 ? 59 : Math.max(58, Math.floor((payloadLength - 3) / numCars));

    for (let i = 0; i < numCars; i++) {
      if (!reader.hasRemaining(55)) break;
      const startOffset = reader.getOffset();
      const telemetryEntry = TelemetryParser.parseCarTelemetryEntry(reader, isFormat2026, detectedEntrySize);
      carTelemetryData.push(telemetryEntry);

      const bytesRead = reader.getOffset() - startOffset;
      if (bytesRead < detectedEntrySize && reader.hasRemaining(detectedEntrySize - bytesRead)) {
        reader.skip(detectedEntrySize - bytesRead);
      }
    }

    const mfdPanelIndex = reader.hasRemaining(1) ? reader.readUInt8() : 255;
    const mfdPanelIndexSecondaryPlayer = reader.hasRemaining(1) ? reader.readUInt8() : 255;
    const suggestedGear = reader.hasRemaining(1) ? reader.readInt8() : 0;

    const playerIndex = header.playerCarIndex;
    const playerCarTelemetry =
      playerIndex >= 0 && playerIndex < carTelemetryData.length
        ? carTelemetryData[playerIndex]
        : (carTelemetryData[0] || TelemetryParser.createEmptyTelemetry());

    return {
      header,
      carTelemetryData,
      playerCarTelemetry,
      mfdPanelIndex,
      mfdPanelIndexSecondaryPlayer,
      suggestedGear
    };
  }

  public static parseCarTelemetryEntry(reader: BinaryReader, isFormat2026: boolean, entrySize: number): CarTelemetryData {
    const speed = reader.readUInt16LE();
    const throttle = reader.readFloatLE();
    const steer = reader.readFloatLE();
    const brake = reader.readFloatLE();
    const clutch = reader.readUInt8();
    const gear = reader.readInt8();
    const engineRPM = reader.readUInt16LE();
    const drs = reader.readUInt8() === 1;
    const revLightsPercent = reader.readUInt8();
    const revLightsBitValue = reader.readUInt16LE();

    const brakesTemperature: [number, number, number, number] = [
      reader.readUInt16LE(),
      reader.readUInt16LE(),
      reader.readUInt16LE(),
      reader.readUInt16LE()
    ];

    const tyresSurfaceTemperature: [number, number, number, number] = [
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8()
    ];

    const tyresInnerTemperature: [number, number, number, number] = [
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8()
    ];

    let engineTemperature = 0;
    if (isFormat2026 || entrySize === 59) {
      engineTemperature = reader.readUInt8();
    } else {
      engineTemperature = reader.readUInt16LE();
    }

    const tyresPressure: [number, number, number, number] = [
      reader.readFloatLE(),
      reader.readFloatLE(),
      reader.readFloatLE(),
      reader.readFloatLE()
    ];

    const surfaceType: [number, number, number, number] = [
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8()
    ];

    return {
      speed,
      throttle,
      steer,
      brake,
      clutch,
      gear,
      engineRPM,
      drs,
      revLightsPercent,
      revLightsBitValue,
      brakesTemperature,
      tyresSurfaceTemperature,
      tyresInnerTemperature,
      engineTemperature,
      tyresPressure,
      surfaceType
    };
  }

  private static createEmptyTelemetry(): CarTelemetryData {
    return {
      speed: 0,
      throttle: 0,
      steer: 0,
      brake: 0,
      clutch: 0,
      gear: 0,
      engineRPM: 0,
      drs: false,
      revLightsPercent: 0,
      revLightsBitValue: 0,
      brakesTemperature: [0, 0, 0, 0],
      tyresSurfaceTemperature: [0, 0, 0, 0],
      tyresInnerTemperature: [0, 0, 0, 0],
      engineTemperature: 0,
      tyresPressure: [0, 0, 0, 0],
      surfaceType: [0, 0, 0, 0]
    };
  }
}
