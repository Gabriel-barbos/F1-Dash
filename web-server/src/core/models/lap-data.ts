import { PacketHeader } from './header';

export enum PitStatus {
  None = 0,
  Pitting = 1,
  InPitArea = 2
}

export enum DriverStatus {
  InGarage = 0,
  FlyingLap = 1,
  InLap = 2,
  OutLap = 3,
  OnTrack = 4
}

export enum ResultStatus {
  Invalid = 0,
  Inactive = 1,
  Active = 2,
  Finished = 3,
  DidNotFinish = 4,
  Disqualified = 5,
  NotClassified = 6,
  Retired = 7
}

export interface LapData {
  lastLapTimeInMS: number;
  currentLapTimeInMS: number;
  sector1TimeInMS: number;
  sector2TimeInMS: number;
  deltaToCarInFrontInMS: number;
  deltaToRaceLeaderInMS: number;
  lapDistance: number;
  totalDistance: number;
  safetyCarDelta: number;
  carPosition: number;
  currentLapNum: number;
  pitStatus: PitStatus;
  numPitStops: number;
  sector: number;
  currentLapInvalid: boolean;
  penalties: number;
  totalWarnings: number;
  cornerCuttingWarnings: number;
  numUnservedDriveThroughPens: number;
  numUnservedStopGoPens: number;
  gridPosition: number;
  driverStatus: DriverStatus;
  resultStatus: ResultStatus;
  pitLaneTimerActive: boolean;
  pitLaneTimeInLaneInMS: number;
  pitStopTimerInMS: number;
  pitStopShouldServePen: boolean;
}

export interface PacketLapData {
  header: PacketHeader;
  lapData: LapData[];
  playerLapData: LapData;
  timeTrialPBCarIdx?: number;
  timeTrialRivalCarIdx?: number;
}
