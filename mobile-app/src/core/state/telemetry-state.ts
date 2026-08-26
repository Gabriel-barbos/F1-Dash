import { SafetyCarStatus, Weather, SessionType } from '../models/session';
import { PitStatus, DriverStatus } from '../models/lap-data';
import { ERSDeployMode, VisualTyreCompound, VehicleFiaFlag } from '../models/car-status';

export interface CockpitTelemetryState {
  // Conexão
  connected: boolean;
  packetsPerSecond: number;
  lastPacketTime: number;
  gameYear: number;
  frameIdentifier: number;

  // Dinâmica do Carro
  speed: number;
  gear: number;
  engineRPM: number;
  maxRPM: number;
  idleRPM: number;
  rpmPercentage: number;
  throttle: number;
  brake: number;
  clutch: number;
  steer: number;
  drsActive: boolean;
  drsAllowed: boolean;
  revLightsPercent: number;
  engineTemperature: number;
  brakesTemperature: [number, number, number, number]; // [RL, RR, FL, FR]
  tyresSurfaceTemperature: [number, number, number, number];
  tyresInnerTemperature: [number, number, number, number];
  tyresPressure: [number, number, number, number];

  // ERS & Combustível & Status
  ersStoreEnergy: number;
  ersPercentage: number;
  ersDeployMode: ERSDeployMode;
  ersHarvestedThisLapMGUK: number;
  ersDeployedThisLap: number;
  fuelInTank: number;
  fuelCapacity: number;
  fuelRemainingLaps: number;
  pitLimiterActive: boolean;
  vehicleFiaFlags: VehicleFiaFlag;
  visualTyreCompound: VisualTyreCompound;
  tyresAgeLaps: number;

  // Tempos & Posicionamento
  carPosition: number;
  currentLapNum: number;
  totalLaps: number;
  currentLapTimeInMS: number;
  lastLapTimeInMS: number;
  bestLapTimeInMS: number;
  sector1TimeInMS: number;
  sector2TimeInMS: number;
  currentSector: number;
  deltaToCarInFrontInMS: number;
  deltaToRaceLeaderInMS: number;
  safetyCarDelta: number;
  currentLapInvalid: boolean;
  penalties: number;
  driverStatus: DriverStatus;

  // Boxes & Pit Stop
  pitStatus: PitStatus;
  pitLaneTimerActive: boolean;
  pitLaneTimeInLaneInMS: number;
  pitStopTimerInMS: number;
  pitStopShouldServePen: boolean;
  numPitStops: number;

  // Segurança & Sessão
  safetyCarStatus: SafetyCarStatus;
  isRedFlagActive: boolean;
  weather: Weather;
  trackTemperature: number;
  airTemperature: number;
  sessionType: SessionType;
  sessionTimeLeft: number;
  pitSpeedLimit: number;

  // Danos
  tyresWear: [number, number, number, number];
  frontLeftWingDamage: number;
  frontRightWingDamage: number;
  rearWingDamage: number;
  floorDamage: number;
  diffuserDamage: number;
  sidepodDamage: number;
  gearBoxDamage: number;
  engineDamage: number;
}

export const INITIAL_TELEMETRY_STATE: CockpitTelemetryState = {
  connected: false,
  packetsPerSecond: 0,
  lastPacketTime: 0,
  gameYear: 2025,
  frameIdentifier: 0,

  speed: 0,
  gear: 0,
  engineRPM: 0,
  maxRPM: 13500,
  idleRPM: 4000,
  rpmPercentage: 0,
  throttle: 0,
  brake: 0,
  clutch: 0,
  steer: 0,
  drsActive: false,
  drsAllowed: false,
  revLightsPercent: 0,
  engineTemperature: 90,
  brakesTemperature: [100, 100, 100, 100],
  tyresSurfaceTemperature: [85, 85, 85, 85],
  tyresInnerTemperature: [90, 90, 90, 90],
  tyresPressure: [23.5, 23.5, 23.5, 23.5],

  ersStoreEnergy: 4000000,
  ersPercentage: 100,
  ersDeployMode: ERSDeployMode.None,
  ersHarvestedThisLapMGUK: 0,
  ersDeployedThisLap: 0,
  fuelInTank: 50,
  fuelCapacity: 110,
  fuelRemainingLaps: 1.5,
  pitLimiterActive: false,
  vehicleFiaFlags: VehicleFiaFlag.None,
  visualTyreCompound: VisualTyreCompound.F1_Soft,
  tyresAgeLaps: 1,

  carPosition: 1,
  currentLapNum: 1,
  totalLaps: 58,
  currentLapTimeInMS: 0,
  lastLapTimeInMS: 0,
  bestLapTimeInMS: 0,
  sector1TimeInMS: 0,
  sector2TimeInMS: 0,
  currentSector: 0,
  deltaToCarInFrontInMS: 0,
  deltaToRaceLeaderInMS: 0,
  safetyCarDelta: 0,
  currentLapInvalid: false,
  penalties: 0,
  driverStatus: DriverStatus.InGarage,

  pitStatus: PitStatus.None,
  pitLaneTimerActive: false,
  pitLaneTimeInLaneInMS: 0,
  pitStopTimerInMS: 0,
  pitStopShouldServePen: false,
  numPitStops: 0,

  safetyCarStatus: SafetyCarStatus.NoSafetyCar,
  isRedFlagActive: false,
  weather: Weather.Clear,
  trackTemperature: 32,
  airTemperature: 24,
  sessionType: SessionType.Race,
  sessionTimeLeft: 3600,
  pitSpeedLimit: 80,

  tyresWear: [0, 0, 0, 0],
  frontLeftWingDamage: 0,
  frontRightWingDamage: 0,
  rearWingDamage: 0,
  floorDamage: 0,
  diffuserDamage: 0,
  sidepodDamage: 0,
  gearBoxDamage: 0,
  engineDamage: 0
};
