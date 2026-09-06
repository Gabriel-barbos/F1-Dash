import { VisualTyreCompound, ERSDeployMode, VehicleFiaFlag } from '../models/car-status';
import { PitStatus, DriverStatus } from '../models/lap-data';
import { SafetyCarStatus, Weather, SessionType } from '../models/session';
import { FourWheelsTuple } from '../models/car-telemetry';

export interface RaceState {
  connection: {
    connected: boolean;
    packetsPerSecond: number;
    lastPacketTime: number;
    gameYear: number;
    packetFormat: number;
    frameIdentifier: number;
    sessionUID: string;
  };
  car: {
    speed: number;                        // km/h
    gear: number;                         // -1 = R, 0 = N, 1..8
    rpm: number;                          // RPM atual
    maxRPM: number;                       // Limite de RPM
    idleRPM: number;                      // RPM de marcha lenta
    revLightsPercent: number;             // % shift light
    revLightsBitValue: number;            // Bitmask oficial do volante
    throttle: number;                     // 0.0 a 1.0
    brake: number;                        // 0.0 a 1.0
    clutch: number;                       // 0 a 100
    steer: number;                        // -1.0 a 1.0
    drsActive: boolean;
    drsAllowed: boolean;
    engineTemperature: number;            // Celsius
    // Regulamento 2026
    is2026Regulations: boolean;
    activeAeroMode: number;               // 0 = Curva (Z), 1 = Reta (X)
    activeAeroAvailable: boolean;
    activeAeroActivationDistance: number;
    overtakeActive: boolean;
    overtakeAvailable: boolean;
    overtakeActivationDistance: number;
  };
  tyres: {
    compound: VisualTyreCompound;
    ageLaps: number;
    surfaceTemperature: FourWheelsTuple<number>; // [RL, RR, FL, FR] em Celsius
    innerTemperature: FourWheelsTuple<number>;   // [RL, RR, FL, FR] em Celsius
    brakesTemperature: FourWheelsTuple<number>;  // [RL, RR, FL, FR] em Celsius
    pressure: FourWheelsTuple<number>;           // [RL, RR, FL, FR] em PSI
    wear: FourWheelsTuple<number>;               // [RL, RR, FL, FR] de 0 a 100%
    damage: FourWheelsTuple<number>;             // [RL, RR, FL, FR] de 0 a 100%
  };
  ers: {
    storedJoules: number;
    percent: number;
    deployMode: ERSDeployMode;
    harvestedLapMGUK: number;
    deployedLap: number;
    maxCapacityJoules: number;
  };
  fuel: {
    fuelInTank: number;                   // kg
    fuelCapacity: number;                 // kg
    fuelRemainingLaps: number;            // Estimativa do jogo
    fuelMix: number;                      // 0..3
  };
  damage: {
    frontLeftWing: number;                // 0 a 100%
    frontRightWing: number;
    rearWing: number;
    floor: number;
    diffuser: number;
    sidepod: number;
    gearbox: number;
    engine: number;
    engineICE: number;
    engineMGUK: number;
    engineTC: number;
    drsFault: boolean;                    // Falha mecânica no DRS
    engineBlown: boolean;                 // Motor estourado
    engineSeized: boolean;               // Motor travado
  };
  timing: {
    carPosition: number;
    gridPosition: number;
    currentLap: number;
    totalLaps: number;
    currentLapTimeMS: number;
    lastLapTimeMS: number;
    bestLapTimeMS: number;
    sector1TimeMS: number;
    sector2TimeMS: number;
    sector3TimeMS: number;                // DERIVED: lastLap - S1 - S2
    currentSector: number;                // 0 = S1, 1 = S2, 2 = S3
    deltaToCarInFrontMS: number;
    deltaToRaceLeaderMS: number;
    safetyCarDelta: number;
    lapInvalid: boolean;
    penalties: number;
  };
  pit: {
    status: PitStatus;
    limiterActive: boolean;
    speedLimit: number;                   // km/h
    laneTimeMS: number;
    stopTimeMS: number;
    stopsCount: number;
  };
  session: {
    type: SessionType;
    weather: Weather;
    trackTemperature: number;
    airTemperature: number;
    trackId: number;
    timeLeft: number;
    safetyCarStatus: SafetyCarStatus;
    isRedFlagActive: boolean;
    fiaFlag: VehicleFiaFlag;
  };
  derived: {
    fuelConsumptionPerLap: number;        // kg/volta calculado
    fuelDeltaLaps: number;                // Excesso/déficit de voltas de combustível
    tyreWearRatePerLap: FourWheelsTuple<number>; // % de desgaste por volta
    tyreEstimatedLapsRemaining: number;   // Voltas estimadas até 75% de desgaste
    positionsGainedLost: number;          // gridPosition - carPosition
    activeShiftLeds: number;              // Quantidade de LEDs acessos (0 a 15)
    isShiftFlash: boolean;                // Limitador de giro atingido (flash)
  };
}

