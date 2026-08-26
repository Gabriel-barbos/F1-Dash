import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { SessionParser } from '../src/core/parser/session-parser';
import { PacketId } from '../src/core/models/packet-ids';
import { SafetyCarStatus, Weather, SessionType } from '../src/core/models/session';

describe('SessionParser (Packet ID 1)', () => {
  test('deve decodificar corretamente status de Safety Car e Clima', () => {
    const buffer = Buffer.alloc(700);

    // Header
    buffer.writeUInt16LE(2026, 0);
    buffer.writeUInt8(25, 2);
    buffer.writeUInt8(PacketId.Session, 6);
    buffer.writeBigUInt64LE(999999n, 7);

    // Session Data
    buffer.writeUInt8(Weather.LightRain, 29); // weather = 3
    buffer.writeInt8(32, 30);                 // trackTemp = 32
    buffer.writeInt8(24, 31);                 // airTemp = 24
    buffer.writeUInt8(57, 32);                // totalLaps = 57
    buffer.writeUInt16LE(5412, 33);           // trackLength = 5412
    buffer.writeUInt8(SessionType.Race, 35);  // sessionType = 10
    buffer.writeInt8(3, 36);                  // trackId = 3 (Bahrain)
    buffer.writeUInt8(0, 37);                 // formula
    buffer.writeUInt16LE(3600, 38);           // sessionTimeLeft
    buffer.writeUInt16LE(5400, 40);           // sessionDuration
    buffer.writeUInt8(80, 42);                // pitSpeedLimit = 80 km/h
    buffer.writeUInt8(0, 43);                 // gamePaused

    buffer.writeUInt8(0, 46);                 // numMarshalZones = 0
    const scOffset = 153;                     // Offset exato do Safety Car (48 + 105 = 153)
    buffer.writeUInt8(SafetyCarStatus.Virtual, scOffset); // VSC

    const parsed = SessionParser.parse(buffer);

    assert.equal(parsed.weather, Weather.LightRain);
    assert.equal(parsed.trackTemperature, 32);
    assert.equal(parsed.airTemperature, 24);
    assert.equal(parsed.totalLaps, 57);
    assert.equal(parsed.trackLength, 5412);
    assert.equal(parsed.sessionType, SessionType.Race);
    assert.equal(parsed.pitSpeedLimit, 80);
    assert.equal(parsed.safetyCarStatus, SafetyCarStatus.Virtual);
  });

  test('deve decodificar Safety Car Completo (Full Safety Car)', () => {
    const buffer = Buffer.alloc(700);
    buffer.writeUInt16LE(2026, 0);
    buffer.writeUInt8(PacketId.Session, 6);

    const scOffset = 153;
    buffer.writeUInt8(SafetyCarStatus.Full, scOffset);

    const parsed = SessionParser.parse(buffer);
    assert.equal(parsed.safetyCarStatus, SafetyCarStatus.Full);
  });
});
