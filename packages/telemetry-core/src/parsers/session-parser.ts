import {
  PacketSessionData,
  Weather,
  SafetyCarStatus,
  SessionType,
  MarshalZone,
  WeatherForecastSample
} from '../models/session';
import { HeaderParser } from './header-parser';
import { BinaryReader } from '../utils/binary-reader';

export class SessionParser {
  /**
   * Decodifica o pacote de Sessão (Packet ID 1).
   * Contém status de Safety Car, VSC, Bandeira Vermelha, Clima, Pista e Boxes.
   */
  public static parse(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): PacketSessionData {
    const reader = new BinaryReader(data);
    const header = HeaderParser.parse(reader);

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
    const sliProNativeSupport = reader.hasRemaining(1) ? reader.readUInt8() : 0;

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

    // Previsão meteorológica
    const numWeatherForecastSamples = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const weatherForecastSamples: WeatherForecastSample[] = [];
    const maxForecastSamples = 56; // 56 amostras de 8 bytes na estrutura oficial C++

    for (let i = 0; i < maxForecastSamples; i++) {
      if (reader.hasRemaining(8)) {
        const sType = reader.readUInt8() as SessionType;
        const timeOffset = reader.readUInt8();
        const sWeather = reader.readUInt8() as Weather;
        const sTrackTemp = reader.readInt8();
        const sTrackTempChange = reader.readInt8();
        const sAirTemp = reader.readInt8();
        const sAirTempChange = reader.readInt8();
        const rainPercentage = reader.readUInt8();

        if (i < numWeatherForecastSamples) {
          weatherForecastSamples.push({
            sessionType: sType,
            timeOffset,
            weather: sWeather,
            trackTemperature: sTrackTemp,
            trackTemperatureChange: sTrackTempChange,
            airTemperature: sAirTemp,
            airTemperatureChange: sAirTempChange,
            rainPercentage
          });
        }
      } else {
        break;
      }
    }

    const forecastAccuracy = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const aiDifficulty = reader.hasRemaining(1) ? reader.readUInt8() : 0;

    // Links de sessão (12 bytes: seasonLinkId, weekendLinkId, sessionLinkId)
    if (reader.hasRemaining(12)) {
      reader.skip(12);
    }

    const pitStopWindowIdealLap = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const pitStopWindowLatestLap = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const pitStopRejoinPosition = reader.hasRemaining(1) ? reader.readUInt8() : 0;

    // Assistências e configurações (steeringAssist, brakingAssist, gearboxAssist, etc. - 10 bytes)
    if (reader.hasRemaining(10)) {
      reader.skip(10);
    }

    // Configurações de jogo / regras (10 bytes)
    if (reader.hasRemaining(10)) {
      reader.skip(10);
    }

    const numSafetyCarPeriods = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const numVirtualSafetyCarPeriods = reader.hasRemaining(1) ? reader.readUInt8() : 0;
    const numRedFlagPeriods = reader.hasRemaining(1) ? reader.readUInt8() : 0;

    // Detecção correta de Bandeira Vermelha ativa:
    // Deve ser detectada se houver zona de marshal com bandeira 4 (Red) ou se a sessão estiver suspensa
    const hasRedFlagZone = marshalZones.some((zone) => zone.zoneFlag === 4);
    const isRedFlagActive = hasRedFlagZone;

    return {
      header,
      weather,
      trackTemperature,
      airTemperature,
      totalLaps,
      trackLength,
      sessionType,
      trackId,
      sessionTimeLeft,
      sessionDuration,
      pitSpeedLimit,
      gamePaused,
      isSpectating,
      spectatorCarIndex,
      safetyCarStatus,
      networkGame,
      marshalZones,
      weatherForecastSamples,
      forecastAccuracy,
      pitStopWindowIdealLap,
      pitStopWindowLatestLap,
      pitStopRejoinPosition,
      numSafetyCarPeriods,
      numVirtualSafetyCarPeriods,
      numRedFlagPeriods,
      isRedFlagActive
    };
  }
}
