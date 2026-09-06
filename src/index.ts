import { UdpReceiver } from './udp/receiver.js';
import { config, getLocalIPv4Addresses } from './config.js';
import { PacketId, PACKET_NAMES } from '@f1-dash/telemetry-core';
import { telemetryStore } from './state/telemetry-store.js';
import { TelemetryWebServer } from './server/web-server.js';
import {
  Colors,
  formatBytes,
  formatGear,
  formatDRS,
  makeProgressBar
} from './utils/formatters.js';

let lastPacketTimestamp = 0;

const receiver = new UdpReceiver({
  port: config.udpPort,
  host: config.udpHost
});

const webServer = new TelemetryWebServer(config.webPort);

// RECEPÇÃO UDP EM ALTA FREQUÊNCIA: Ingestão de todos os pacotes oficiais do F1 25 / 2026
receiver.on('packet', (parsed) => {
  lastPacketTimestamp = Date.now();

  switch (parsed.type) {
    case PacketId.CarTelemetry:
      telemetryStore.updateCarTelemetry(parsed.data);
      break;
    case PacketId.CarTelemetry2:
      telemetryStore.updateCarTelemetry2(parsed.data);
      break;
    case PacketId.CarStatus:
      telemetryStore.updateCarStatus(parsed.data);
      break;
    case PacketId.CarDamage:
      telemetryStore.updateCarDamage(parsed.data);
      break;
    case PacketId.LapData:
      telemetryStore.updateLapData(parsed.data);
      break;
  }
});

receiver.on('error', (err) => {
  console.error(`${Colors.red}[ERRO UDP]${Colors.reset}`, err);
});

// BROADCASTER DESACOPLADO VIA WEBSOCKET (30 SNAPSHOTS/S)
webServer.startSnapshotBroadcaster(telemetryStore, receiver, 30);

// RENDERIZAÇÃO ESTÁVEL DO TERMINAL (2 Hz / 500ms)
setInterval(renderTerminalDashboard, 500);

let isFirstRender = true;