export const INITIAL_RACE_STATE: RaceState = {
  connection: {
    connected: false,
    packetsPerSecond: 0,
    lastPacketTime: 0,
    gameYear: 2025,
    packetFormat: 2026,
    frameIdentifier: 0,
    sessionUID: '0'
  },
  car: {
    speed: 0,
    gear: 0,
    rpm: 0,
    maxRPM: 13500,
    idleRPM: 4000,
    revLightsPercent: 0,
    revLightsBitValue: 0,
    throttle: 0,
    brake: 0,
    clutch: 0,
    steer: 0,
    drsActive: false,
    drsAllowed: false,
    engineTemperature: 0,
    is2026Regulations: false,
    activeAeroMode: 0,
    activeAeroAvailable: false,
    activeAeroActivationDistance: 0,
    overtakeActive: false,
    overtakeAvailable: false,
    overtakeActivationDistance: 0
  },
  tyres: {
    compound: VisualTyreCompound.F1_Soft,
    ageLaps: 0,
    surfaceTemperature: [0, 0, 0, 0],
    innerTemperature: [0, 0, 0, 0],
    brakesTemperature: [0, 0, 0, 0],
    pressure: [0, 0, 0, 0],
    wear: [0, 0, 0, 0],
    damage: [0, 0, 0, 0]
  },
  ers: {
    storedJoules: 4000000,
    percent: 100,
    deployMode: ERSDeployMode.Medium,
    harvestedLapMGUK: 0,
    deployedLap: 0,
    maxCapacityJoules: 4000000
  },
  fuel: {
    fuelInTank: 0,
    fuelCapacity: 110,
    fuelRemainingLaps: 0,
    fuelMix: 1
  },
  damage: {
    frontLeftWing: 0,
    frontRightWing: 0,
    rearWing: 0,
    floor: 0,
    diffuser: 0,
    sidepod: 0,
    gearbox: 0,
    engine: 0,
    engineICE: 0,
    engineMGUK: 0,
    engineTC: 0,
    drsFault: false,
    engineBlown: false,
    engineSeized: false
  },
  timing: {
    carPosition: 0,
    gridPosition: 0,
    currentLap: 1,
    totalLaps: 0,
    currentLapTimeMS: 0,
    lastLapTimeMS: 0,
    bestLapTimeMS: 0,
    sector1TimeMS: 0,
    sector2TimeMS: 0,
    sector3TimeMS: 0,
    currentSector: 0,
    deltaToCarInFrontMS: 0,
    deltaToRaceLeaderMS: 0,
    safetyCarDelta: 0,
    lapInvalid: false,
    penalties: 0
  },
  pit: {
    status: PitStatus.None,
    limiterActive: false,
    speedLimit: 80,
    laneTimeMS: 0,
    stopTimeMS: 0,
    stopsCount: 0
  },
  session: {
    type: SessionType.Race,
    weather: Weather.Clear,
    trackTemperature: 0,
    airTemperature: 0,
    trackId: -1,
    timeLeft: 0,
    safetyCarStatus: SafetyCarStatus.None,
    isRedFlagActive: false,
    fiaFlag: VehicleFiaFlag.None
  },
  derived: {
    fuelConsumptionPerLap: 0,
    fuelDeltaLaps: 0,
    tyreWearRatePerLap: [0, 0, 0, 0],
    tyreEstimatedLapsRemaining: 0,
    positionsGainedLost: 0,
    activeShiftLeds: 0,
    isShiftFlash: false
  }
};

