import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  BinaryReader,
  PacketId,
  HeaderParser,
  TelemetryParser,
  Telemetry2Parser,
  CarStatusParser,
  CarDamageParser,
  LapDataParser,
  SessionParser,
  EventParser,
  ParserRegistry,
  RaceStateNormalizer,
  DerivedTelemetryEngine,
  ERSDeployMode,
  VisualTyreCompound,
  VehicleFiaFlag,
  SafetyCarStatus,
  Weather,
  SessionType,
  toCockpitTelemetryState
} from '../packages/telemetry-core/src/index';

function createMockHeaderBuffer(packetId: PacketId, format = 2026): Buffer {
  const buf = Buffer.alloc(29);
  buf.writeUInt16LE(format, 0);                 // packetFormat
  buf.writeUInt8(25, 2);                        // gameYear
  buf.writeUInt8(1, 3);                         // gameMajorVersion
  buf.writeUInt8(15, 4);                        // gameMinorVersion
  buf.writeUInt8(1, 5);                         // packetVersion
  buf.writeUInt8(packetId, 6);                  // packetId
  buf.writeBigUInt64LE(910667543518250301n, 7); // sessionUID
  buf.writeFloatLE(125.45, 15);                 // sessionTime
  buf.writeUInt32LE(1500, 19);                  // frameIdentifier
  buf.writeUInt32LE(1500, 23);                  // overallFrameIdentifier
  buf.writeUInt8(0, 27);                        // playerCarIndex
  buf.writeUInt8(255, 28);                      // secondaryPlayerCarIndex
  return buf;
}

