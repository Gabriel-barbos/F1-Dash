import {
  LapData,
  PacketLapData
} from '../models/lap-data.js';
import { HeaderParser } from './header-parser.js';
import { BufferReader } from '../utils/buffer-reader.js';

export class LapDataParser {
  /**
   * Decodifica o pacote completo de Lap Data (Packet ID 2).
   * 54 bytes exatos por carro.
   */
  public static parse(buffer: Buffer): PacketLapData {
    if (buffer.length < 29) {
      throw new Error(`Buffer insuficiente para LapData: ${buffer.length} bytes.`);
    }

    const header = HeaderParser.parse(buffer);
    const reader = new BufferReader(buffer, 29);

    const isFormat2026 = header.packetFormat === 2026;
    const numCars = isFormat2026 ? 24 : 22;
    const lapData: LapData[] = [];

    // Cada entrada de carro tem 54 bytes
    const entrySize = 54;

    for (let i = 0; i < numCars; i++) {
      if (!reader.hasRemaining(entrySize)) break;
      const startOffset = reader.getOffset();
      const entry = LapDataParser.parseLapDataEntry(reader);
      lapData.push(entry);

      // Garante alinhamento rigoroso da entrada de 54 bytes
      const bytesRead = reader.getOffset() - startOffset;
      if (bytesRead < entrySize && reader.hasRemaining(entrySize - bytesRead)) {
        reader.skip(entrySize - bytesRead);
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

  public static parseLapDataEntry(reader: BufferReader): LapData {
    // 0..3 (4b): m_lastLapTimeInMS (uint32)
    const lastLapTimeInMS = reader.readUInt32LE();
    // 4..7 (4b): m_currentLapTimeInMS (uint32)
    const currentLapTimeInMS = reader.readUInt32LE();
    // 8..9 (2b): m_sector1TimeMSPart (uint16)
    const sector1TimeMSPart = reader.readUInt16LE();
    // 10 (1b): m_sector1TimeMinutesPart (uint8)
    const sector1TimeMinutesPart = reader.readUInt8();
    // 11..12 (2b): m_sector2TimeMSPart (uint16)
    const sector2TimeMSPart = reader.readUInt16LE();
    // 13 (1b): m_sector2TimeMinutesPart (uint8)
    const sector2TimeMinutesPart = reader.readUInt8();
    // 14..15 (2b): m_deltaToCarInFrontMSPart (uint16)
    const deltaToCarInFrontMSPart = reader.readUInt16LE();
    // 16 (1b): m_deltaToCarInFrontMinutesPart (uint8)
    const deltaToCarInFrontMinutesPart = reader.readUInt8();
    // 17..18 (2b): m_deltaToRaceLeaderMSPart (uint16)
    const deltaToRaceLeaderMSPart = reader.readUInt16LE();
    // 19 (1b): m_deltaToRaceLeaderMinutesPart (uint8)
    const deltaToRaceLeaderMinutesPart = reader.readUInt8();
    // 20..23 (4b): m_lapDistance (float)
    const lapDistance = reader.readFloatLE();
    // 24..27 (4b): m_totalDistance (float)
    const totalDistance = reader.readFloatLE();
    // 28..31 (4b): m_safetyCarDelta (float)
    const safetyCarDelta = reader.readFloatLE();
    // 32 (1b): m_carPosition (uint8)
    const carPosition = reader.readUInt8();
    // 33 (1b): m_currentLapNum (uint8)
    const currentLapNum = reader.readUInt8();
    // 34 (1b): m_pitStatus (uint8)
    const pitStatus = reader.readUInt8();
    // 35 (1b): m_numPitStops (uint8)
    const numPitStops = reader.readUInt8();
    // 36 (1b): m_sector (uint8)
    const sector = reader.readUInt8();
    // 37 (1b): m_currentLapInvalid (uint8)
    const currentLapInvalid = reader.readUInt8() === 1;
    // 38 (1b): m_penalties (uint8)
    const penalties = reader.readUInt8();
    // 39 (1b): m_totalWarnings (uint8)
    const totalWarnings = reader.readUInt8();
    // 40 (1b): m_cornerCuttingWarnings (uint8)
    const cornerCuttingWarnings = reader.readUInt8();
    // 41 (1b): m_numUnservedDriveThroughPens (uint8)
    const numUnservedDriveThroughPens = reader.readUInt8();
    // 42 (1b): m_numUnservedStopGoPens (uint8)
    const numUnservedStopGoPens = reader.readUInt8();
    // 43 (1b): m_gridPosition (uint8)
    const gridPosition = reader.readUInt8();
    // 44 (1b): m_driverStatus (uint8)
    const driverStatus = reader.readUInt8();
    // 45 (1b): m_resultStatus (uint8)
    const resultStatus = reader.readUInt8();
    // 46 (1b): m_pitLaneTimerActive (uint8)
    const pitLaneTimerActive = reader.readUInt8() === 1;
    // 47..48 (2b): m_pitLaneTimeInLaneInMS (uint16)
    const pitLaneTimeInLaneInMS = reader.readUInt16LE();
    // 49..50 (2b): m_pitStopTimerInMS (uint16)
    const pitStopTimerInMS = reader.readUInt16LE();
    // 51 (1b): m_pitStopShouldServePen (uint8)
    const pitStopShouldServePen = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;

    // Converte os setores com minutos para milissegundos totais
    const totalS1MS = (sector1TimeMinutesPart * 60000) + sector1TimeMSPart;
    const totalS2MS = (sector2TimeMinutesPart * 60000) + sector2TimeMSPart;
    const totalDeltaInFront = (deltaToCarInFrontMinutesPart * 60000) + deltaToCarInFrontMSPart;
    const totalDeltaLeader = (deltaToRaceLeaderMinutesPart * 60000) + deltaToRaceLeaderMSPart;

    return {
      lastLapTimeInMS,
      currentLapTimeInMS,
      sector1TimeInMS: totalS1MS,
      sector2TimeInMS: totalS2MS,
      deltaToCarInFrontInMS: totalDeltaInFront,
      deltaToRaceLeaderInMS: totalDeltaLeader,
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

  private static createEmpty(): LapData {
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
      pitStatus: 0,
      numPitStops: 0,
      sector: 0,
      currentLapInvalid: false,
      penalties: 0,
      totalWarnings: 0,
      cornerCuttingWarnings: 0,
      numUnservedDriveThroughPens: 0,
      numUnservedStopGoPens: 0,
      gridPosition: 1,
      driverStatus: 4,
      resultStatus: 2,
      pitLaneTimerActive: false,
      pitLaneTimeInLaneInMS: 0,
      pitStopTimerInMS: 0,
      pitStopShouldServePen: false
    };
  }
}
