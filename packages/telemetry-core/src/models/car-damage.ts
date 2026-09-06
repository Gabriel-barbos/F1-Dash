import { PacketHeader } from './header';
import { FourWheelsTuple } from './car-telemetry';

export interface CarDamageData {
  tyresWear: FourWheelsTuple<number>;       // Desgaste de 0 a 100% [RL, RR, FL, FR]
  tyresDamage: FourWheelsTuple<number>;     // Dano mecânico de pneu [RL, RR, FL, FR]
  brakesDamage: FourWheelsTuple<number>;    // Dano de freio [RL, RR, FL, FR]
  frontLeftWingDamage: number;              // 0 a 100%
  frontRightWingDamage: number;             // 0 a 100%
  rearWingDamage: number;                   // 0 a 100%
  floorDamage: number;                      // 0 a 100%
  diffuserDamage: number;                   // 0 a 100%
  sidepodDamage: number;                    // 0 a 100%
  drsFault: boolean;                        // Falha mecânica no DRS
  ersFault: boolean;                        // Falha mecânica no ERS
  gearBoxDamage: number;                    // Dano na caixa de câmbio (0 a 100%)
  engineDamage: number;                     // Dano agregado do motor (0 a 100%)
  engineMGUHWear: number;                   // Desgaste MGU-H
  engineESWear: number;                     // Desgaste Energy Store (Bateria)
  engineCEWear: number;                     // Desgaste Eletrônica de Controle
  engineICEWear: number;                    // Desgaste Motor de Combustão Interna
  engineMGUKWear: number;                   // Desgaste MGU-K
  engineTCWear: number;                     // Desgaste Turbo Compressor
  engineBlown: boolean;                     // Motor estourado
  engineSeized: boolean;                    // Motor travado / fundido
}

export interface PacketCarDamage {
  header: PacketHeader;
  carDamageData: CarDamageData[];
  playerCarDamage: CarDamageData;
}
