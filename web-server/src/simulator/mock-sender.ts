import dgram from 'node:dgram';
import { PacketId } from '../models/packet-ids.js';
import { PACKET_CAR_TELEMETRY_SIZE_BYTES } from '../models/car-telemetry.js';

const TARGET_PORT = Number(process.env.F1_UDP_PORT || 20777);
const TARGET_HOST = process.env.F1_UDP_HOST || '127.0.0.1';
const HZ = 60; // Adaptado para 60Hz (60 pacotes por segundo)
const INTERVAL_MS = 1000 / HZ;

const client = dgram.createSocket('udp4');

console.log(`\x1b[36m[F1 Mock Simulator]\x1b[0m Iniciando simulação de telemetria para ${TARGET_HOST}:${TARGET_PORT} a ${HZ}Hz...`);

let frameId = 0;
let sessionTime = 0;
let speed = 80;
let gear = 2;
let rpm = 7000;
let throttle = 1.0;
let brake = 0.0;
let steer = 0.0;
let drs = false;
let state: 'accelerating' | 'braking' | 'cornering' = 'accelerating';
let stateTimer = 0;

function generateTelemetryPacket(): Buffer {
  const buffer = Buffer.alloc(PACKET_CAR_TELEMETRY_SIZE_BYTES);

  // --- HEADER (29 bytes) ---
  buffer.writeUInt16LE(2024, 0);                 // m_packetFormat (2024 / 2025)
  buffer.writeUInt8(24, 2);                      // m_gameYear
  buffer.writeUInt8(1, 3);                       // m_gameMajorVersion
  buffer.writeUInt8(15, 4);                      // m_gameMinorVersion
  buffer.writeUInt8(1, 5);                       // m_packetVersion
  buffer.writeUInt8(PacketId.CarTelemetry, 6);   // m_packetId = 6
  buffer.writeBigUInt64LE(1234567890123456789n, 7); // m_sessionUID
  buffer.writeFloatLE(sessionTime, 15);          // m_sessionTime
  buffer.writeUInt32LE(frameId, 19);             // m_frameIdentifier
  buffer.writeUInt32LE(frameId, 23);             // m_overallFrameIdentifier
  buffer.writeUInt8(0, 27);                      // m_playerCarIndex = 0
  buffer.writeUInt8(255, 28);                    // m_secondaryPlayerCarIndex = 255

  // --- CAR TELEMETRY DATA (60 bytes cada para 22 carros) ---
  for (let carIdx = 0; carIdx < 22; carIdx++) {
    const carOffset = 29 + (carIdx * 60);

    const carSpeed = carIdx === 0 ? Math.round(speed) : Math.round(speed * 0.95);
    const carThrottle = carIdx === 0 ? throttle : 0.8;
    const carBrake = carIdx === 0 ? brake : 0.0;
    const carSteer = carIdx === 0 ? steer : 0.0;
    const carGear = carIdx === 0 ? gear : 5;
    const carRpm = carIdx === 0 ? Math.round(rpm) : 10000;
    const carDrs = carIdx === 0 ? (drs ? 1 : 0) : 0;

    buffer.writeUInt16LE(carSpeed, carOffset + 0);           // m_speed
    buffer.writeFloatLE(carThrottle, carOffset + 2);         // m_throttle
    buffer.writeFloatLE(carSteer, carOffset + 6);            // m_steer
    buffer.writeFloatLE(carBrake, carOffset + 10);           // m_brake
    buffer.writeUInt8(0, carOffset + 14);                    // m_clutch
    buffer.writeInt8(carGear, carOffset + 15);               // m_gear
    buffer.writeUInt16LE(carRpm, carOffset + 16);            // m_engineRPM
    buffer.writeUInt8(carDrs, carOffset + 18);               // m_drs
    buffer.writeUInt8(Math.min(100, Math.round((carRpm / 12500) * 100)), carOffset + 19); // m_revLightsPercent
    buffer.writeUInt16LE(0b11111111, carOffset + 20);        // m_revLightsBitValue

    // Freios (RL, RR, FL, FR)
    const brakeTemp = 400 + Math.round(carBrake * 350);
    buffer.writeUInt16LE(brakeTemp, carOffset + 22);
    buffer.writeUInt16LE(brakeTemp, carOffset + 24);
    buffer.writeUInt16LE(brakeTemp + 50, carOffset + 26);
    buffer.writeUInt16LE(brakeTemp + 50, carOffset + 28);

    // Temp Superfície Pneus
    const tyreTemp = 95 + Math.round(carSpeed / 20);
    buffer.writeUInt8(tyreTemp, carOffset + 30);
    buffer.writeUInt8(tyreTemp, carOffset + 31);
    buffer.writeUInt8(tyreTemp + 2, carOffset + 32);
    buffer.writeUInt8(tyreTemp + 2, carOffset + 33);

    // Temp Interna Pneus
    buffer.writeUInt8(tyreTemp - 5, carOffset + 34);
    buffer.writeUInt8(tyreTemp - 5, carOffset + 35);
    buffer.writeUInt8(tyreTemp - 3, carOffset + 36);
    buffer.writeUInt8(tyreTemp - 3, carOffset + 37);

    // Engine Temp
    buffer.writeUInt16LE(104, carOffset + 38);

    // Pressões (PSI)
    buffer.writeFloatLE(22.5, carOffset + 40);
    buffer.writeFloatLE(22.5, carOffset + 44);
    buffer.writeFloatLE(24.0, carOffset + 48);
    buffer.writeFloatLE(24.0, carOffset + 52);

    // Surface types
    buffer.writeUInt8(0, carOffset + 56);
    buffer.writeUInt8(0, carOffset + 57);
    buffer.writeUInt8(0, carOffset + 58);
    buffer.writeUInt8(0, carOffset + 59);
  }

  // Final do pacote (3 bytes)
  buffer.writeUInt8(255, 29 + (22 * 60));     // m_mfdPanelIndex (fechado)
  buffer.writeUInt8(255, 29 + (22 * 60) + 1); // m_mfdPanelIndexSecondaryPlayer
  buffer.writeInt8(gear, 29 + (22 * 60) + 2); // m_suggestedGear

  return buffer;
}

