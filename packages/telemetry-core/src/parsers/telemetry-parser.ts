import {
  CarTelemetryData,
  PacketCarTelemetry,
  FourWheelsTuple
} from '../models/car-telemetry';
import { HeaderParser } from './header-parser';
import { BinaryReader } from '../utils/binary-reader';

export class TelemetryParser {
  /**
   * Decodifica o pacote completo de Telemetria (Packet ID 6).
   * Suporta dinamicamente:
   * - F1 25 / Formato 2026 (24 carros x 59 bytes)
   * - F1 24 / Formato 2024 (22 carros x 60 bytes)
   */
  public static parse(
    data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer },
    options: { playerOnly?: boolean } = {}
  ): PacketCarTelemetry {
    const reader = new BinaryReader(data);
    const header = HeaderParser.parse(reader);

    const isFormat2026 = header.packetFormat === 2026 || reader.remainingBytes() >= 24 * 59;
    const numCars = isFormat2026 ? 24 : 22;
    const carTelemetryData: CarTelemetryData[] = [];

    const payloadLength = reader.remainingBytes();
    const detectedEntrySize = isFormat2026 ? 59 : Math.max(58, Math.floor((payloadLength - 3) / numCars));
    const playerIndex = header.playerCarIndex >= 0 && header.playerCarIndex < numCars ? header.playerCarIndex : 0;

    let playerCarTelemetry: CarTelemetryData;

    if (options.playerOnly) {
      const startPayloadOffset = reader.getOffset();
      reader.setOffset(startPayloadOffset + playerIndex * detectedEntrySize);
      playerCarTelemetry = TelemetryParser.parseCarTelemetryEntry(reader, isFormat2026, detectedEntrySize);
      reader.setOffset(startPayloadOffset + numCars * detectedEntrySize);
      carTelemetryData.push(playerCarTelemetry);
    } else {
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
      playerCarTelemetry =
        playerIndex >= 0 && playerIndex < carTelemetryData.length
          ? carTelemetryData[playerIndex]
          : (carTelemetryData[0] || TelemetryParser.createEmptyTelemetry());
    }

    const mfdPanelIndex = reader.hasRemaining(1) ? reader.readUInt8() : 255;
    const mfdPanelIndexSecondaryPlayer = reader.hasRemaining(1) ? reader.readUInt8() : 255;
    const suggestedGear = reader.hasRemaining(1) ? reader.readInt8() : 0;

    return {
      header,
      carTelemetryData,
      playerCarTelemetry,
      mfdPanelIndex,
      mfdPanelIndexSecondaryPlayer,
      suggestedGear
    };
  }

  public static parseCarTelemetryEntry(
    reader: BinaryReader,
    isFormat2026: boolean,
    entrySize: number
  ): CarTelemetryData {
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

    const brakesTemperature: FourWheelsTuple<number> = [
      reader.readUInt16LE(),
      reader.readUInt16LE(),
      reader.readUInt16LE(),
      reader.readUInt16LE()
    ];

    const tyresSurfaceTemperature: FourWheelsTuple<number> = [
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8()
    ];

    const tyresInnerTemperature: FourWheelsTuple<number> = [
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

    const tyresPressure: FourWheelsTuple<number> = [
      reader.readFloatLE(),
      reader.readFloatLE(),
      reader.readFloatLE(),
      reader.readFloatLE()
    ];

    const surfaceType: FourWheelsTuple<number> = [
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
