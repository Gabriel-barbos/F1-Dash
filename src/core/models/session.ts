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
  zoneStart: number; // 0.0 a 1.0 (fração do circuito)
  zoneFlag: number;  // -1 = Inválido, 0 = Nenhuma, 1 = Verde, 2 = Azul, 3 = Amarela
}

export interface WeatherForecastSample {
  sessionType: SessionType;
  timeOffset: number;         // Minutos no futuro
  weather: Weather;
  trackTemperature: number;  // Graus Celsius
  trackTemperatureChange: number;
  airTemperature: number;
  airTemperatureChange: number;
  rainPercentage: number;     // 0-100%
}

export interface PacketSessionData {
  header: PacketHeader;
  weather: Weather;
  trackTemperature: number;    // Celsius
  airTemperature: number;      // Celsius
  totalLaps: number;           // Total de voltas da corrida
  trackLength: number;         // Metros
  sessionType: SessionType;
  trackId: number;
  formula: number;
  sessionTimeLeft: number;     // Segundos restantes
  sessionDuration: number;     // Duração total em segundos
  pitSpeedLimit: number;       // km/h (ex: 80 ou 60)
  gamePaused: boolean;
  isSpectating: boolean;
  spectatorCarIndex: number;
  slipperyStatus: number;      // 0 = Dry, 1 = Damp, 2 = Wet, 3 = Very Wet
  numMarshalZones: number;
  marshalZones: MarshalZone[];
  safetyCarStatus: SafetyCarStatus;
  isRedFlagActive: boolean;    // Bandeira vermelha ativa
  networkGame: boolean;
  forecastAccuracy: number;
  aiDifficulty: number;
  pitStopWindowIdealLap: number;
  pitStopWindowLatestLap: number;
  pitStopRejoinPosition: number;
  numSafetyCarPeriods: number;
  numVirtualSafetyCarPeriods: number;
  numRedFlagPeriods: number;
}