// Loop de simulação de física de pilotagem ajustado para 60Hz
setInterval(() => {
  frameId += 1;
  sessionTime += INTERVAL_MS / 1000;
  stateTimer += INTERVAL_MS;

  if (state === 'accelerating') {
    throttle = 1.0;
    brake = 0.0;
    steer = 0.0;
    speed += 1.25; // metade do incremento pois a frequência dobrou para 60Hz
    rpm += 90;

    if (rpm > 12200 && gear < 8) {
      gear += 1;
      rpm = 9500;
    }

    if (gear >= 7 && speed > 260) {
      drs = true;
    }

    if (speed >= 325 || stateTimer > 8000) {
      state = 'braking';
      stateTimer = 0;
      drs = false;
    }
  } else if (state === 'braking') {
    throttle = 0.0;
    brake = 1.0;
    drs = false;
    speed = Math.max(85, speed - 3.0);
    rpm = Math.max(5000, rpm - 125);

    if (speed < 180 && gear > 4) {
      gear = 4;
      rpm = 8500;
    }
    if (speed < 120 && gear > 2) {
      gear = 2;
      rpm = 7500;
    }

    if (speed <= 90 || stateTimer > 2500) {
      state = 'cornering';
      stateTimer = 0;
    }
  } else if (state === 'cornering') {
    brake = 0.0;
    throttle = 0.45;
    steer = 0.65;
    speed = Math.min(130, speed + 0.4);
    rpm = 6500 + Math.round(throttle * 3000);

    if (stateTimer > 2000) {
      state = 'accelerating';
      stateTimer = 0;
    }
  }

  const packet = generateTelemetryPacket();
  client.send(packet, TARGET_PORT, TARGET_HOST);
}, INTERVAL_MS);