/**
 * Visão adaptada e compatível com as telas do Cockpit (Mobile / Web).
 * Mapeia a estrutura normalizada de RaceState para propriedades diretas consumíveis.
 */
export interface CockpitTelemetryState {
  connected: boolean;
  packetsPerSecond: number;
  lastPacketTime: number;
  gameYear: number;
  frameIdentifier: number;

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
  brakesTemperature: FourWheelsTuple<number>;
  tyresSurfaceTemperature: FourWheelsTuple<number>;
  tyresInnerTemperature: FourWheelsTuple<number>;
  tyresPressure: FourWheelsTuple<number>;

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

  carPosition: number;
  gridPosition: number;
  currentLapNum: number;
  totalLaps: number;
  currentLapTimeInMS: number;
  lastLapTimeInMS: number;
  bestLapTimeInMS: number;
  sector1TimeInMS: number;
  sector2TimeInMS: number;
  sector3TimeInMS: number;
  currentSector: number;
  deltaToCarInFrontInMS: number;
  deltaToRaceLeaderInMS: number;
  safetyCarDelta: number;
  currentLapInvalid: boolean;
  penalties: number;
  driverStatus: DriverStatus;

  pitStatus: PitStatus;
  pitLaneTimerActive: boolean;
  pitLaneTimeInLaneInMS: number;
  pitStopTimerInMS: number;
  pitStopShouldServePen: boolean;
  numPitStops: number;

  safetyCarStatus: SafetyCarStatus;
  isRedFlagActive: boolean;
  weather: Weather;
  trackTemperature: number;
  airTemperature: number;
  sessionType: SessionType;
  sessionTimeLeft: number;
  pitSpeedLimit: number;

  tyresWear: FourWheelsTuple<number>;
  tyresDamage: FourWheelsTuple<number>;
  frontLeftWingDamage: number;
  frontRightWingDamage: number;
  rearWingDamage: number;
  floorDamage: number;
  diffuserDamage: number;
  sidepodDamage: number;
  gearBoxDamage: number;
  engineDamage: number;
  drsFault: boolean;
  engineBlown: boolean;

  is2026Regulations: boolean;
  activeAeroMode: number;
  activeAeroAvailable: boolean;
  activeAeroActivationDistance: number;
  overtakeActive: boolean;
  overtakeAvailable: boolean;
  overtakeActivationDistance: number;
}

