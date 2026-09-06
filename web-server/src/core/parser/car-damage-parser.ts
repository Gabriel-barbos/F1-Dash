import {
  CarDamageData,
  PacketCarDamage
} from '../models/car-damage';
import { HeaderParser } from './header-parser';
import { BinaryReader } from '../utils/binary-reader';

export class CarDamageParser {
  /**
   * Decodifica o pacote de Danos dos Carros (Packet ID 10).
   */
  public static parse(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): PacketCarDamage {
    const header = HeaderParser.parse(data);
    const reader = new BinaryReader(data, 29);

    const isFormat2026 = header.packetFormat === 2026;
    const numCars = isFormat2026 ? 24 : 22;
    const carDamageData: CarDamageData[] = [];

    const payloadLength = reader.remainingBytes();
    const detectedEntrySize = Math.max(38, Math.floor(payloadLength / numCars));
    const hasTyreBlisters = detectedEntrySize >= 46 || header.packetFormat >= 2024 || header.gameYear >= 24;

    for (let i = 0; i < numCars; i++) {
      if (!reader.hasRemaining(36)) break;
      const startOffset = reader.getOffset();
      const damageEntry = CarDamageParser.parseCarDamageEntry(reader, hasTyreBlisters);
      carDamageData.push(damageEntry);

      const bytesRead = reader.getOffset() - startOffset;
      if (bytesRead < detectedEntrySize && reader.hasRemaining(detectedEntrySize - bytesRead)) {
        reader.skip(detectedEntrySize - bytesRead);
      }
    }

    const playerIndex = header.playerCarIndex;
    const playerCarDamage =
      playerIndex >= 0 && playerIndex < carDamageData.length
        ? carDamageData[playerIndex]
        : (carDamageData[0] || CarDamageParser.createEmptyDamage());

    return {
      header,
      carDamageData,
      playerCarDamage
    };
  }

  public static parseCarDamageEntry(reader: BinaryReader, hasTyreBlisters = false): CarDamageData {
    const tyresWear: [number, number, number, number] = [
      reader.readFloatLE(),
      reader.readFloatLE(),
      reader.readFloatLE(),
      reader.readFloatLE()
    ];

    const tyresDamage: [number, number, number, number] = [
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8()
    ];

    const brakesDamage: [number, number, number, number] = [
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8(),
      reader.readUInt8()
    ];

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
    const engineSeized = reader.readUInt8() === 1;

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

  private static createEmptyDamage(): CarDamageData {
    return {
      tyresWear: [0, 0, 0, 0],
      tyresDamage: [0, 0, 0, 0],
      brakesDamage: [0, 0, 0, 0],
      frontLeftWingDamage: 0,
      frontRightWingDamage: 0,
      rearWingDamage: 0,
      floorDamage: 0,
      diffuserDamage: 0,
      sidepodDamage: 0,
      drsFault: false,
      ersFault: false,
      gearBoxDamage: 0,
      engineDamage: 0,
      engineMGUHWear: 0,
      engineESWear: 0,
      engineCEWear: 0,
      engineICEWear: 0,
      engineMGUKWear: 0,
      engineTCWear: 0,
      engineBlown: false,
      engineSeized: false
    };
  }
}
