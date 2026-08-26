import { PacketId } from '../models/packet-ids';
import { SafetyCarStatus, Weather, SessionType } from '../models/session';
import { PitStatus, DriverStatus } from '../models/lap-data';
import { ERSDeployMode, VisualTyreCompound, VehicleFiaFlag } from '../models/car-status';
import { ParsedPacket } from '../parser/parser-registry';

export interface CockpitTelemetryState {
  // Conexão
  connected: boolean;
  packetsPerSecond: number;
  lastPacketTime: number;
  gameYear: number;
  frameIdentifier: number;

  // Dinâmica do Carro (Packet 6)
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
  brakesTemperature: [number, number, number, number];
  tyresSurfaceTemperature: [number, number, number, number];
  tyresInnerTemperature: [number, number, number, number];
  tyresPressure: [number, number, number, number];

  // ERS & Combustível & Status (Packet 7)
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

  // Tempos & Posicionamento (Packet 2)
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

  // Boxes & Pit Stop (Packet 2)
  pitStatus: PitStatus;
  pitLaneTimerActive: boolean;
  pitLaneTimeInLaneInMS: number;
  pitStopTimerInMS: number;
  pitStopShouldServePen: boolean;
  numPitStops: number;

  // Segurança & Sessão (Packet 1)
  safetyCarStatus: SafetyCarStatus;
  isRedFlagActive: boolean;
  weather: Weather;
  trackTemperature: number;
  airTemperature: number;
  sessionType: SessionType;
  sessionTimeLeft: number;
  pitSpeedLimit: number;

  // Danos (Packet 10)
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

export type TelemetryListener = (state: CockpitTelemetryState) => void;

export class TelemetryStore {
  private static instance: TelemetryStore;
  private state: CockpitTelemetryState;
  private listeners: Set<TelemetryListener> = new Set();
  private packetCount = 0;
  private lastHzCheck = Date.now();

  private constructor() {
    this.state = this.getInitialState();
    this.startRateCalculator();
  }

  public static getInstance(): TelemetryStore {
    if (!TelemetryStore.instance) {
      TelemetryStore.instance = new TelemetryStore();
    }
    return TelemetryStore.instance;
  }

  public getState(): CockpitTelemetryState {
    return this.state;
  }

