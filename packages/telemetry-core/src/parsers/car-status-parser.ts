import {
  CarStatusData,
  PacketCarStatus,
  ERSDeployMode,
  VisualTyreCompound,
  VehicleFiaFlag
} from '../models/car-status';
import { HeaderParser } from './header-parser';
import { BinaryReader } from '../utils/binary-reader';

export class CarStatusParser {
  /**
   * Decodifica o pacote completo de Car Status (Packet ID 7).
   * Suporta dinamicamente 55 bytes/carro (com enginePower) e 46/47 bytes/carro.
   */
  public static parse(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): PacketCarStatus {
    const reader = new BinaryReader(data);
    const header = HeaderParser.parse(reader);

    const isFormat2026 = header.packetFormat === 2026;
    const numCars = isFormat2026 ? 24 : 22;
    const carStatusData: CarStatusData[] = [];

    const payloadLength = reader.remainingBytes();
    const detectedEntrySize = Math.max(40, Math.floor(payloadLength / numCars));

    for (let i = 0; i < numCars; i++) {
      if (!reader.hasRemaining(40)) break;
      const startOffset = reader.getOffset();
      const statusEntry = CarStatusParser.parseCarStatusEntry(reader, detectedEntrySize);
      carStatusData.push(statusEntry);

      const bytesRead = reader.getOffset() - startOffset;
      if (bytesRead < detectedEntrySize && reader.hasRemaining(detectedEntrySize - bytesRead)) {
        reader.skip(detectedEntrySize - bytesRead);
      }
    }

    const playerIndex = header.playerCarIndex;
    const playerCarStatus =
      playerIndex >= 0 && playerIndex < carStatusData.length
        ? carStatusData[playerIndex]
        : (carStatusData[0] || CarStatusParser.createEmptyStatus());

    return {
      header,
      carStatusData,
      playerCarStatus
    };
  }

  public static parseCarStatusEntry(reader: BinaryReader, entrySize: number): CarStatusData {
    const tractionControl = reader.readUInt8();
    const antiLockBrakes = reader.readUInt8();
    const fuelMix = reader.readUInt8();
    const frontBrakeBias = reader.readUInt8();
    const pitLimiterStatus = reader.readUInt8() === 1;
    const fuelInTank = reader.readFloatLE();
    const fuelCapacity = reader.readFloatLE();
    const fuelRemainingLaps = reader.readFloatLE();
    const maxRPM = reader.readUInt16LE();
    const idleRPM = reader.readUInt16LE();
    const maxGears = reader.readUInt8();
    const drsAllowed = reader.readUInt8() === 1;
    const drsActivationDistance = reader.readUInt16LE();
    const actualTyreCompound = reader.readUInt8();
    const visualTyreCompound = reader.readUInt8() as VisualTyreCompound;
    const tyresAgeLaps = reader.readUInt8();
    const vehicleFiaFlags = reader.readInt8() as VehicleFiaFlag;

    let enginePowerICE = 0;
    let enginePowerMGUK = 0;
    let ersStoreEnergy = 0;
    let ersDeployMode = ERSDeployMode.None;
    let ersHarvestedThisLapMGUK = 0;
    let ersHarvestedThisLapMGUH = 0;
    let ersDeployedThisLap = 0;
    let networkPaused = false;

    if (entrySize >= 52) {
      // Formato oficial expandido (com Engine Power)
      enginePowerICE = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
      enginePowerMGUK = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
      ersStoreEnergy = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
      ersDeployMode = (reader.hasRemaining(1) ? reader.readUInt8() : 0) as ERSDeployMode;
      ersHarvestedThisLapMGUK = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
      ersHarvestedThisLapMGUH = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
      ersDeployedThisLap = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
      networkPaused = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
    } else {
      // Formato 46/47 bytes (sem Engine Power)
      ersStoreEnergy = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
      ersDeployMode = (reader.hasRemaining(1) ? reader.readUInt8() : 0) as ERSDeployMode;
      ersHarvestedThisLapMGUK = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
      ersHarvestedThisLapMGUH = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
      ersDeployedThisLap = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
      networkPaused = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
    }

    return {
      tractionControl,
      antiLockBrakes,
      fuelMix,
      frontBrakeBias,
      pitLimiterStatus,
      fuelInTank,
      fuelCapacity,
      fuelRemainingLaps,
      maxRPM,
      idleRPM,
      maxGears,
      drsAllowed,
      drsActivationDistance,
      actualTyreCompound,
      visualTyreCompound,
      tyresAgeLaps,
      vehicleFiaFlags,
      enginePowerICE,
      enginePowerMGUK,
      ersStoreEnergy,
      ersDeployMode,
      ersHarvestedThisLapMGUK,
      ersHarvestedThisLapMGUH,
      ersDeployedThisLap,
      networkPaused
    };
  }

  private static createEmptyStatus(): CarStatusData {
    return {
      tractionControl: 0,
      antiLockBrakes: 0,
      fuelMix: 1,
      frontBrakeBias: 56,
      pitLimiterStatus: false,
      fuelInTank: 0,
      fuelCapacity: 110,
      fuelRemainingLaps: 0,
      maxRPM: 13500,
      idleRPM: 4000,
      maxGears: 8,
      drsAllowed: false,
      drsActivationDistance: 0,
      actualTyreCompound: 0,
      visualTyreCompound: VisualTyreCompound.F1_Soft,
      tyresAgeLaps: 0,
      vehicleFiaFlags: VehicleFiaFlag.None,
      enginePowerICE: 0,
      enginePowerMGUK: 0,
      ersStoreEnergy: 4000000,
      ersDeployMode: ERSDeployMode.Medium,
      ersHarvestedThisLapMGUK: 0,
      ersHarvestedThisLapMGUH: 0,
      ersDeployedThisLap: 0,
      networkPaused: false
    };
  }
}
