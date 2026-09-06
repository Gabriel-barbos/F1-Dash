import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  CarStatusParser,
  PacketId,
  VehicleFiaFlag,
  ERSDeployMode,
  VisualTyreCompound
} from '@f1-dash/telemetry-core';

describe('CarStatusParser (Packet ID 7)', () => {
  test('deve decodificar ERS, Bandeiras FIA e Pit Limiter', () => {
    const buffer = Buffer.alloc(1134);

    // Header
    buffer.writeUInt16LE(2026, 0);
    buffer.writeUInt8(25, 2);
    buffer.writeUInt8(PacketId.CarStatus, 6);
    buffer.writeUInt8(0, 27); // playerCarIndex = 0

    // Carro 0 (46 bytes)
    const offset = 29;
    buffer.writeUInt8(1, offset + 0);  // TC = 1
    buffer.writeUInt8(1, offset + 1);  // ABS = 1
    buffer.writeUInt8(1, offset + 2);  // FuelMix = 1
    buffer.writeUInt8(56, offset + 3); // BrakeBias = 56%
    buffer.writeUInt8(1, offset + 4);  // pitLimiterStatus = true (1)
    buffer.writeFloatLE(42.5, offset + 5); // fuelInTank = 42.5kg
    buffer.writeFloatLE(110.0, offset + 9);
    buffer.writeFloatLE(25.0, offset + 13);
    buffer.writeUInt16LE(13500, offset + 17); // maxRPM = 13500
    buffer.writeUInt16LE(4200, offset + 19);  // idleRPM = 4200
    buffer.writeUInt8(8, offset + 21);        // maxGears = 8
    buffer.writeUInt8(1, offset + 22);        // drsAllowed = true
    buffer.writeUInt16LE(0, offset + 23);
    buffer.writeUInt8(16, offset + 25);
    buffer.writeUInt8(VisualTyreCompound.F1_Soft, offset + 26);
    buffer.writeUInt8(5, offset + 27);        // tyresAge = 5
    buffer.writeInt8(VehicleFiaFlag.Yellow, offset + 28); // vehicleFiaFlags = Yellow (3)
    buffer.writeFloatLE(3600000, offset + 29); // ersStoreEnergy = 3.6MJ (90%)
    buffer.writeUInt8(ERSDeployMode.Overtake, offset + 33); // ersDeployMode = Overtake (3)

    const parsed = CarStatusParser.parse(buffer);

    assert.equal(parsed.playerCarStatus.pitLimiterStatus, true);
    assert.equal(parsed.playerCarStatus.vehicleFiaFlags, VehicleFiaFlag.Yellow);
    assert.equal(parsed.playerCarStatus.ersStoreEnergy, 3600000);
    assert.equal(parsed.playerCarStatus.ersDeployMode, ERSDeployMode.Overtake);
    assert.equal(parsed.playerCarStatus.visualTyreCompound, VisualTyreCompound.F1_Soft);
    assert.equal(parsed.playerCarStatus.tyresAgeLaps, 5);
    assert.equal(parsed.playerCarStatus.drsAllowed, true);
  });
});
