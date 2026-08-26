import { PacketCarTelemetry } from '../models/car-telemetry.js';
import { PacketCarTelemetry2 } from '../models/car-telemetry2.js';
import { PacketCarStatus, ERSDeployMode, VisualTyreCompound, VehicleFiaFlag } from '../models/car-status.js';
import { PacketCarDamage } from '../models/car-damage.js';
import { PacketLapData } from '../models/lap-data.js';

export type CarRegulation = 'F1_2026' | 'F1_2025';

export interface FullTelemetrySnapshot {
  carType: CarRegulation;
  car: {
    speed: number;
    gear: number;
    rpm: number;
    throttle: number;
    brake: number;
    steer: number;
    clutch: number;
    drs: boolean;
    engineTemperature: number;
    revLightsPercent: number;
    // 2026 Active Aero & Boost
    activeAeroMode: number;         // 0 = Corner Mode (Modo C), 1 = Straight Mode (Modo S)
    activeAeroAvailable: boolean;   // Zona aberta / disponível
    overtakeActive: boolean;        // Botão Boost / Overtake pressionado
  };
  tyres: {
    brakesTemperature: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
    surfaceTemperature: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
    innerTemperature: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
    pressure: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
    wear: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
    damage: { frontLeft: number; frontRight: number; rearLeft: number; rearRight: number };
    compound: VisualTyreCompound;
    ageLaps: number;
  };
  ers: {
    energyStoredJoules: number;
    energyPercent: number;
    deployMode: ERSDeployMode;
    harvestedLapMGUK: number;
    harvestedLapMGUH: number;
    deployedLap: number;
  };
  fuel: {
    fuelInTank: number;
    fuelCapacity: number;
    fuelRemainingLaps: number;
    fuelMix: number;
  };
  damage: {
    frontLeftWing: number;
    frontRightWing: number;
    rearWing: number;
    floor: number;
    diffuser: number;
    sidepod: number;
    gearbox: number;
    engineDamage: number;
    engineICEWear: number;
    engineMGUKWear: number;
    engineMGUHWear: number;
    engineTCWear: number;
    engineESWear: number;
    engineCEWear: number;
  };
  race: {
    position: number;
    currentLap: number;
    currentLapTimeMS: number;
    lastLapTimeMS: number;
    sector1TimeMS: number;
    sector2TimeMS: number;
    sector: number;
    lapInvalid: boolean;
    penaltiesSeconds: number;
    drsAllowed: boolean;
    fiaFlag: VehicleFiaFlag;
    pitStatus: number;
  };
  lastUpdatedTimestamp: number;
}

export class TelemetryStore {
  private snapshot: FullTelemetrySnapshot = {
    carType: 'F1_2026',
    car: {
      speed: 0,
      gear: 0,
      rpm: 0,
      throttle: 0,
      brake: 0,
      steer: 0,
      clutch: 0,
      drs: false,
      engineTemperature: 0,
      revLightsPercent: 0,
      activeAeroMode: 0,
      activeAeroAvailable: false,
      overtakeActive: false
    },
    tyres: {
      brakesTemperature: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
      surfaceTemperature: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
      innerTemperature: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
      pressure: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
      wear: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
      damage: { frontLeft: 0, frontRight: 0, rearLeft: 0, rearRight: 0 },
      compound: VisualTyreCompound.F1_Soft,
      ageLaps: 0
    },
    ers: {
      energyStoredJoules: 4000000,
      energyPercent: 100,
      deployMode: ERSDeployMode.Medium,
      harvestedLapMGUK: 0,
      harvestedLapMGUH: 0,
      deployedLap: 0
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
      engineDamage: 0,
      engineICEWear: 0,
      engineMGUKWear: 0,
      engineMGUHWear: 0,
      engineTCWear: 0,
      engineESWear: 0,
      engineCEWear: 0
    },
    race: {
      position: 1,
      currentLap: 1,
      currentLapTimeMS: 0,
      lastLapTimeMS: 0,
      sector1TimeMS: 0,
      sector2TimeMS: 0,
      sector: 0,
      lapInvalid: false,
      penaltiesSeconds: 0,
      drsAllowed: false,
      fiaFlag: VehicleFiaFlag.None,
      pitStatus: 0
    },
    lastUpdatedTimestamp: Date.now()
  };

  private hasReceivedData = false;
  private hasReceived2026Telemetry2 = false;

  public updateCarTelemetry(packet: PacketCarTelemetry): void {
    this.hasReceivedData = true;
    const p = packet.playerCarTelemetry;

    this.snapshot.car.speed = p.speed;
    this.snapshot.car.gear = p.gear;
    this.snapshot.car.rpm = p.engineRPM;
    this.snapshot.car.throttle = p.throttle;
    this.snapshot.car.brake = p.brake;
    this.snapshot.car.steer = p.steer;
    this.snapshot.car.clutch = p.clutch;
    this.snapshot.car.drs = p.drs;
    this.snapshot.car.engineTemperature = p.engineTemperature;
    this.snapshot.car.revLightsPercent = p.revLightsPercent;

    this.snapshot.tyres.brakesTemperature = { ...p.brakesTemperature };
    this.snapshot.tyres.surfaceTemperature = { ...p.tyresSurfaceTemperature };
    this.snapshot.tyres.innerTemperature = { ...p.tyresInnerTemperature };
    this.snapshot.tyres.pressure = { ...p.tyresPressure };

    // Se o DRS estiver ativo e for um carro 2026, marca modo reta (Modo S)
    if (p.drs) {
      this.snapshot.car.activeAeroMode = 1;
    } else if (!this.hasReceived2026Telemetry2) {
      this.snapshot.car.activeAeroMode = 0;
    }

    this.snapshot.lastUpdatedTimestamp = Date.now();
  }

