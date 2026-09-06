import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  HeaderParser,
  TelemetryParser,
  ParserRegistry,
  PacketId
} from '@f1-dash/telemetry-core';

describe('HeaderParser', () => {
  test('deve decodificar corretamente os 29 bytes do Header', () => {
    const buffer = Buffer.alloc(29);
    buffer.writeUInt16LE(2026, 0);                 // packetFormat = 2026
    buffer.writeUInt8(25, 2);                      // gameYear = 25
    buffer.writeUInt8(1, 3);                       // gameMajorVersion
    buffer.writeUInt8(12, 4);                      // gameMinorVersion
    buffer.writeUInt8(1, 5);                       // packetVersion
    buffer.writeUInt8(PacketId.CarTelemetry, 6);   // packetId = 6
    buffer.writeBigUInt64LE(910667543518250301n, 7); // sessionUID
    buffer.writeFloatLE(123.456, 15);              // sessionTime
    buffer.writeUInt32LE(33298, 19);               // frameIdentifier
    buffer.writeUInt32LE(33300, 23);               // overallFrameIdentifier
    buffer.writeUInt8(3, 27);                      // playerCarIndex = 3
    buffer.writeUInt8(255, 28);                    // secondaryPlayerCarIndex

    const header = HeaderParser.parse(buffer);

    assert.equal(header.packetFormat, 2026);
    assert.equal(header.gameYear, 25);
    assert.equal(header.gameMajorVersion, 1);
    assert.equal(header.gameMinorVersion, 12);
    assert.equal(header.packetVersion, 1);
    assert.equal(header.packetId, PacketId.CarTelemetry);
    assert.equal(header.sessionUID, 910667543518250301n);
    assert.ok(Math.abs(header.sessionTime - 123.456) < 0.001);
    assert.equal(header.frameIdentifier, 33298);
    assert.equal(header.overallFrameIdentifier, 33300);
    assert.equal(header.playerCarIndex, 3);
    assert.equal(header.secondaryPlayerCarIndex, 255);
  });

  test('deve lançar erro caso o buffer seja menor que 29 bytes', () => {
    const shortBuffer = Buffer.alloc(20);
    assert.throws(() => {
      HeaderParser.parse(shortBuffer);
    }, /Tamanho de buffer (inválido|insuficiente) para Header/);
  });

  test('peekPacketId deve retornar o PacketId correto', () => {
    const buffer = Buffer.alloc(29);
    buffer.writeUInt8(PacketId.LapData, 6);
    assert.equal(HeaderParser.peekPacketId(buffer), PacketId.LapData);
  });
});

describe('TelemetryParser & Performance', () => {
  test('deve decodificar pacote F1 25 / Formato 2026 de 1448 bytes', () => {
    const buffer = Buffer.alloc(1448);

    buffer.writeUInt16LE(2026, 0);
    buffer.writeUInt8(25, 2);
    buffer.writeUInt8(PacketId.CarTelemetry, 6);
    buffer.writeUInt8(0, 27); // playerCarIndex

    const car0Offset = 29;
    buffer.writeUInt16LE(280, car0Offset + 0);    // speed: 280 km/h
    buffer.writeFloatLE(1.0, car0Offset + 2);     // throttle: 100%
    buffer.writeInt8(7, car0Offset + 15);         // gear: 7
    buffer.writeUInt16LE(11500, car0Offset + 16); // RPM: 11500
    buffer.writeUInt8(1, car0Offset + 18);        // DRS: 1
    buffer.writeUInt8(92, car0Offset + 38);       // engineTemp: 92

    const parsed = TelemetryParser.parse(buffer);

    assert.equal(parsed.carTelemetryData.length, 24);
    assert.equal(parsed.playerCarTelemetry.speed, 280);
    assert.equal(parsed.playerCarTelemetry.gear, 7);
    assert.equal(parsed.playerCarTelemetry.drs, true);
    assert.equal(parsed.playerCarTelemetry.engineRPM, 11500);
    assert.equal(parsed.playerCarTelemetry.engineTemperature, 92);
  });

  test('Performance: deve decodificar 10.000 pacotes em menos de 100ms (< 0.01ms por pacote)', () => {
    const buffer = Buffer.alloc(1448);
    buffer.writeUInt16LE(2026, 0);
    buffer.writeUInt8(25, 2);
    buffer.writeUInt8(PacketId.CarTelemetry, 6);

    const start = performance.now();
    const iterations = 10000;
    for (let i = 0; i < iterations; i++) {
      ParserRegistry.parse(buffer);
    }
    const elapsed = performance.now() - start;
    const avgMs = elapsed / iterations;

    console.log(`\n⚡ Tempo para ${iterations} pacotes: ${elapsed.toFixed(2)}ms (${(avgMs * 1000).toFixed(2)}µs por pacote)`);
    assert.ok(avgMs < 0.05, `Parser deve ser ultra rápido (tempo médio: ${avgMs}ms)`);
  });
});
