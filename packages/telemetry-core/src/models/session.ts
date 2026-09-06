import { PacketHeader } from './header';

export enum Weather {
  Clear = 0,
  LightCloud = 1,
  Overcast = 2,
  LightRain = 3,
  HeavyRain = 4,
  Storm = 5
}

export enum SafetyCarStatus {
  None = 0,
  Full = 1,
  Virtual = 2,
  FormationLap = 3
}

export enum SessionType {
  Unknown = 0,
  Practice1 = 1,
  Practice2 = 2,
  Practice3 = 3,
  ShortPractice = 4,
  Qualifying1 = 5,
  Qualifying2 = 6,
  Qualifying3 = 7,
  ShortQualifying = 8,
  OneShotQualifying = 9,
  Race = 10,
  Race2 = 11,
  Race3 = 12,
  TimeTrial = 13
}

export interface MarshalZone {
  zoneStart: number; // 0.0 a 1.0 (fração do comprimento da pista)
  zoneFlag: number;  // -1 = inválido, 0 = sem bandeira, 1 = verde, 2 = azul, 3 = amarela
}

export interface WeatherForecastSample {
  sessionType: SessionType;
  timeOffset: number;                 // Minutos no futuro
  weather: Weather;
  trackTemperature: number;           // Celsius
  trackTemperatureChange: number;     // 0 = up, 1 = down, 2 = no change
  airTemperature: number;             // Celsius
  airTemperatureChange: number;       // 0 = up, 1 = down, 2 = no change
  rainPercentage: number;             // 0 a 100%
}

export interface PacketSessionData {
  header: PacketHeader;
  weather: Weather;
  trackTemperature: number;
  airTemperature: number;
  totalLaps: number;
  trackLength: number;
  sessionType: SessionType;
  trackId: number;
  sessionTimeLeft: number;
  sessionDuration: number;
  pitSpeedLimit: number;
  gamePaused: boolean;
  isSpectating: boolean;
  spectatorCarIndex: number;
  safetyCarStatus: SafetyCarStatus;
  networkGame: boolean;
  marshalZones: MarshalZone[];
  weatherForecastSamples: WeatherForecastSample[];
  forecastAccuracy: number;
  pitStopWindowIdealLap: number;
  pitStopWindowLatestLap: number;
  pitStopRejoinPosition: number;
  numSafetyCarPeriods: number;
  numVirtualSafetyCarPeriods: number;
  numRedFlagPeriods: number;
  isRedFlagActive: boolean;
}
