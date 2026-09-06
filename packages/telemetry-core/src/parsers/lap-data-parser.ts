import {
  LapData,
  PacketLapData,
  PitStatus,
  DriverStatus,
  ResultStatus
} from '../models/lap-data';
import { HeaderParser } from './header-parser';
import { BinaryReader } from '../utils/binary-reader';

export class LapDataParser {
  /**
   * Decodifica o pacote completo de Lap Data (Packet ID 2).
   * 54 bytes exatos por carro.
   */
  public static parse(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): PacketLapData {
    const reader = new BinaryReader(data);
    const header = HeaderParser.parse(reader);

    const isFormat2026 = header.packetFormat === 2026;
    const numCars = isFormat2026 ? 24 : 22;
    const lapData: LapData[] = [];

    const payloadLength = reader.remainingBytes();
    // 2 bytes adicionais no final para timeTrialPBCarIdx e timeTrialRivalCarIdx
    const detectedEntrySize = Math.max(45, Math.floor((payloadLength >= (numCars * 45) + 2 ? payloadLength - 2 : payloadLength) / numCars));

    for (let i = 0; i < numCars; i++) {
      if (!reader.hasRemaining(45)) break;
      const startOffset = reader.getOffset();
      const entry = LapDataParser.parseLapDataEntry(reader);
      lapData.push(entry);

      const bytesRead = reader.getOffset() - startOffset;
      if (bytesRead < detectedEntrySize && reader.hasRemaining(detectedEntrySize - bytesRead)) {
        reader.skip(detectedEntrySize - bytesRead);
      }
    }

    const timeTrialPBCarIdx = reader.hasRemaining(1) ? reader.readUInt8() : 255;
    const timeTrialRivalCarIdx = reader.hasRemaining(1) ? reader.readUInt8() : 255;

    const playerIndex = header.playerCarIndex;
    const playerLapData =
      playerIndex >= 0 && playerIndex < lapData.length
        ? lapData[playerIndex]
        : (lapData[0] || LapDataParser.createEmpty());

    return {
      header,
      lapData,
      playerLapData,
      timeTrialPBCarIdx,
      timeTrialRivalCarIdx
    };
  }

  public static parseLapDataEntry(reader: BinaryReader): LapData {
    const lastLapTimeInMS = reader.readUInt32LE();
    const currentLapTimeInMS = reader.readUInt32LE();
    const sector1TimeMSPart = reader.readUInt16LE();
    const sector1TimeMinutesPart = reader.readUInt8();
    const sector2TimeMSPart = reader.readUInt16LE();
    const sector2TimeMinutesPart = reader.readUInt8();
    const deltaToCarInFrontMSPart = reader.readUInt16LE();
    const deltaToCarInFrontMinutesPart = reader.readUInt8();
    const deltaToRaceLeaderMSPart = reader.readUInt16LE();
    const deltaToRaceLeaderMinutesPart = reader.readUInt8();
    const lapDistance = reader.readFloatLE();
    const totalDistance = reader.readFloatLE();
    const safetyCarDelta = reader.readFloatLE();
    const carPosition = reader.readUInt8();
    const currentLapNum = reader.readUInt8();
    const pitStatus = reader.readUInt8() as PitStatus;
    const numPitStops = reader.readUInt8();
    const sector = reader.readUInt8();
    const currentLapInvalid = reader.readUInt8() === 1;
    const penalties = reader.readUInt8();
    const totalWarnings = reader.readUInt8();
    const cornerCuttingWarnings = reader.readUInt8();
    const numUnservedDriveThroughPens = reader.readUInt8();
    const numUnservedStopGoPens = reader.readUInt8();
    const gridPosition = reader.readUInt8();
    const driverStatus = reader.readUInt8() as DriverStatus;
    const resultStatus = reader.readUInt8() as ResultStatus;
    const pitLaneTimerActive = reader.readUInt8() === 1;
    const pitLaneTimeInLaneInMS = reader.readUInt16LE();
    const pitStopTimerInMS = reader.readUInt16LE();
    const pitStopShouldServePen = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;

    const sector1TimeInMS = (sector1TimeMinutesPart * 60000) + sector1TimeMSPart;
    const sector2TimeInMS = (sector2TimeMinutesPart * 60000) + sector2TimeMSPart;
    const deltaToCarInFrontInMS = (deltaToCarInFrontMinutesPart * 60000) + deltaToCarInFrontMSPart;
    const deltaToRaceLeaderInMS = (deltaToRaceLeaderMinutesPart * 60000) + deltaToRaceLeaderMSPart;

    return {
      lastLapTimeInMS,
      currentLapTimeInMS,
      sector1TimeInMS,
      sector2TimeInMS,
      deltaToCarInFrontInMS,
      deltaToRaceLeaderInMS,
      lapDistance,
      totalDistance,
      safetyCarDelta,
      carPosition,
      currentLapNum,
      pitStatus,
      numPitStops,
      sector,
      currentLapInvalid,
      penalties,
      totalWarnings,
      cornerCuttingWarnings,
      numUnservedDriveThroughPens,
      numUnservedStopGoPens,
      gridPosition,
      driverStatus,
      resultStatus,
      pitLaneTimerActive,
      pitLaneTimeInLaneInMS,
      pitStopTimerInMS,
      pitStopShouldServePen
    };
  }

  public static createEmpty(): LapData {
    return {
      lastLapTimeInMS: 0,
      currentLapTimeInMS: 0,
      sector1TimeInMS: 0,
      sector2TimeInMS: 0,
      deltaToCarInFrontInMS: 0,
      deltaToRaceLeaderInMS: 0,
      lapDistance: 0,
      totalDistance: 0,
      safetyCarDelta: 0,
      carPosition: 1,
      currentLapNum: 1,
      pitStatus: PitStatus.None,
      numPitStops: 0,
      sector: 0,
      currentLapInvalid: false,
      penalties: 0,
      totalWarnings: 0,
      cornerCuttingWarnings: 0,
      numUnservedDriveThroughPens: 0,
      numUnservedStopGoPens: 0,
      gridPosition: 1,
      driverStatus: DriverStatus.OnTrack,
      resultStatus: ResultStatus.Active,
      pitLaneTimerActive: false,
      pitLaneTimeInLaneInMS: 0,
      pitStopTimerInMS: 0,
      pitStopShouldServePen: false
    };
  }
}
