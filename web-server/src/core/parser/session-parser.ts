import {
  PacketSessionData,
  Weather,
  SafetyCarStatus,
  SessionType,
  MarshalZone
} from '../models/session';
import { HeaderParser } from './header-parser';
import { BinaryReader } from '../utils/binary-reader';

export class SessionParser {
  /**
   * Decodifica o pacote de Sessão (Packet ID 1).
   * Contém status de Safety Car, VSC, Bandeira Vermelha, Clima, Pista e Boxes.
   */
  public static parse(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): PacketSessionData {
    const header = HeaderParser.parse(data);
    const reader = new BinaryReader(data, 29);

    const weather = (reader.hasRemaining(1) ? reader.readUInt8() : 0) as Weather;
    const trackTemperature = reader.hasRemaining(1) ? reader.readInt8() : 0;
    const airTemperature = reader.hasRemaining(1) ? reader.readInt8() : 0;
    const totalLaps = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const trackLength = reader.hasRemaining(2) ? reader.readUInt16LE() : 0;
    const sessionType = (reader.hasRemaining(1) ? reader.readUInt8() : 0) as SessionType;
    const trackId = reader.hasRemaining(1) ? reader.readInt8() : -1;
    const formula = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const sessionTimeLeft = reader.hasRemaining(2) ? reader.readUInt16LE() : 0;
    const sessionDuration = reader.hasRemaining(2) ? reader.readUInt16LE() : 0;
    const pitSpeedLimit = reader.hasRemaining(1) ? reader.readUInt8() : 80;
    const gamePaused = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
    const isSpectating = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
    const spectatorCarIndex = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const slipperyStatus = reader.hasRemaining(1) ? reader.readUInt8() : 0;

    // Marshal Zones (até 21 zonas x 5 bytes = 105 bytes)
    const numMarshalZones = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const marshalZones: MarshalZone[] = [];
    const maxZones = 21;

    for (let i = 0; i < maxZones; i++) {
      if (reader.hasRemaining(5)) {
        const zoneStart = reader.readFloatLE();
        const zoneFlag = reader.readInt8();
        if (i < numMarshalZones) {
          marshalZones.push({ zoneStart, zoneFlag });
        }
      }
    }

    // Safety Car Status: 0 = none, 1 = full, 2 = virtual, 3 = formation lap
    const safetyCarStatus = (reader.hasRemaining(1) ? reader.readUInt8() : 0) as SafetyCarStatus;
    const networkGame = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;

    // Pular amostras de previsão meteorológica se presentes (ex: até 56/64 x 8 bytes)
    const numWeatherForecastSamples = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const bytesToSkipForecast = Math.min(reader.remainingBytes(), 56 * 8);
    if (bytesToSkipForecast > 0 && reader.hasRemaining(bytesToSkipForecast)) {
      reader.skip(bytesToSkipForecast);
    }

    const forecastAccuracy = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const aiDifficulty = reader.hasRemaining(1) ? reader.readUInt8() : 0;

    // Links de sessão
    if (reader.hasRemaining(12)) {
      reader.skip(12); // seasonLinkId, weekendLinkId, sessionLinkId
    }

    const pitStopWindowIdealLap = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const pitStopWindowLatestLap = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const pitStopRejoinPosition = reader.hasRemaining(1) ? reader.readUInt8() : 0;

    // Pular assistências (steeringAssist, brakingAssist, etc. - 10 bytes)
    if (reader.hasRemaining(10)) {
      reader.skip(10);
    }

    // Pular configurações de jogo/tempo
    if (reader.hasRemaining(10)) {
      reader.skip(10);
    }

    const numSafetyCarPeriods = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const numVirtualSafetyCarPeriods = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const numRedFlagPeriods = reader.hasRemaining(1) ? reader.readUInt8() : 0;

    // Detecção de Bandeira Vermelha ativa:
    // Se houver períodos de bandeira vermelha ativos ou se o status indicar suspensão de sessão
    const isRedFlagActive = numRedFlagPeriods > 0 && gamePaused === false && sessionTimeLeft > 0 && safetyCarStatus === SafetyCarStatus.None;

    return {
      header,
      weather,
      trackTemperature,
      airTemperature,
      totalLaps,
      trackLength,
      sessionType,
      trackId,
      formula,
      sessionTimeLeft,
      sessionDuration,
      pitSpeedLimit,
      gamePaused,
      isSpectating,
      spectatorCarIndex,
      slipperyStatus,
      numMarshalZones,
      marshalZones,
      safetyCarStatus,
      isRedFlagActive,
      networkGame,
      forecastAccuracy,
      aiDifficulty,
      pitStopWindowIdealLap,
      pitStopWindowLatestLap,
      pitStopRejoinPosition,
      numSafetyCarPeriods,
      numVirtualSafetyCarPeriods,
      numRedFlagPeriods
    };
  }
}