export function toCockpitTelemetryState(state: RaceState): CockpitTelemetryState {
  const maxRpm = state.car.maxRPM || 13500;
  const rpmPercent = Math.min(100, Math.max(0, (state.car.rpm / maxRpm) * 100));

  return {
    connected: state.connection.connected,
    packetsPerSecond: state.connection.packetsPerSecond,
    lastPacketTime: state.connection.lastPacketTime,
    gameYear: state.connection.gameYear,
    frameIdentifier: state.connection.frameIdentifier,

    speed: state.car.speed,
    gear: state.car.gear,
    engineRPM: state.car.rpm,
    maxRPM: state.car.maxRPM,
    idleRPM: state.car.idleRPM,
    rpmPercentage: rpmPercent,
    throttle: state.car.throttle,
    brake: state.car.brake,
    clutch: state.car.clutch,
    steer: state.car.steer,
    drsActive: state.car.drsActive,
    drsAllowed: state.car.drsAllowed,
    revLightsPercent: state.car.revLightsPercent,
    engineTemperature: state.car.engineTemperature,
    brakesTemperature: state.tyres.brakesTemperature,
    tyresSurfaceTemperature: state.tyres.surfaceTemperature,
    tyresInnerTemperature: state.tyres.innerTemperature,
    tyresPressure: state.tyres.pressure,

    ersStoreEnergy: state.ers.storedJoules,
    ersPercentage: state.ers.percent,
    ersDeployMode: state.ers.deployMode,
    ersHarvestedThisLapMGUK: state.ers.harvestedLapMGUK,
    ersDeployedThisLap: state.ers.deployedLap,
    fuelInTank: state.fuel.fuelInTank,
    fuelCapacity: state.fuel.fuelCapacity,
    fuelRemainingLaps: state.fuel.fuelRemainingLaps,
    pitLimiterActive: state.pit.limiterActive,
    vehicleFiaFlags: state.session.fiaFlag,
    visualTyreCompound: state.tyres.compound,
    tyresAgeLaps: state.tyres.ageLaps,

    carPosition: state.timing.carPosition,
    gridPosition: state.timing.gridPosition,
    currentLapNum: state.timing.currentLap,
    totalLaps: state.timing.totalLaps,
    currentLapTimeInMS: state.timing.currentLapTimeMS,
    lastLapTimeInMS: state.timing.lastLapTimeMS,
    bestLapTimeInMS: state.timing.bestLapTimeMS,
    sector1TimeInMS: state.timing.sector1TimeMS,
    sector2TimeInMS: state.timing.sector2TimeMS,
    sector3TimeInMS: state.timing.sector3TimeMS,
    currentSector: state.timing.currentSector,
    deltaToCarInFrontInMS: state.timing.deltaToCarInFrontMS,
    deltaToRaceLeaderInMS: state.timing.deltaToRaceLeaderMS,
    safetyCarDelta: state.timing.safetyCarDelta,
    currentLapInvalid: state.timing.lapInvalid,
    penalties: state.timing.penalties,
    driverStatus: DriverStatus.OnTrack,

    pitStatus: state.pit.status,
    pitLaneTimerActive: state.pit.laneTimeMS > 0,
    pitLaneTimeInLaneInMS: state.pit.laneTimeMS,
    pitStopTimerInMS: state.pit.stopTimeMS,
    pitStopShouldServePen: false,
    numPitStops: state.pit.stopsCount,

    safetyCarStatus: state.session.safetyCarStatus,
    isRedFlagActive: state.session.isRedFlagActive,
    weather: state.session.weather,
    trackTemperature: state.session.trackTemperature,
    airTemperature: state.session.airTemperature,
    sessionType: state.session.type,
    sessionTimeLeft: state.session.timeLeft,
    pitSpeedLimit: state.pit.speedLimit,

    tyresWear: state.tyres.wear,
    tyresDamage: state.tyres.damage,
    frontLeftWingDamage: state.damage.frontLeftWing,
    frontRightWingDamage: state.damage.frontRightWing,
    rearWingDamage: state.damage.rearWing,
    floorDamage: state.damage.floor,
    diffuserDamage: state.damage.diffuser,
    sidepodDamage: state.damage.sidepod,
    gearBoxDamage: state.damage.gearbox,
    engineDamage: state.damage.engine,
    drsFault: state.damage.drsFault,
    engineBlown: state.damage.engineBlown,

    is2026Regulations: Boolean(state.car.is2026Regulations || state.connection.packetFormat === 2026),
    activeAeroMode: state.car.activeAeroMode,
    activeAeroAvailable: state.car.activeAeroAvailable,
    activeAeroActivationDistance: state.car.activeAeroActivationDistance,
    overtakeActive: state.car.overtakeActive,
    overtakeAvailable: state.car.overtakeAvailable,
    overtakeActivationDistance: state.car.overtakeActivationDistance
  };
}

export const INITIAL_COCKPIT_TELEMETRY_STATE: CockpitTelemetryState = toCockpitTelemetryState(INITIAL_RACE_STATE);

