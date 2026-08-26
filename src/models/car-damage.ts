import { PacketHeader } from './header.js';
import { FourWheels } from './car-telemetry.js';

export interface CarDamageData {
  tyresWear: FourWheels<number>;        // Desgaste percentual dos 4 pneus (0 a 100%)
  tyresDamage: FourWheels<number>;      // Danos/bolhas nos 4 pneus (%)
  brakesDamage: FourWheels<number>;     // Danos nos discos de freio (%)
  frontLeftWingDamage: number;          // Dano na asa dianteira esquerda (%)
  frontRightWingDamage: number;         // Dano na asa dianteira direita (%)
  rearWingDamage: number;               // Dano na asa traseira (%)
  floorDamage: number;                  // Dano no assoalho (%)
  diffuserDamage: number;               // Dano no difusor (%)
  sidepodDamage: number;                // Dano no sidepod (%)
  drsFault: boolean;                    // Falha mecânica no DRS (true se quebrado)
  ersFault: boolean;                    // Falha no sistema ERS
  gearBoxDamage: number;                // Desgaste da caixa de câmbio (%)
  engineDamage: number;                 // Dano geral do motor (%)
  engineMGUHWear: number;               // Desgaste MGU-H (%)
  engineESWear: number;                 // Desgaste Bateria ES (%)
  engineCEWear: number;                 // Desgaste Central Eletrônica CE (%)
  engineICEWear: number;                // Desgaste Motor Combustão ICE (%)
  engineMGUKWear: number;               // Desgaste MGU-K (%)
  engineTCWear: number;                 // Desgaste Turbocompressor TC (%)
  engineBlown: boolean;                 // Motor fundido/estourado
  engineSeized: boolean;                // Motor travado
}

export interface PacketCarDamage {
  header: PacketHeader;
  carDamageData: CarDamageData[];
  playerCarDamage: CarDamageData;
}