  public updateCarTelemetry2(packet: PacketCarTelemetry2): void {
    this.hasReceivedData = true;
    this.hasReceived2026Telemetry2 = true;
    this.snapshot.carType = 'F1_2026';

    const p = packet.playerCarTelemetry2;

    this.snapshot.car.activeAeroMode = p.activeAeroMode;
    this.snapshot.car.activeAeroAvailable = p.activeAeroAvailable;
    this.snapshot.car.overtakeActive = p.overtakeModeActive;

    if (p.overtakeModeActive) {
      this.snapshot.ers.deployMode = ERSDeployMode.Overtake;
    }

    if (p.ersEnergyStore > 0) {
      this.snapshot.ers.energyStoredJoules = p.ersEnergyStore;
      this.snapshot.ers.energyPercent = Math.min(100, Math.max(0, (p.ersEnergyStore / 4000000) * 100));
    }

    this.snapshot.lastUpdatedTimestamp = Date.now();
  }

  public updateCarStatus(packet: PacketCarStatus): void {
    this.hasReceivedData = true;
    const s = packet.playerCarStatus;

    if (s.ersStoreEnergy > 0) {
      this.snapshot.ers.energyStoredJoules = s.ersStoreEnergy;
      this.snapshot.ers.energyPercent = Math.min(100, Math.max(0, (s.ersStoreEnergy / 4000000) * 100));
    }

    if (s.ersDeployMode !== undefined) {
      this.snapshot.ers.deployMode = s.ersDeployMode;
    }

    this.snapshot.ers.harvestedLapMGUK = s.ersHarvestedThisLapMGUK;
    this.snapshot.ers.harvestedLapMGUH = s.ersHarvestedThisLapMGUH;
    this.snapshot.ers.deployedLap = s.ersDeployedThisLap;

    this.snapshot.fuel.fuelInTank = s.fuelInTank;
    this.snapshot.fuel.fuelCapacity = s.fuelCapacity;
    this.snapshot.fuel.fuelRemainingLaps = s.fuelRemainingLaps;
    this.snapshot.fuel.fuelMix = s.fuelMix;

    if (s.visualTyreCompound) {
      this.snapshot.tyres.compound = s.visualTyreCompound;
    }
    this.snapshot.tyres.ageLaps = s.tyresAgeLaps;

    this.snapshot.race.drsAllowed = s.drsAllowed;
    if (s.drsAllowed) {
      this.snapshot.car.activeAeroAvailable = true;
    }

    this.snapshot.race.fiaFlag = s.vehicleFiaFlags;

    this.snapshot.lastUpdatedTimestamp = Date.now();
  }

  public updateCarDamage(packet: PacketCarDamage): void {
    this.hasReceivedData = true;
    const d = packet.playerCarDamage;

    this.snapshot.tyres.wear = { ...d.tyresWear };
    this.snapshot.tyres.damage = { ...d.tyresDamage };

    this.snapshot.damage.frontLeftWing = d.frontLeftWingDamage;
    this.snapshot.damage.frontRightWing = d.frontRightWingDamage;
    this.snapshot.damage.rearWing = d.rearWingDamage;
    this.snapshot.damage.floor = d.floorDamage;
    this.snapshot.damage.diffuser = d.diffuserDamage;
    this.snapshot.damage.sidepod = d.sidepodDamage;
    this.snapshot.damage.gearbox = d.gearBoxDamage;
    this.snapshot.damage.engineDamage = d.engineDamage;
    this.snapshot.damage.engineICEWear = d.engineICEWear;
    this.snapshot.damage.engineMGUKWear = d.engineMGUKWear;
    this.snapshot.damage.engineMGUHWear = d.engineMGUHWear;
    this.snapshot.damage.engineTCWear = d.engineTCWear;
    this.snapshot.damage.engineESWear = d.engineESWear;
    this.snapshot.damage.engineCEWear = d.engineCEWear;

    this.snapshot.lastUpdatedTimestamp = Date.now();
  }

  public updateLapData(packet: PacketLapData): void {
    this.hasReceivedData = true;
    const l = packet.playerLapData;

    this.snapshot.race.position = l.carPosition;
    this.snapshot.race.currentLap = l.currentLapNum;
    this.snapshot.race.currentLapTimeMS = l.currentLapTimeInMS;
    this.snapshot.race.lastLapTimeMS = l.lastLapTimeInMS;
    this.snapshot.race.sector1TimeMS = l.sector1TimeInMS;
    this.snapshot.race.sector2TimeMS = l.sector2TimeInMS;
    this.snapshot.race.sector = l.sector;
    this.snapshot.race.lapInvalid = l.currentLapInvalid;
    this.snapshot.race.penaltiesSeconds = l.penalties;
    this.snapshot.race.pitStatus = l.pitStatus;

    this.snapshot.lastUpdatedTimestamp = Date.now();
  }

  public getSnapshot(): FullTelemetrySnapshot | null {
    if (!this.hasReceivedData) return null;
    return { ...this.snapshot };
  }
}

export const telemetryStore = new TelemetryStore();
