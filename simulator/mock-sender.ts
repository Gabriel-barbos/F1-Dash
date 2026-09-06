import dgram from 'node:dgram';
import {
  PacketId,
  SafetyCarStatus,
  Weather,
  SessionType,
  PitStatus,
  DriverStatus,
  ResultStatus,
  ERSDeployMode,
  VisualTyreCompound,
  VehicleFiaFlag
} from '@f1-dash/telemetry-core';

const TARGET_PORT = Number(process.env.F1_UDP_PORT || 20777);
const TARGET_HOST = process.env.F1_UDP_HOST || '127.0.0.1';
const client = dgram.createSocket('udp4');

console.log(`\x1b[36m[F1 25 Multi-Packet Simulator]\x1b[0m Enviando pacotes para ${TARGET_HOST}:${TARGET_PORT}...`);

let frameId = 0;
let sessionTime = 0;
let speed = 90;
let gear = 2;
let rpm = 7500;
let throttle = 1.0;
let brake = 0.0;
let steer = 0.0;
let drs = false;
let state: 'accelerating' | 'braking' | 'cornering' | 'pits' = 'accelerating';
let stateTimer = 0;

// Estados globais simulados
let safetyCarState: SafetyCarStatus = SafetyCarStatus.None;
let isRedFlag = false;
let pitState: PitStatus = PitStatus.None;
let fiaFlag: VehicleFiaFlag = VehicleFiaFlag.None;
let ersBatteryJoules = 3800000;
let fuelKg = 45.2;
let lapNumber = 12;
let lapDistance = 1200;
let pitTimerMS = 0;

function writeHeader(buffer: Buffer, packetId: PacketId): void {
  buffer.writeUInt16LE(2026, 0);                 // packetFormat = 2026 (F1 25)
  buffer.writeUInt8(25, 2);                      // gameYear = 25
  buffer.writeUInt8(1, 3);                       // gameMajorVersion
  buffer.writeUInt8(15, 4);                      // gameMinorVersion
  buffer.writeUInt8(1, 5);                       // packetVersion
  buffer.writeUInt8(packetId, 6);                // packetId
  buffer.writeBigUInt64LE(910667543518250301n, 7); // sessionUID
  buffer.writeFloatLE(sessionTime, 15);          // sessionTime
  buffer.writeUInt32LE(frameId, 19);             // frameIdentifier
  buffer.writeUInt32LE(frameId, 23);             // overallFrameIdentifier
  buffer.writeUInt8(0, 27);                      // playerCarIndex = 0
  buffer.writeUInt8(255, 28);                    // secondaryPlayerCarIndex
}

// 1. GERAÇÃO DE PACOTE DE TELEMETRIA (ID 6 - 60Hz)
function createTelemetryPacket(): Buffer {
  const buffer = Buffer.alloc(1448);
  writeHeader(buffer, PacketId.CarTelemetry);

  for (let i = 0; i < 24; i++) {
    const offset = 29 + (i * 59);
    const carSpeed = i === 0 ? Math.round(speed) : 200;
    const carGear = i === 0 ? gear : 6;
    const carRpm = i === 0 ? Math.round(rpm) : 10500;
    const carThr = i === 0 ? throttle : 0.8;
    const carBrk = i === 0 ? brake : 0.0;
    const carDrs = i === 0 ? (drs ? 1 : 0) : 0;

    buffer.writeUInt16LE(carSpeed, offset + 0);
    buffer.writeFloatLE(carThr, offset + 2);
    buffer.writeFloatLE(steer, offset + 6);
    buffer.writeFloatLE(carBrk, offset + 10);
    buffer.writeUInt8(0, offset + 14);
    buffer.writeInt8(carGear, offset + 15);
    buffer.writeUInt16LE(carRpm, offset + 16);
    buffer.writeUInt8(carDrs, offset + 18);
    buffer.writeUInt8(Math.min(100, Math.round((carRpm / 13500) * 100)), offset + 19);
    buffer.writeUInt16LE(0b11111111, offset + 20);

    // Freios (RL, RR, FL, FR)
    const bTemp = 420 + Math.round(carBrk * 300);
    buffer.writeUInt16LE(bTemp, offset + 22);
    buffer.writeUInt16LE(bTemp, offset + 24);
    buffer.writeUInt16LE(bTemp + 40, offset + 26);
    buffer.writeUInt16LE(bTemp + 40, offset + 28);

    // Temp Superfície Pneus
    buffer.writeUInt8(98, offset + 30);
    buffer.writeUInt8(98, offset + 31);
    buffer.writeUInt8(101, offset + 32);
    buffer.writeUInt8(101, offset + 33);

    // Temp Interna Pneus
    buffer.writeUInt8(93, offset + 34);
    buffer.writeUInt8(93, offset + 35);
    buffer.writeUInt8(95, offset + 36);
    buffer.writeUInt8(95, offset + 37);

    buffer.writeUInt8(96, offset + 38); // engineTemperature uint8

    // Pressões (PSI)
    buffer.writeFloatLE(22.8, offset + 39);
    buffer.writeFloatLE(22.8, offset + 43);
    buffer.writeFloatLE(24.2, offset + 47);
    buffer.writeFloatLE(24.2, offset + 51);
  }

  return buffer;
}

