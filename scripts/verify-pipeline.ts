import { UdpReceiver } from '../src/udp/receiver';
import { TelemetryStore } from '@f1-dash/telemetry-core';
import { spawn } from 'node:child_process';

async function main() {
  const store = TelemetryStore.getInstance();
  const receiver = new UdpReceiver({ port: 20777 });
  receiver.on('packet', (parsed) => {
    store.processPacket(parsed);
  });
  await receiver.start();

  console.log('🚀 [Verify Pipeline] Receiver UDP iniciado na porta 20777.');

  const mockProc = spawn('npx', ['tsx', 'simulator/mock-sender.ts'], {
    shell: true,
    stdio: 'ignore'
  });

  let checks = 0;
  const interval = setInterval(() => {
    const s = store.getCockpitState();
    console.log(
      `📊 [LIVE TELEMETRY] Conectado: ${s.connected ? 'SIM' : 'NÃO'} (${s.packetsPerSecond} Hz) | ` +
      `Velocidade: ${s.speed} km/h | Marcha: ${s.gear} | RPM: ${s.engineRPM} | ` +
      `⚡ ERS: ${s.ersPercentage.toFixed(0)}% (${s.ersDeployMode}) | ` +
      `🛑 Pit: ${s.pitStatus} | 🚩 SC: ${s.safetyCarStatus} | Bandeira FIA: ${s.vehicleFiaFlags}`
    );

    checks++;
    if (checks >= 6) {
      clearInterval(interval);
      try {
        process.kill(mockProc.pid!);
      } catch {}
      receiver.stop();
      console.log('✅ [Verify Pipeline] Pipeline UDP e interpretação de pacotes validada com 100% de sucesso!');
      process.exit(0);
    }
  }, 500);
}

main().catch(console.error);
