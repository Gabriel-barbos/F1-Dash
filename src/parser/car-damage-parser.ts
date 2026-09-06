import {
  CarDamageData,
  PacketCarDamage
} from '../models/car-damage.js';
import { HeaderParser } from './header-parser.js';
import { BufferReader } from '../utils/buffer-reader.js';

export class CarDamageParser {
  /**
   * Decodifica o pacote completo de Car Damage (Packet ID 10).
   */
  public static parse(buffer: Buffer): PacketCarDamage {
    if (buffer.length < 29) {
      throw new Error(`Buffer insuficiente para CarDamage: ${buffer.length} bytes.`);
    }

    const header = HeaderParser.parse(buffer);
    const reader = new BufferReader(buffer, 29);

    const payloadLength = reader.remainingBytes();
    const detectedEntrySize = Math.max(38, Math.floor(payloadLength / numCars));
    const hasTyreBlisters = detectedEntrySize >= 46 || header.packetFormat >= 2024 || header.gameYear >= 24;

    for (let i = 0; i < numCars; i++) {
      if (!reader.hasRemaining(36)) break;
      const damageEntry = CarDamageParser.parseCarDamageEntry(reader, hasTyreBlisters);
      carDamageData.push(damageEntry);
    }

    const playerIndex = header.playerCarIndex;
    const playerCarDamage =
      playerIndex >= 0 && playerIndex < carDamageData.length
        ? carDamageData[playerIndex]
        : carDamageData[0];

    return {
      header,
      carDamageData,
      playerCarDamage
    };
  }

  public static parseCarDamageEntry(reader: BufferReader, hasTyreBlisters = false): CarDamageData {
    // Array de 4 rodas: [0] RL, [1] RR, [2] FL, [3] FR
    const tyresWear = {
      rearLeft: reader.readFloatLE(),
      rearRight: reader.readFloatLE(),
      frontLeft: reader.readFloatLE(),
      frontRight: reader.readFloatLE()
    };

    const tyresDamage = {
      rearLeft: reader.readUInt8(),
      rearRight: reader.readUInt8(),
      frontLeft: reader.readUInt8(),
      frontRight: reader.readUInt8()
    };

    const brakesDamage = {
      rearLeft: reader.readUInt8(),
      rearRight: reader.readUInt8(),
      frontLeft: reader.readUInt8(),
      frontRight: reader.readUInt8()
    };

    if (hasTyreBlisters && reader.hasRemaining(4)) {
      reader.skip(4);
    }

    const frontLeftWingDamage = reader.readUInt8();
    const frontRightWingDamage = reader.readUInt8();
    const rearWingDamage = reader.readUInt8();
    const floorDamage = reader.readUInt8();
    const diffuserDamage = reader.readUInt8();
    const sidepodDamage = reader.readUInt8();
    const drsFault = reader.readUInt8() === 1;
    const ersFault = reader.readUInt8() === 1;
    const gearBoxDamage = reader.readUInt8();
    const engineDamage = reader.readUInt8();
    const engineMGUHWear = reader.readUInt8();
    const engineESWear = reader.readUInt8();
    const engineCEWear = reader.readUInt8();
    const engineICEWear = reader.readUInt8();
    const engineMGUKWear = reader.readUInt8();
    const engineTCWear = reader.readUInt8();
    const engineBlown = reader.readUInt8() === 1;
    const engineSeized = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;

    return {
      tyresWear,
      tyresDamage,
      brakesDamage,
      frontLeftWingDamage,
      frontRightWingDamage,
      rearWingDamage,
      floorDamage,
      diffuserDamage,
      sidepodDamage,
      drsFault,
      ersFault,
      gearBoxDamage,
      engineDamage,
      engineMGUHWear,
      engineESWear,
      engineCEWear,
      engineICEWear,
      engineMGUKWear,
      engineTCWear,
      engineBlown,
      engineSeized
    };
  }
}