// 2. GERAÇÃO DE CAR STATUS (ID 7 - 20Hz)
function createCarStatusPacket(): Buffer {
  const buffer = Buffer.alloc(1134);
  writeHeader(buffer, PacketId.CarStatus);

  for (let i = 0; i < 24; i++) {
    const offset = 29 + (i * 46);
    buffer.writeUInt8(1, offset + 0); // TC
    buffer.writeUInt8(1, offset + 1); // ABS
    buffer.writeUInt8(1, offset + 2); // FuelMix
    buffer.writeUInt8(56, offset + 3); // BrakeBias
    buffer.writeUInt8(pitState !== PitStatus.None ? 1 : 0, offset + 4); // PitLimiter
    buffer.writeFloatLE(fuelKg, offset + 5);
    buffer.writeFloatLE(110.0, offset + 9);
    buffer.writeFloatLE(22.4, offset + 13);
    buffer.writeUInt16LE(13500, offset + 17); // MaxRPM
    buffer.writeUInt16LE(4200, offset + 19);  // IdleRPM
    buffer.writeUInt8(8, offset + 21);
    buffer.writeUInt8(speed > 250 && gear >= 7 ? 1 : 0, offset + 22); // DRS Allowed
    buffer.writeUInt16LE(0, offset + 23);
    buffer.writeUInt8(16, offset + 25);
    buffer.writeUInt8(VisualTyreCompound.F1_Soft, offset + 26);
    buffer.writeUInt8(4, offset + 27); // Tyres age
    buffer.writeInt8(fiaFlag, offset + 28);
    buffer.writeFloatLE(ersBatteryJoules, offset + 29);
    buffer.writeUInt8(drs ? ERSDeployMode.Overtake : ERSDeployMode.Medium, offset + 33);
    buffer.writeFloatLE(250000, offset + 34);
    buffer.writeFloatLE(120000, offset + 38);
    buffer.writeFloatLE(600000, offset + 42);
  }

  return buffer;
}

// 3. GERAÇÃO DE LAP DATA (ID 2 - 20Hz)
function createLapDataPacket(): Buffer {
  const buffer = Buffer.alloc(1327);
  writeHeader(buffer, PacketId.LapData);

  for (let i = 0; i < 24; i++) {
    const offset = 29 + (i * 54);
    buffer.writeUInt32LE(84520, offset + 0);  // lastLapTime (1:24.520)
    buffer.writeUInt32LE(32450, offset + 4);  // currentLapTime
    buffer.writeUInt16LE(27150, offset + 8);  // S1 MS
    buffer.writeUInt8(0, offset + 10);        // S1 Min
    buffer.writeUInt16LE(28200, offset + 11); // S2 MS
    buffer.writeUInt8(0, offset + 13);        // S2 Min
    buffer.writeUInt16LE(1240, offset + 14);  // Delta in front
    buffer.writeUInt8(0, offset + 16);
    buffer.writeUInt16LE(3450, offset + 17);  // Delta leader
    buffer.writeUInt8(0, offset + 19);
    buffer.writeFloatLE(lapDistance, offset + 20);
    buffer.writeFloatLE(lapDistance + (lapNumber * 5300), offset + 24);
    buffer.writeFloatLE(0.42, offset + 28);   // SafetyCar delta
    buffer.writeUInt8(2, offset + 32);        // Car position P2
    buffer.writeUInt8(lapNumber, offset + 33);
    buffer.writeUInt8(pitState, offset + 34);
    buffer.writeUInt8(1, offset + 35);        // Num pit stops
    buffer.writeUInt8(2, offset + 36);        // Sector 2
    buffer.writeUInt8(0, offset + 37);        // Current lap valid
    buffer.writeUInt8(0, offset + 38);        // Penalties
    buffer.writeUInt8(0, offset + 39);
    buffer.writeUInt8(0, offset + 40);
    buffer.writeUInt8(0, offset + 41);
    buffer.writeUInt8(0, offset + 42);
    buffer.writeUInt8(3, offset + 43);        // Grid position P3
    buffer.writeUInt8(DriverStatus.OnTrack, offset + 44);
    buffer.writeUInt8(ResultStatus.Active, offset + 45);
    buffer.writeUInt8(pitState !== PitStatus.None ? 1 : 0, offset + 46); // pitLaneTimerActive
    buffer.writeUInt16LE(pitTimerMS, offset + 47);
    buffer.writeUInt16LE(pitState === PitStatus.InPitArea ? 2800 : 0, offset + 49);
    buffer.writeUInt8(0, offset + 51);
  }

  return buffer;
}

