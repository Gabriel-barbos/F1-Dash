import dgram, { RemoteInfo } from 'node:dgram';
import { PacketId, PACKET_NAMES } from '@f1-dash/telemetry-core';
import { config, getLocalIPv4Addresses } from './config.js';
import { Colors } from './utils/formatters.js';

const PORT = config.udpPort;
const HOST = config.udpHost;
const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

let packetCount = 0;

console.log(`${Colors.bold}${Colors.bgBlue}   🔍 F1 25 UDP RAW DIAGNOSTIC MODE (TELEMETRIA & ERS STATUS)   ${Colors.reset}`);
console.log(`${Colors.dim}Listening on UDP port:${Colors.reset} ${Colors.bold}${Colors.cyan}${PORT}${Colors.reset}`);
console.log(`${Colors.dim}IPs locais detectados:${Colors.reset} ${getLocalIPv4Addresses().join(', ')}`);
console.log(`${Colors.yellow}Aguardando pacotes do PS5 (192.168.1.103)...${Colors.reset}\n`);

socket.on('error', (err) => {
  console.error(`${Colors.red}[UDP ERROR]${Colors.reset}`, err);
});

socket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
  if (msg.length < 29) {
    console.log(`${Colors.red}[PACOTE INVÁLIDO]${Colors.reset} ${msg.length} bytes de ${rinfo.address}:${rinfo.port}`);
    return;
  }

  const packetFormat = msg.readUInt16LE(0);
  const gameYear = msg.readUInt8(2);
  const packetId = msg.readUInt8(6) as PacketId;
  const sessionUID = msg.readBigUInt64LE(7);
  const sessionTime = msg.readFloatLE(15);
  const frameIdentifier = msg.readUInt32LE(19);
  const playerCarIndex = msg.readUInt8(27);

  // --- CAR STATUS (ID 7: BATERIA ERS & MODOS) ---
  if (packetId === PacketId.CarStatus) {
    packetCount++;
    const isFormat2026 = packetFormat === 2026 || msg.length === 1134;
    const carEntrySize = 46; // 46 bytes por carro
    const playerOffset = 29 + (playerCarIndex * carEntrySize);

    if (playerOffset + carEntrySize <= msg.length) {
      // Offsets dentro dos 46 bytes:
      // +0 TC (1), +1 ABS (1), +2 FuelMix (1), +3 BrakeBias (1), +4 PitLimiter (1),
      // +5 FuelInTank (4), +9 FuelCap (4), +13 FuelRemLaps (4), +17 MaxRPM (2), +19 IdleRPM (2),
      // +21 MaxGears (1), +22 DRSAllowed (1), +23 DRSActDist (2), +25 ActualCompound (1),
      // +26 VisualCompound (1), +27 TyresAge (1), +28 FIAFlags (1),
      // +29 ersStoreEnergy (float 4), +33 ersDeployMode (uint8 1), +34 ersHarvestMGUK (4),
      // +38 ersHarvestMGUH (4), +42 ersDeployed (4), +46 networkPaused (1)
      const fuelInTank = msg.readFloatLE(playerOffset + 5);
      const ersStoreEnergy = msg.readFloatLE(playerOffset + 29);
      const ersDeployMode = msg.readUInt8(playerOffset + 33);
      const ersHarvestMGUK = msg.readFloatLE(playerOffset + 34);
      const ersDeployed = msg.readFloatLE(playerOffset + 42);

      const ersPct = Math.min(100, Math.max(0, (ersStoreEnergy / 4000000) * 100));
      const modeName = ersDeployMode === 3 ? 'OVERTAKE / BOOST' : ersDeployMode === 2 ? 'HOTLAP' : ersDeployMode === 1 ? 'MEDIUM' : 'NONE';

      console.log(
        `${Colors.bold}${Colors.bgMagenta} [CAR STATUS ID 7] ${Colors.reset} ` +
        `Frame: ${frameIdentifier} | Tam: ${msg.length}b | PlayerCar: #${playerCarIndex} | ` +
        `⚡ Bateria ERS: ${Colors.bold}${Colors.cyan}${ersPct.toFixed(1)}%${Colors.reset} (${(ersStoreEnergy / 1000000).toFixed(2)} MJ) | ` +
        `Modo: ${Colors.bold}${Colors.yellow}${modeName}${Colors.reset} | Combustível: ${fuelInTank.toFixed(1)}kg`
      );
    }
  }

  // --- CAR TELEMETRY (ID 6: VELOCIDADE, RPM, MARCHA) ---
  if (packetId === PacketId.CarTelemetry) {
    packetCount++;
    const isFormat2026 = packetFormat === 2026 || msg.length === 1448;
    const carEntrySize = isFormat2026 ? 59 : 60;
    const playerOffset = 29 + (playerCarIndex * carEntrySize);

    if (playerOffset + carEntrySize <= msg.length) {
      const rawSpeed = msg.readUInt16LE(playerOffset + 0);
      const rawThrottle = msg.readFloatLE(playerOffset + 2);
      const rawBrake = msg.readFloatLE(playerOffset + 10);
      const rawGear = msg.readInt8(playerOffset + 15);
      const rawEngineRPM = msg.readUInt16LE(playerOffset + 16);
      const rawDrs = msg.readUInt8(playerOffset + 18);

      console.log(
        `${Colors.bold}${Colors.bgCyan} [CAR TELEMETRY ID 6] ${Colors.reset} ` +
        `Frame: ${frameIdentifier} | Tam: ${msg.length}b | PlayerCar: #${playerCarIndex} | ` +
        `Speed: ${Colors.bold}${Colors.cyan}${rawSpeed} km/h${Colors.reset} | ` +
        `Gear: ${Colors.bold}${Colors.yellow}${rawGear === 0 ? 'N' : (rawGear === -1 ? 'R' : rawGear)}${Colors.reset} | ` +
        `RPM: ${rawEngineRPM} | ` +
        `THR: ${(rawThrottle * 100).toFixed(0)}% | BRK: ${(rawBrake * 100).toFixed(0)}% | DRS: ${rawDrs === 1 ? 'ON' : 'OFF'}`
      );
    }
  }
});

socket.bind(PORT, HOST, () => {
  console.log(`Socket escutando em ${HOST}:${PORT}\n`);
});