  public subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public processPacket(parsed: ParsedPacket | null): void {
    if (!parsed) return;

    this.packetCount++;
    const now = Date.now();
    this.state.connected = true;
    this.state.lastPacketTime = now;

    if (parsed.type === PacketId.CarTelemetry) {
      const tel = parsed.data.playerCarTelemetry;
      const header = parsed.data.header;

      this.state.gameYear = header.gameYear;
      this.state.frameIdentifier = header.frameIdentifier;
      this.state.speed = tel.speed;
      this.state.gear = tel.gear;
      this.state.engineRPM = tel.engineRPM;
      this.state.throttle = tel.throttle;
      this.state.brake = tel.brake;
      this.state.clutch = tel.clutch;
      this.state.steer = tel.steer;
      this.state.drsActive = tel.drs;
      this.state.revLightsPercent = tel.revLightsPercent;
      this.state.engineTemperature = tel.engineTemperature;
      this.state.brakesTemperature = tel.brakesTemperature;
      this.state.tyresSurfaceTemperature = tel.tyresSurfaceTemperature;
      this.state.tyresInnerTemperature = tel.tyresInnerTemperature;
      this.state.tyresPressure = tel.tyresPressure;

      const maxRpm = this.state.maxRPM || 13500;
      this.state.rpmPercentage = Math.min(100, Math.max(0, (tel.engineRPM / maxRpm) * 100));
    } else if (parsed.type === PacketId.CarStatus) {
      const status = parsed.data.playerCarStatus;

      this.state.maxRPM = status.maxRPM || 13500;
      this.state.idleRPM = status.idleRPM || 4000;
      this.state.ersStoreEnergy = status.ersStoreEnergy;
      this.state.ersPercentage = Math.min(100, Math.max(0, (status.ersStoreEnergy / 4000000) * 100));
      this.state.ersDeployMode = status.ersDeployMode;
      this.state.ersHarvestedThisLapMGUK = status.ersHarvestedThisLapMGUK;
      this.state.ersDeployedThisLap = status.ersDeployedThisLap;
      this.state.fuelInTank = status.fuelInTank;
      this.state.fuelCapacity = status.fuelCapacity;
      this.state.fuelRemainingLaps = status.fuelRemainingLaps;
      this.state.pitLimiterActive = status.pitLimiterStatus;
      this.state.vehicleFiaFlags = status.vehicleFiaFlags;
      this.state.visualTyreCompound = status.visualTyreCompound;
      this.state.tyresAgeLaps = status.tyresAgeLaps;
      this.state.drsAllowed = status.drsAllowed;
    } else if (parsed.type === PacketId.LapData) {
      const lap = parsed.data.playerLapData;

      this.state.carPosition = lap.carPosition;
      this.state.currentLapNum = lap.currentLapNum;
      this.state.currentLapTimeInMS = lap.currentLapTimeInMS;
      this.state.lastLapTimeInMS = lap.lastLapTimeInMS;
      this.state.sector1TimeInMS = lap.sector1TimeInMS;
      this.state.sector2TimeInMS = lap.sector2TimeInMS;
      this.state.currentSector = lap.sector;
      this.state.deltaToCarInFrontInMS = lap.deltaToCarInFrontInMS;
      this.state.deltaToRaceLeaderInMS = lap.deltaToRaceLeaderInMS;
      this.state.safetyCarDelta = lap.safetyCarDelta;
      this.state.currentLapInvalid = lap.currentLapInvalid;
      this.state.penalties = lap.penalties;
      this.state.driverStatus = lap.driverStatus;
      this.state.pitStatus = lap.pitStatus;
      this.state.numPitStops = lap.numPitStops;
      this.state.pitLaneTimerActive = lap.pitLaneTimerActive;
      this.state.pitLaneTimeInLaneInMS = lap.pitLaneTimeInLaneInMS;
      this.state.pitStopTimerInMS = lap.pitStopTimerInMS;
      this.state.pitStopShouldServePen = lap.pitStopShouldServePen;

      if (lap.lastLapTimeInMS > 0 && (this.state.bestLapTimeInMS === 0 || lap.lastLapTimeInMS < this.state.bestLapTimeInMS)) {
        this.state.bestLapTimeInMS = lap.lastLapTimeInMS;
      }
    } else if (parsed.type === PacketId.Session) {
      const session = parsed.data;

      this.state.safetyCarStatus = session.safetyCarStatus;
      this.state.isRedFlagActive = session.isRedFlagActive;
      this.state.weather = session.weather;
      this.state.trackTemperature = session.trackTemperature;
      this.state.airTemperature = session.airTemperature;
      this.state.totalLaps = session.totalLaps;
      this.state.sessionType = session.sessionType;
      this.state.sessionTimeLeft = session.sessionTimeLeft;
      this.state.pitSpeedLimit = session.pitSpeedLimit;
    } else if (parsed.type === PacketId.CarDamage) {
      const damage = parsed.data.playerCarDamage;

      this.state.tyresWear = damage.tyresWear;
      this.state.frontLeftWingDamage = damage.frontLeftWingDamage;
      this.state.frontRightWingDamage = damage.frontRightWingDamage;
      this.state.rearWingDamage = damage.rearWingDamage;
      this.state.floorDamage = damage.floorDamage;
      this.state.diffuserDamage = damage.diffuserDamage;
      this.state.sidepodDamage = damage.sidepodDamage;
      this.state.gearBoxDamage = damage.gearBoxDamage;
      this.state.engineDamage = damage.engineDamage;
    }

    this.notifyListeners();
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }

  private startRateCalculator(): void {
    setInterval(() => {
      const now = Date.now();
      const elapsedSec = (now - this.lastHzCheck) / 1000;
      if (elapsedSec >= 1) {
        this.state.packetsPerSecond = Math.round(this.packetCount / elapsedSec);
        this.packetCount = 0;
        this.lastHzCheck = now;

        // Se passar mais de 3 segundos sem pacotes, marcar como desconectado
        if (now - this.state.lastPacketTime > 3000) {
          this.state.connected = false;
        }
      }
    }, 1000);
  }

  private getInitialState(): CockpitTelemetryState {
    return {
      connected: false,
      packetsPerSecond: 0,
      lastPacketTime: 0,
      gameYear: 25,
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
      engineTemperature: 0,
      brakesTemperature: [0, 0, 0, 0],
      tyresSurfaceTemperature: [0, 0, 0, 0],
      tyresInnerTemperature: [0, 0, 0, 0],
      tyresPressure: [0, 0, 0, 0],
      ersStoreEnergy: 4000000,
      ersPercentage: 100,
      ersDeployMode: ERSDeployMode.Medium,
      ersHarvestedThisLapMGUK: 0,
      ersDeployedThisLap: 0,
      fuelInTank: 0,
      fuelCapacity: 110,
      fuelRemainingLaps: 0,
      pitLimiterActive: false,
      vehicleFiaFlags: VehicleFiaFlag.None,
      visualTyreCompound: VisualTyreCompound.F1_Soft,
      tyresAgeLaps: 0,
      carPosition: 1,
      currentLapNum: 1,
      totalLaps: 0,
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
      driverStatus: DriverStatus.OnTrack,
      pitStatus: PitStatus.None,
      pitLaneTimerActive: false,
      pitLaneTimeInLaneInMS: 0,
      pitStopTimerInMS: 0,
      pitStopShouldServePen: false,
      numPitStops: 0,
      safetyCarStatus: SafetyCarStatus.None,
      isRedFlagActive: false,
      weather: Weather.Clear,
      trackTemperature: 28,
      airTemperature: 24,
      sessionType: SessionType.Race,
      sessionTimeLeft: 0,
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
  }
}