// 4. GERAÇÃO DE SESSION DATA (ID 1 - 2Hz)
function createSessionPacket(): Buffer {
  const buffer = Buffer.alloc(700);
  writeHeader(buffer, PacketId.Session);

  buffer.writeUInt8(Weather.Clear, 29);
  buffer.writeInt8(34, 30);                // Track temp: 34C
  buffer.writeInt8(26, 31);                // Air temp: 26C
  buffer.writeUInt8(57, 32);               // Total laps: 57
  buffer.writeUInt16LE(5412, 33);          // Track length
  buffer.writeUInt8(SessionType.Race, 35);
  buffer.writeInt8(3, 36);                 // Track ID: Bahrain
  buffer.writeUInt8(0, 37);                // Formula: Modern
  buffer.writeUInt16LE(3200, 38);          // Session time left
  buffer.writeUInt16LE(5400, 40);          // Session duration
  buffer.writeUInt8(80, 42);               // Pit speed limit: 80 km/h
  buffer.writeUInt8(0, 43);                // Game paused: false

  buffer.writeUInt8(0, 46);                // numMarshalZones = 0
  const scOffset = 153;                    // Offset após marshal zones
  buffer.writeUInt8(safetyCarState, scOffset); // Safety car status

  return buffer;
}

// 5. GERAÇÃO DE DANOS (ID 10 - 2Hz)
function createDamagePacket(): Buffer {
  const buffer = Buffer.alloc(1000);
  writeHeader(buffer, PacketId.CarDamage);

  for (let i = 0; i < 24; i++) {
    const offset = 29 + (i * 40);
    buffer.writeFloatLE(12.5, offset + 0); // Tyre wear RL %
    buffer.writeFloatLE(12.5, offset + 4); // Tyre wear RR %
    buffer.writeFloatLE(16.0, offset + 8); // Tyre wear FL %
    buffer.writeFloatLE(18.2, offset + 12); // Tyre wear FR %
    buffer.writeUInt8(0, offset + 16);
    buffer.writeUInt8(0, offset + 17);
    buffer.writeUInt8(0, offset + 18);
    buffer.writeUInt8(0, offset + 19);
    buffer.writeUInt8(0, offset + 20);     // Wing damage
    buffer.writeUInt8(0, offset + 21);
    buffer.writeUInt8(0, offset + 22);
  }

  return buffer;
}

// 6. GERAÇÃO DE CAR TELEMETRY 2 (ID 16 - Regulamento 2026 Active Aero & Overtake 1s)
function createTelemetry2Packet(): Buffer {
  const buffer = Buffer.alloc(29 + 24 * 10); // Exatos 269 bytes
  writeHeader(buffer, PacketId.CarTelemetry2);

  const isStraight = gear >= 7 && speed > 260;
  const isApproachingStraight = gear >= 5 && speed > 200 && !isStraight;
  // Simula perseguição a rival (< 1s atrás): Overtake disponível na aproximação da reta e ativo na reta acima de 280
  const isCloseToRival = (frameId % 600) < 400; // 66% do tempo em disputa de ultrapassagem

  for (let i = 0; i < 24; i++) {
    const offset = 29 + (i * 10);

    if (i === 0) {
      // Carro do Jogador
      const aeroMode = isStraight ? 1 : 0;
      const aeroAvail = isStraight || isApproachingStraight ? 1 : 0;
      const aeroDist = isApproachingStraight ? Math.max(10, Math.round(260 - speed)) : 0;
      const ovtkAvail = isCloseToRival && (isStraight || isApproachingStraight) ? 1 : 0;
      const ovtkActive = ovtkAvail && isStraight && speed > 285 ? 1 : 0;
      const ovtkDist = isApproachingStraight ? Math.max(15, Math.round(270 - speed)) : 0;

      buffer.writeUInt8(aeroMode, offset + 0);               // activeAeroMode (0=Z/Curva, 1=X/Reta)
      buffer.writeUInt8(aeroAvail, offset + 1);              // activeAeroAvailable
      buffer.writeUInt16LE(aeroDist, offset + 2);            // activeAeroActivationDistance
      buffer.writeUInt8(ovtkAvail, offset + 4);              // overtakeAvailable (< 1s do rival)
      buffer.writeUInt8(ovtkActive, offset + 5);             // overtakeActive (potência extra)
      buffer.writeUInt16LE(ovtkDist, offset + 6);            // overtakeActivationDistance
      buffer.writeUInt8(1, offset + 8);                      // is2026Regulations (1 = Regulamento 2026)
      buffer.writeUInt8(0, offset + 9);                      // drivingWrongWay
    } else {
      // Carros da IA
      buffer.writeUInt8(isStraight ? 1 : 0, offset + 0);
      buffer.writeUInt8(isStraight ? 1 : 0, offset + 1);
      buffer.writeUInt16LE(0, offset + 2);
      buffer.writeUInt8(0, offset + 4);
      buffer.writeUInt8(0, offset + 5);
      buffer.writeUInt16LE(0, offset + 6);
      buffer.writeUInt8(1, offset + 8);
      buffer.writeUInt8(0, offset + 9);
    }
  }

  return buffer;
}