describe('Universal Telemetry Core — Parsers & Normalization', () => {

  it('HeaderParser deve decodificar perfeitamente o cabeçalho oficial de 29 bytes', () => {
    const buf = createMockHeaderBuffer(PacketId.CarTelemetry);
    const uint8 = new Uint8Array(buf);
    const header = HeaderParser.parse(uint8);

    assert.strictEqual(header.packetFormat, 2026);
    assert.strictEqual(header.gameYear, 25);
    assert.strictEqual(header.packetId, PacketId.CarTelemetry);
    assert.strictEqual(header.playerCarIndex, 0);
    assert.strictEqual(header.secondaryPlayerCarIndex, 255);
    assert.strictEqual(header.frameIdentifier, 1500);
    assert.strictEqual(HeaderParser.peekPacketId(uint8), PacketId.CarTelemetry);
  });

  it('Telemetry2Parser (Packet 16) deve decodificar Active Aero, Overtake 1s e Regulamento 2026', () => {
    const headerBuf = createMockHeaderBuffer(PacketId.CarTelemetry2);
    // Cada carro: activeAeroMode(1) + activeAeroAvailable(1) + activeAeroDist(2) + overtakeAvailable(1) + overtakeActive(1) + overtakeDist(2) + is2026Regulations(1) + wrongWay(1) = 10 bytes
    const carEntryBuf = Buffer.alloc(24 * 10);

    // Carro 0 (Jogador)
    carEntryBuf.writeUInt8(1, 0);             // activeAeroMode: 1 (Modo Reta / X)
    carEntryBuf.writeUInt8(1, 1);             // activeAeroAvailable: 1
    carEntryBuf.writeUInt16LE(150, 2);        // activeAeroActivationDistance: 150m
    carEntryBuf.writeUInt8(1, 4);             // overtakeAvailable: 1 (< 1s atrás do rival)
    carEntryBuf.writeUInt8(1, 5);             // overtakeActive: 1 (Overtake ON)
    carEntryBuf.writeUInt16LE(50, 6);         // overtakeActivationDistance: 50m
    carEntryBuf.writeUInt8(1, 8);             // is2026Regulations: 1
    carEntryBuf.writeUInt8(0, 9);             // drivingWrongWay: false

    const fullPacket = Buffer.concat([headerBuf, carEntryBuf]);
    assert.strictEqual(fullPacket.length, 269, 'Tamanho oficial do Packet 16 deve ser exatamente 269 bytes');

    const uint8 = new Uint8Array(fullPacket);
    const parsed = Telemetry2Parser.parse(uint8);

    assert.strictEqual(parsed.playerCarTelemetry2.activeAeroMode, 1);
    assert.strictEqual(parsed.playerCarTelemetry2.activeAeroAvailable, true);
    assert.strictEqual(parsed.playerCarTelemetry2.activeAeroActivationDistance, 150);
    assert.strictEqual(parsed.playerCarTelemetry2.overtakeAvailable, true);
    assert.strictEqual(parsed.playerCarTelemetry2.overtakeActive, true);
    assert.strictEqual(parsed.playerCarTelemetry2.overtakeActivationDistance, 50);
    assert.strictEqual(parsed.playerCarTelemetry2.is2026Regulations, true);

    // Verifica se normalizer e toCockpitTelemetryState mapeiam as distâncias e flags
    const normalizer = new RaceStateNormalizer();
    const state = normalizer.processPacket({ type: PacketId.CarTelemetry2, data: parsed });
    const cockpit = toCockpitTelemetryState(state);
    assert.strictEqual(cockpit.is2026Regulations, true);
    assert.strictEqual(cockpit.activeAeroMode, 1);
    assert.strictEqual(cockpit.activeAeroAvailable, true);
    assert.strictEqual(cockpit.activeAeroActivationDistance, 150);
    assert.strictEqual(cockpit.overtakeAvailable, true);
    assert.strictEqual(cockpit.overtakeActive, true);
    assert.strictEqual(cockpit.overtakeActivationDistance, 50);
  });

  it('SessionParser (Packet 1) deve ler clima, safety car e detectar red flag sem bugs de offset', () => {
    const headerBuf = createMockHeaderBuffer(PacketId.Session);
    const sessionPayload = Buffer.alloc(700);

    sessionPayload.writeUInt8(Weather.Clear, 0);
    sessionPayload.writeInt8(35, 1);           // trackTemperature: 35C
    sessionPayload.writeInt8(26, 2);           // airTemperature: 26C
    sessionPayload.writeUInt8(57, 3);          // totalLaps: 57
    sessionPayload.writeUInt16LE(5412, 4);     // trackLength: 5412m
    sessionPayload.writeUInt8(SessionType.Race, 6);
    sessionPayload.writeInt8(3, 7);            // trackId: 3
    sessionPayload.writeUInt8(0, 8);           // formula
    sessionPayload.writeUInt16LE(3600, 9);     // timeLeft
    sessionPayload.writeUInt16LE(5400, 11);    // duration
    sessionPayload.writeUInt8(80, 13);         // pitSpeedLimit
    sessionPayload.writeUInt8(0, 14);          // gamePaused
    sessionPayload.writeUInt8(0, 15);          // isSpectating
    sessionPayload.writeUInt8(0, 16);          // spectatorCarIndex
    sessionPayload.writeUInt8(0, 17);          // sliProNativeSupport

    // 21 Marshal Zones
    sessionPayload.writeUInt8(2, 18);          // numMarshalZones = 2
    // Zona 0
    sessionPayload.writeFloatLE(0.0, 19);
    sessionPayload.writeInt8(1, 23);           // Green flag
    // Zona 1
    sessionPayload.writeFloatLE(0.5, 24);
    sessionPayload.writeInt8(0, 28);           // No flag

    const scOffset = 18 + 1 + (21 * 5);        // 124
    sessionPayload.writeUInt8(SafetyCarStatus.Full, scOffset); // Safety Car Full

    const fullPacket = Buffer.concat([headerBuf, sessionPayload]);
    const uint8 = new Uint8Array(fullPacket);
    const parsed = SessionParser.parse(uint8);

    assert.strictEqual(parsed.weather, Weather.Clear);
    assert.strictEqual(parsed.trackTemperature, 35);
    assert.strictEqual(parsed.airTemperature, 26);
    assert.strictEqual(parsed.safetyCarStatus, SafetyCarStatus.Full);
    assert.strictEqual(parsed.isRedFlagActive, false); // Não há bandeira vermelha ativa
  });

  it('EventParser (Packet 3) deve decodificar eventos de volta mais rápida e largada', () => {
    const headerBuf = createMockHeaderBuffer(PacketId.Event);
    const eventPayload = Buffer.alloc(16);
    eventPayload.write('FTLP', 0, 4, 'ascii'); // Fastest Lap
    eventPayload.writeUInt8(0, 4);             // vehicleIdx = 0 (player)
    eventPayload.writeFloatLE(83.456, 5);      // 1:23.456

    const fullPacket = Buffer.concat([headerBuf, eventPayload]);
    const uint8 = new Uint8Array(fullPacket);
    const parsed = EventParser.parse(uint8);

    assert.strictEqual(parsed.eventStringCode, 'FTLP');
    assert.strictEqual((parsed.eventDetails as any).details.vehicleIdx, 0);
    assert.strictEqual(Math.round((parsed.eventDetails as any).details.lapTime * 1000), 83456);
  });

  it('DerivedTelemetryEngine deve calcular Setor 3 deterministicamente', () => {
    const engine = new DerivedTelemetryEngine();
    const result = engine.update({
      engineRPM: 12000,
      maxRPM: 13500,
      revLightsPercent: 88,
      lastLapTimeMS: 84500,  // 1:24.500
      sector1TimeMS: 27500,  // 27.500s
      sector2TimeMS: 28500,  // 28.500s
      carPosition: 2,
      gridPosition: 5,
      fuelInTank: 45.0,
      fuelRemainingLaps: 24,
      currentLap: 10,
      totalLaps: 50,
      tyresWear: [12.0, 12.0, 15.0, 15.0],
      tyresAgeLaps: 5
    });

    // S3 = 84500 - 27500 - 28500 = 28500
    assert.strictEqual(result.sector3TimeMS, 28500);
    assert.strictEqual(result.positionsGainedLost, 3); // largou em P5, está em P2 (+3)
    assert.strictEqual(result.activeShiftLeds, 13);
    assert.strictEqual(result.isShiftFlash, false);
    assert.strictEqual(result.tyreWearRatePerLap[2], 3); // 15% / 5 voltas = 3%/volta
  });

  it('Paridade Estrita: Node Buffer e Uint8Array produzem o mesmo RaceState', () => {
    // 1. Simula pacote de telemetria
    const headerBuf = createMockHeaderBuffer(PacketId.CarTelemetry);
    const carDataBuf = Buffer.alloc(24 * 59);
    carDataBuf.writeUInt16LE(315, 0);         // Speed: 315 km/h
    carDataBuf.writeFloatLE(1.0, 2);          // Throttle: 1.0
    carDataBuf.writeInt8(7, 15);              // Gear: 7
    carDataBuf.writeUInt16LE(11800, 16);      // RPM: 11800
    carDataBuf.writeUInt8(1, 18);             // DRS: true
    carDataBuf.writeUInt8(85, 19);            // revLightsPercent: 85
    carDataBuf.writeUInt8(98, 38);            // engineTemperature: 98C
    const fullTelemetryPacket = Buffer.concat([headerBuf, carDataBuf, Buffer.alloc(3)]);

    // Execução A: Buffer direto do Node (convertido via Uint8Array)
    const normalizerNode = new RaceStateNormalizer();
    const parsedFromNode = ParserRegistry.parse(new Uint8Array(fullTelemetryPacket));
    const stateFromNode = normalizerNode.processPacket(parsedFromNode);

    // Execução B: ArrayBuffer puro (como no React Native)
    const arrayBuffer = fullTelemetryPacket.buffer.slice(
      fullTelemetryPacket.byteOffset,
      fullTelemetryPacket.byteOffset + fullTelemetryPacket.byteLength
    );
    const normalizerNative = new RaceStateNormalizer();
    const parsedFromNative = ParserRegistry.parse(arrayBuffer);
    const stateFromNative = normalizerNative.processPacket(parsedFromNative);

    // Validação de paridade total
    assert.strictEqual(stateFromNode.car.speed, stateFromNative.car.speed);
    assert.strictEqual(stateFromNode.car.gear, stateFromNative.car.gear);
    assert.strictEqual(stateFromNode.car.rpm, stateFromNative.car.rpm);
    assert.strictEqual(stateFromNode.car.drsActive, stateFromNative.car.drsActive);
    assert.strictEqual(stateFromNode.car.engineTemperature, stateFromNative.car.engineTemperature);
    assert.strictEqual(stateFromNode.derived.activeShiftLeds, stateFromNative.derived.activeShiftLeds);
  });

  it('CarDamageParser deve decodificar F1 24/25 com tyre blisters sem deslocar campos de asa para o difusor', () => {
    const headerBuf = createMockHeaderBuffer(PacketId.CarDamage, 2024);
    // Cada carro F1 24: 16b (tyresWear) + 4b (tyresDmg) + 4b (brakesDmg) + 4b (blisters) + 1b (flWing) + 1b (frWing) + 1b (rWing) + 1b (floor) + 1b (diffuser) + 1b (sidepod) + 12b (rest) = 46 bytes
    const carEntryBuf = Buffer.alloc(22 * 46);

    // Carro 0 (Jogador): Dano exclusivo de asa dianteira (65% FL, 30% FR)
    // 0..15: tyresWear
    carEntryBuf.writeFloatLE(10.0, 0);
    carEntryBuf.writeFloatLE(10.0, 4);
    carEntryBuf.writeFloatLE(12.0, 8);
    carEntryBuf.writeFloatLE(12.0, 12);
    // 16..19: tyresDamage
    // 20..23: brakesDamage
    // 24..27: tyreBlisters (F1 24+)
    carEntryBuf.writeUInt8(5, 24);
    carEntryBuf.writeUInt8(6, 25);
    carEntryBuf.writeUInt8(7, 26);
    carEntryBuf.writeUInt8(8, 27);
    // 28: frontLeftWingDamage
    carEntryBuf.writeUInt8(65, 28);
    // 29: frontRightWingDamage
    carEntryBuf.writeUInt8(30, 29);
    // 30: rearWingDamage
    carEntryBuf.writeUInt8(0, 30);
    // 31: floorDamage
    carEntryBuf.writeUInt8(0, 31);
    // 32: diffuserDamage
    carEntryBuf.writeUInt8(0, 32);
    // 33: sidepodDamage
    carEntryBuf.writeUInt8(0, 33);

    const fullPacket = Buffer.concat([headerBuf, carEntryBuf]);
    const parsed = CarDamageParser.parse(new Uint8Array(fullPacket));

    // Validação crucial: o dano de 65% DEVE estar na asa dianteira e NÃO no difusor/motor
    assert.strictEqual(parsed.playerCarDamage.frontLeftWingDamage, 65, 'Asa dianteira esquerda deve ser 65%');
    assert.strictEqual(parsed.playerCarDamage.frontRightWingDamage, 30, 'Asa dianteira direita deve ser 30%');
    assert.strictEqual(parsed.playerCarDamage.rearWingDamage, 0, 'Asa traseira deve ser 0%');
    assert.strictEqual(parsed.playerCarDamage.diffuserDamage, 0, 'Difusor deve ser 0%');
    assert.strictEqual(parsed.playerCarDamage.floorDamage, 0, 'Assoalho deve ser 0%');
  });
});
