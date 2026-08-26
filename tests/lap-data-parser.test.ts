import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { LapDataParser } from '../src/core/parser/lap-data-parser';
import { PacketId } from '../src/core/models/packet-ids';
import { PitStatus, DriverStatus } from '../src/core/models/lap-data';

describe('LapDataParser (Packet ID 2)', () => {
  test('deve decodificar tempos de volta, setores e status de Box', () => {
    const buffer = Buffer.alloc(1327);

    // Header com playerCarIndex = 0
    buffer.writeUInt16LE(2026, 0);
    buffer.writeUInt8(25, 2);
    buffer.writeUInt8(PacketId.LapData, 6);
    buffer.writeUInt8(0, 27); // playerCarIndex = 0

    // Carro 0
    const offset = 29;
    buffer.writeUInt32LE(84520, offset + 0);  // lastLapTime = 1:24.520
    buffer.writeUInt32LE(32100, offset + 4);  // currentLapTime = 32.100s
    buffer.writeUInt16LE(27150, offset + 8);  // S1 ms
    buffer.writeUInt8(0, offset + 10);        // S1 min
    buffer.writeUInt16LE(28400, offset + 11); // S2 ms
    buffer.writeUInt8(0, offset + 13);        // S2 min
    buffer.writeUInt16LE(1450, offset + 14);  // delta to front = 1.450s
    buffer.writeUInt8(0, offset + 16);
    buffer.writeUInt16LE(4200, offset + 17);  // delta to leader = 4.200s
    buffer.writeUInt8(0, offset + 19);
    buffer.writeFloatLE(1500.5, offset + 20); // lapDistance
    buffer.writeFloatLE(0.35, offset + 28);   // safetyCarDelta
    buffer.writeUInt8(3, offset + 32);        // carPosition = P3
    buffer.writeUInt8(14, offset + 33);       // currentLapNum = 14
    buffer.writeUInt8(PitStatus.Pitting, offset + 34); // pitStatus = Pitting (1)
    buffer.writeUInt8(1, offset + 35);        // numPitStops = 1
    buffer.writeUInt8(2, offset + 36);        // sector = 2
    buffer.writeUInt8(DriverStatus.OnTrack, offset + 44);
    buffer.writeUInt8(1, offset + 46);        // pitLaneTimerActive = true
    buffer.writeUInt16LE(12500, offset + 47); // pitLaneTimeInLaneInMS = 12.5s
    buffer.writeUInt16LE(2400, offset + 49);  // pitStopTimerInMS = 2.4s

    const parsed = LapDataParser.parse(buffer);

    assert.equal(parsed.playerLapData.lastLapTimeInMS, 84520);
    assert.equal(parsed.playerLapData.currentLapTimeInMS, 32100);
    assert.equal(parsed.playerLapData.sector1TimeInMS, 27150);
    assert.equal(parsed.playerLapData.sector2TimeInMS, 28400);
    assert.equal(parsed.playerLapData.deltaToCarInFrontInMS, 1450);
    assert.equal(parsed.playerLapData.deltaToRaceLeaderInMS, 4200);
    assert.equal(parsed.playerLapData.carPosition, 3);
    assert.equal(parsed.playerLapData.currentLapNum, 14);
    assert.equal(parsed.playerLapData.pitStatus, PitStatus.Pitting);
    assert.equal(parsed.playerLapData.pitLaneTimerActive, true);
    assert.equal(parsed.playerLapData.pitLaneTimeInLaneInMS, 12500);
    assert.equal(parsed.playerLapData.pitStopTimerInMS, 2400);
  });
});
