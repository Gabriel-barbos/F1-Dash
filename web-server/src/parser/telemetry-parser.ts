import {
  CarTelemetryData,
  FourWheels,
  PacketCarTelemetry
} from '../models/car-telemetry.js';
import { HeaderParser } from './header-parser.js';
import { BufferReader } from '../utils/buffer-reader.js';

export class TelemetryParser {
  /**
   * Decodifica um pacote completo de Telemetria do Carro (Packet ID 6).
   * Suporta nativamente:
   * - F1 25 / Format 2026 (1448 bytes: 24 carros x 59 bytes)
   * - F1 24 / Format 2024 (1352 bytes: 22 carros x 60 bytes)
   */
  public static parse(buffer: Buffer): PacketCarTelemetry {
    if (buffer.length < 29) {
      throw new Error(`Buffer insuficiente para PacketCarTelemetry: ${buffer.length} bytes.`);
    }

    const header = HeaderParser.parse(buffer);
    const reader = new BufferReader(buffer, 29); // Inicia após o Header de 29 bytes

    // Identifica se é o formato 2026 (1448 bytes, 24 carros de 59 bytes) ou 2024 (1352 bytes, 22 carros de 60 bytes)
    const isFormat2026 = header.packetFormat === 2026 || buffer.length === 1448;
    const numCars = isFormat2026 ? 24 : 22;

    const carTelemetryData: CarTelemetryData[] = [];

    for (let i = 0; i < numCars; i++) {
      if (!reader.hasRemaining(isFormat2026 ? 59 : 60)) break;
      const carData = isFormat2026
        ? TelemetryParser.parseCarTelemetry2026(reader)
        : TelemetryParser.parseCarTelemetry2024(reader);
      carTelemetryData.push(carData);
    }

    // Leitura segura do sufixo do pacote (3 bytes)
    const mfdPanelIndex = reader.hasRemaining(1) ? reader.readUInt8() : 255;
    const mfdPanelIndexSecondaryPlayer = reader.hasRemaining(1) ? reader.readUInt8() : 255;
    const suggestedGear = reader.hasRemaining(1) ? reader.readInt8() : 0;

    // Seleciona a telemetria do carro do jogador usando o playerCarIndex oficial do Header
    const playerIndex = header.playerCarIndex;
    const playerCarTelemetry =
      playerIndex >= 0 && playerIndex < carTelemetryData.length
        ? carTelemetryData[playerIndex]
        : carTelemetryData[0];

    return {
      header,
      carTelemetryData,
      playerCarTelemetry,
      mfdPanelIndex,
      mfdPanelIndexSecondaryPlayer,
      suggestedGear
    };
  }

  /**
   * Decodifica a entrada de 59 bytes de um carro no F1 25 (Formato 2026).
   * No formato 2026, engineTemperature é uint8 (1 byte).
   */
  private static parseCarTelemetry2026(reader: BufferReader): CarTelemetryData {
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

    const brakesTemperature: FourWheels<number> = {
      rearLeft: reader.readUInt16LE(),
      rearRight: reader.readUInt16LE(),
      frontLeft: reader.readUInt16LE(),
      frontRight: reader.readUInt16LE()
    };

    const tyresSurfaceTemperature: FourWheels<number> = {
      rearLeft: reader.readUInt8(),
      rearRight: reader.readUInt8(),
      frontLeft: reader.readUInt8(),
      frontRight: reader.readUInt8()
    };

    const tyresInnerTemperature: FourWheels<number> = {
      rearLeft: reader.readUInt8(),
      rearRight: reader.readUInt8(),
      frontLeft: reader.readUInt8(),
      frontRight: reader.readUInt8()
    };

    const engineTemperature = reader.readUInt8(); // uint8 no formato 2026

    const tyresPressure: FourWheels<number> = {
      rearLeft: reader.readFloatLE(),
      rearRight: reader.readFloatLE(),
      frontLeft: reader.readFloatLE(),
      frontRight: reader.readFloatLE()
    };

    const surfaceType: FourWheels<number> = {
      rearLeft: reader.readUInt8(),
      rearRight: reader.readUInt8(),
      frontLeft: reader.readUInt8(),
      frontRight: reader.readUInt8()
    };

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

  /**
   * Decodifica a entrada de 60 bytes de um carro no F1 24 (Formato 2024).
   * No formato 2024, engineTemperature é uint16LE (2 bytes).
   */
  private static parseCarTelemetry2024(reader: BufferReader): CarTelemetryData {
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

    const brakesTemperature: FourWheels<number> = {
      rearLeft: reader.readUInt16LE(),
      rearRight: reader.readUInt16LE(),
      frontLeft: reader.readUInt16LE(),
      frontRight: reader.readUInt16LE()
    };

    const tyresSurfaceTemperature: FourWheels<number> = {
      rearLeft: reader.readUInt8(),
      rearRight: reader.readUInt8(),
      frontLeft: reader.readUInt8(),
      frontRight: reader.readUInt8()
    };

    const tyresInnerTemperature: FourWheels<number> = {
      rearLeft: reader.readUInt8(),
      rearRight: reader.readUInt8(),
      frontLeft: reader.readUInt8(),
      frontRight: reader.readUInt8()
    };

    const engineTemperature = reader.readUInt16LE(); // uint16LE no formato 2024

    const tyresPressure: FourWheels<number> = {
      rearLeft: reader.readFloatLE(),
      rearRight: reader.readFloatLE(),
      frontLeft: reader.readFloatLE(),
      frontRight: reader.readFloatLE()
    };

    const surfaceType: FourWheels<number> = {
      rearLeft: reader.readUInt8(),
      rearRight: reader.readUInt8(),
      frontLeft: reader.readUInt8(),
      frontRight: reader.readUInt8()
    };

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
}