// Loop de simulação física (60Hz)
setInterval(() => {
  frameId++;
  sessionTime += 1 / 60;
  stateTimer += 1000 / 60;
  lapDistance += speed * (1 / 60) * 0.277; // metros percorridos

  // Simulação de ciclo de pilotagem
  if (state === 'accelerating') {
    throttle = 1.0;
    brake = 0.0;
    steer = 0.0;
    speed += 1.3;
    rpm += 95;

    if (rpm > 12400 && gear < 8) {
      gear++;
      rpm = 9600;
    }

    if (gear >= 7 && speed > 260) {
      drs = true;
    }

    if (speed >= 330 || stateTimer > 7000) {
      state = 'braking';
      stateTimer = 0;
      drs = false;
    }
  } else if (state === 'braking') {
    throttle = 0.0;
    brake = 1.0;
    drs = false;
    speed = Math.max(85, speed - 3.2);
    rpm = Math.max(5000, rpm - 130);

    if (speed < 180 && gear > 4) {
      gear = 4;
      rpm = 8500;
    }
    if (speed < 120 && gear > 2) {
      gear = 2;
      rpm = 7200;
    }

    if (speed <= 90 || stateTimer > 2500) {
      state = 'cornering';
      stateTimer = 0;
    }
  } else if (state === 'cornering') {
    brake = 0.0;
    throttle = 0.5;
    steer = 0.7;
    speed = Math.min(140, speed + 0.5);
    rpm = 6800 + Math.round(throttle * 3000);

    if (stateTimer > 2500) {
      state = 'accelerating';
      stateTimer = 0;
    }
  }

  // Envia Telemetria (ID 6) e Car Telemetry 2 (ID 15 - 2026) a 60Hz
  client.send(createTelemetryPacket(), TARGET_PORT, TARGET_HOST);
  client.send(createTelemetry2Packet(), TARGET_PORT, TARGET_HOST);
}, 1000 / 60);

// Envia Status & LapData a 20Hz
setInterval(() => {
  client.send(createCarStatusPacket(), TARGET_PORT, TARGET_HOST);
  client.send(createLapDataPacket(), TARGET_PORT, TARGET_HOST);
}, 50);

// Envia Session & Damage a 2Hz
setInterval(() => {
  client.send(createSessionPacket(), TARGET_PORT, TARGET_HOST);
  client.send(createDamagePacket(), TARGET_PORT, TARGET_HOST);
}, 500);

// Simulação de eventos e bandeiras (a cada 15 segundos altera status para demonstração)
let eventCycle = 0;
setInterval(() => {
  eventCycle = (eventCycle + 1) % 6;
  switch (eventCycle) {
    case 0:
      safetyCarState = SafetyCarStatus.None;
      fiaFlag = VehicleFiaFlag.Green;
      pitState = PitStatus.None;
      console.log('🟢 [Simulador] Pista liberada (Green Flag)');
      break;
    case 1:
      fiaFlag = VehicleFiaFlag.Yellow;
      console.log('🟡 [Simulador] Bandeira Amarela no setor');
      break;
    case 2:
      safetyCarState = SafetyCarStatus.Virtual;
      console.log('🟠 [Simulador] VIRTUAL SAFETY CAR (VSC) acionado!');
      break;
    case 3:
      safetyCarState = SafetyCarStatus.Full;
      console.log('🟡 [Simulador] SAFETY CAR completo na pista!');
      break;
    case 4:
      safetyCarState = SafetyCarStatus.None;
      fiaFlag = VehicleFiaFlag.None;
      pitState = PitStatus.Pitting;
      console.log('🔵 [Simulador] Carro entrando nos Boxes (In Pit Lane)');
      break;
    case 5:
      pitState = PitStatus.InPitArea;
      pitTimerMS = 2800;
      console.log('🔴 [Simulador] Pit Stop - Troca de pneus (2.8s)');
      break;
  }
}, 8000);