function renderTerminalDashboard(): void {
  const stats = receiver.getStats();
  const snapshot = telemetryStore.getSnapshot();
  const isConnected = lastPacketTimestamp > 0 && Date.now() - lastPacketTimestamp < 2000;
  const localIps = getLocalIPv4Addresses();
  const primaryIp = localIps[0] ?? '127.0.0.1';

  if (isFirstRender) {
    process.stdout.write('\x1b[2J\x1b[H');
    isFirstRender = false;
  } else {
    process.stdout.write('\x1b[H');
  }

  console.log(`${Colors.bold}${Colors.bgBlue}   🏎️  F1 25 TELEMETRY DASHBOARD (COMPLETO: ERS, DANOS, PNEUS)   ${Colors.reset}`);
  console.log(`${Colors.dim}UDP Port:${Colors.reset} ${config.udpPort} (Recepção contínua em 60 Hz)`);
  console.log(`${Colors.dim}Web Dashboard:${Colors.reset} ${Colors.bold}${Colors.green}http://localhost:${config.webPort}${Colors.reset}  ou  ${Colors.bold}${Colors.green}http://${primaryIp}:${config.webPort}${Colors.reset}`);
  console.log(`${Colors.dim}Origem PS5:${Colors.reset} ${stats.remoteInfo ? `${stats.remoteInfo.address}:${stats.remoteInfo.port}` : 'Aguardando...'}`);
  console.log('─'.repeat(72));

  const statusText = isConnected
    ? `${Colors.bgGreen}${Colors.white}${Colors.bold} CONECTADO AO PS5 ${Colors.reset}`
    : `${Colors.bgRed}${Colors.white}${Colors.bold} AGUARDANDO DADOS DO PS5... ${Colors.reset}`;

  console.log(`Status: ${statusText}   |  UDP: ${Colors.bold}${Colors.cyan}${String(stats.packetsPerSecond).padStart(3, ' ')} pkt/s${Colors.reset} | WS: 30 msg/s | UI: 30 FPS`);
  console.log(`Pacotes totais: ${String(stats.totalPackets).padStart(8, ' ')}`);
  console.log('─'.repeat(72));

  if (!snapshot || !isConnected) {
    console.log(`\n${Colors.yellow}💡 ABRA O DASHBOARD COMPLETO NO NAVEGADOR:${Colors.reset} ${Colors.bold}${Colors.cyan}http://localhost:${config.webPort}${Colors.reset}\n`);
    renderPacketStats(stats.packetCountByType);
    return;
  }

  const { car, ers, fuel, damage, race } = snapshot;

  console.log(`${Colors.bold}--- CARRO & PILOTAGEM ---${Colors.reset}`);
  console.log(`Velocidade:  ${Colors.bold}${Colors.white}${String(car.speed).padStart(3, ' ')} km/h${Colors.reset}      Marcha: [ ${formatGear(car.gear)} ]      DRS / Aero: ${car.activeAeroMode === 1 ? 'MODO RETA' : formatDRS(car.drs)}`);
  
  const rpmColor = car.rpm > 11500 ? Colors.red : car.rpm > 10000 ? Colors.yellow : Colors.green;
  const rpmBar = makeProgressBar(car.rpm, 13000, 22, rpmColor);
  console.log(`RPM:         ${String(car.rpm).padStart(5, ' ')} ${rpmBar} (Rev: ${car.revLightsPercent}%)`);

  const thrBar = makeProgressBar(car.throttle, 1.0, 22, Colors.green);
  const brkBar = makeProgressBar(car.brake, 1.0, 22, Colors.red);
  console.log(`Acelerador:  ${(car.throttle * 100).toFixed(0).padStart(3, ' ')}% ${thrBar}`);
  console.log(`Freio:       ${(car.brake * 100).toFixed(0).padStart(3, ' ')}% ${brkBar}`);

  console.log('─'.repeat(72));
  console.log(`${Colors.bold}--- ERS & BATERIA (2026 SPEC) ---${Colors.reset}`);
  const ersBar = makeProgressBar(ers.energyPercent, 100, 20, Colors.cyan);
  const ersModeName = (ers.deployMode === 3 || car.overtakeActive) ? `${Colors.bgGreen}${Colors.white} OVERTAKE / BOOST ${Colors.reset}` : ers.deployMode === 2 ? 'HOTLAP' : ers.deployMode === 1 ? 'MEDIUM' : 'NONE';
  console.log(`ERS Bateria: ${ers.energyPercent.toFixed(1).padStart(5, ' ')}% ${ersBar} | Modo: ${ersModeName}`);

  console.log('─'.repeat(72));
  console.log(`${Colors.bold}--- DANOS & CORRIDA ---${Colors.reset}`);
  console.log(`Posição: P${race.position} | Volta: ${race.currentLap} | Tempo Atual: ${(race.currentLapTimeMS/1000).toFixed(2)}s | Asa Diant: L:${damage.frontLeftWing}% R:${damage.frontRightWing}%`);

  console.log('─'.repeat(72));
  renderPacketStats(stats.packetCountByType);
}

function renderPacketStats(counts: Partial<Record<PacketId, number>>): void {
  const entries = Object.entries(counts);
  if (entries.length === 0) return;

  const summary = entries
    .map(([id, count]) => `${PACKET_NAMES[Number(id) as PacketId] ?? id}: ${count}`)
    .join('  |  ');
  console.log(`${Colors.dim}Pacotes por tipo: ${summary}${Colors.reset}`);
}

async function bootstrap(): Promise<void> {
  await webServer.start();
  await receiver.start();
}

bootstrap().catch((err) => {
  console.error('Falha ao inicializar sistema:', err);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\nEncerrando receptor e servidor Web...');
  await receiver.stop();
  await webServer.stop();
  process.exit(0);
});
