import { PacketHeader } from './header';

export enum ERSDeployMode {
  None = 0,
  Medium = 1,
  Hotlap = 2,
  Overtake = 3
}

export enum VisualTyreCompound {
  F1_Soft = 16,
  F1_Medium = 17,
  F1_Hard = 18,
  F1_Inter = 7,
  F1_Wet = 8,
  Classic_Dry = 9,
  Classic_Wet = 10,
  F2_SuperSoft = 11,
  F2_Soft = 12,
  F2_Medium = 13,
  F2_Hard = 14,
  F2_Wet = 15
}

export enum VehicleFiaFlag {
  Invalid = -1,
  None = 0,
  Green = 1,
  Blue = 2,
  Yellow = 3,
  Red = 4
}

export interface CarStatusData {
  tractionControl: number;
  antiLockBrakes: number;
  fuelMix: number;
  frontBrakeBias: number;
  pitLimiterStatus: boolean;
  fuelInTank: number;
  fuelCapacity: number;
  fuelRemainingLaps: number;
  maxRPM: number;
  idleRPM: number;
  maxGears: number;
  drsAllowed: boolean;
  drsActivationDistance: number;
  actualTyreCompound: number;
  visualTyreCompound: VisualTyreCompound;
  tyresAgeLaps: number;
  vehicleFiaFlags: VehicleFiaFlag;
  enginePowerICE: number;
  enginePowerMGUK: number;
  ersStoreEnergy: number;      // Joules (Máx 4.000.000 J = 4MJ)
  ersDeployMode: ERSDeployMode;
  ersHarvestedThisLapMGUK: number;
  ersHarvestedThisLapMGUH: number;
  ersDeployedThisLap: number;
  networkPaused: boolean;
}

export interface PacketCarStatus {
  header: PacketHeader;
  carStatusData: CarStatusData[];
  playerCarStatus: CarStatusData;
}
