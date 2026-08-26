import { PacketHeader } from './header';

export interface CarDamageData {
  tyresWear: [number, number, number, number];    // % desgaste [RL, RR, FL, FR]
  tyresDamage: [number, number, number, number];  // % dano [RL, RR, FL, FR]
  brakesDamage: [number, number, number, number]; // % dano nos freios [RL, RR, FL, FR]
  frontLeftWingDamage: number;                    // % dano asa dianteira esquerda
  frontRightWingDamage: number;                   // % dano asa dianteira direita
  rearWingDamage: number;                         // % dano asa traseira
  floorDamage: number;                            // % dano assoalho
  diffuserDamage: number;                         // % dano difusor
  sidepodDamage: number;                          // % dano sidepod
  drsFault: boolean;                              // Falha no DRS
  ersFault: boolean;                              // Falha no ERS
  gearBoxDamage: number;                          // % dano no câmbio
  engineDamage: number;                           // % dano total no motor
  engineMGUHWear: number;
  engineESWear: number;
  engineCEWear: number;
  engineICEWear: number;
  engineMGUKWear: number;
  engineTCWear: number;
  engineBlown: boolean;
  engineSeized: boolean;
}

export interface PacketCarDamage {
  header: PacketHeader;
  carDamageData: CarDamageData[];
  playerCarDamage: CarDamageData;
}
