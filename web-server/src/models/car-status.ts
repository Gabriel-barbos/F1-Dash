import { PacketHeader } from './header.js';

export enum ERSDeployMode {
  None = 0,
  Medium = 1,
  Hotlap = 2,
  Overtake = 3 // Modo Boost / Reta
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
  tractionControl: number;       // 0 (off) a 2 (high)
  antiLockBrakes: number;        // 0 (off) a 1 (on)
  fuelMix: number;               // 0 = lean, 1 = standard, 2 = rich, 3 = max
  frontBrakeBias: number;        // Distribuição de freio dianteiro (%)
  pitLimiterStatus: boolean;     // Pit limiter ativo (0 = off, 1 = on)
  fuelInTank: number;            // Quantidade de combustível no tanque em kg (float)
  fuelCapacity: number;          // Capacidade do tanque em kg (float)
  fuelRemainingLaps: number;     // Voltas estimadas de combustível (float)
  maxRPM: number;                // Limiter de RPM do carro
  idleRPM: number;               // RPM de ponto morto
  maxGears: number;              // Número máximo de marchas (ex: 8)
  drsAllowed: boolean;           // DRS permitido na zona atual (0 = não, 1 = sim)
  drsActivationDistance: number; // Distância em metros para ativar DRS (0 se aberto)
  actualTyreCompound: number;    // ID do composto real (ex: C5..C1)
  visualTyreCompound: VisualTyreCompound; // Composto visual (Soft, Medium, Hard, Inter, Wet)
  tyresAgeLaps: number;          // Idade dos pneus em voltas completadas
  vehicleFiaFlags: VehicleFiaFlag; // Bandeiras da FIA (-1 = invalid, 0 = none, 1 = green, 2 = blue, 3 = yellow, 4 = red)
  enginePowerICE: number;        // Potência do motor a combustão (Watts ou BHP)
  enginePowerMGUK: number;       // Potência do MGU-K (Watts ou BHP)
  ersStoreEnergy: number;        // Energia armazenada no ERS em Joules (Max 4,000,000 J = 4MJ)
  ersDeployMode: ERSDeployMode;  // Modo de entrega do ERS (0=None, 1=Medium, 2=Hotlap, 3=Overtake)
  ersHarvestedThisLapMGUK: number; // Energia recuperada pelo MGU-K nesta volta (Joules)
  ersHarvestedThisLapMGUH: number; // Energia recuperada pelo MGU-H nesta volta (Joules)
  ersDeployedThisLap: number;    // Energia gasta nesta volta (Joules)
  networkPaused: boolean;
}

export interface PacketCarStatus {
  header: PacketHeader;
  carStatusData: CarStatusData[];
  playerCarStatus: CarStatusData;
}
