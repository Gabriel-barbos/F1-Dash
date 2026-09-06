process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import os from 'node:os';
import dgram from 'node:dgram';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { ParserRegistry, TelemetryStore } from './packages/telemetry-core/src/index';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLocalIp(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

export default defineConfig({
  resolve: {
    alias: {
      '@f1-dash/telemetry-core': path.resolve(__dirname, './packages/telemetry-core/src/index.ts'),
    },
  },
  plugins: [
    react(),
    {
      name: 'f1-udp-telemetry-server',
      configureServer(server) {
        const store = TelemetryStore.getInstance();
        const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        let packetCount = 0;
        let lastPacketReceived = 0;
        let lastLogTime = 0;
        let lastHeaderInfo = '';
        const packetTypesCount: Record<number, number> = {};
        let lastPacket15Debug: any = null;
        let lastPacket16Debug: any = null;
        let lastPacket6Debug: any = null;
        let lastPacket7Debug: any = null;

        udpSocket.on('error', (err) => {
          console.warn('[UDP Socket Error]', err);
        });

        udpSocket.on('message', (msg: Buffer, rinfo) => {
          packetCount++;
          lastPacketReceived = Date.now();
          const format = msg.length >= 2 ? msg.readUInt16LE(0) : 0;
          const pId = msg.length >= 7 ? msg.readUInt8(6) : -1;
          packetTypesCount[pId] = (packetTypesCount[pId] || 0) + 1;

          if (pId === 15) {
            lastPacket15Debug = {
              time: Date.now(),
              size: msg.length,
              playerIndex: msg.length >= 28 ? msg.readUInt8(27) : -1,
            };
          }

          if (pId === 16) {
            lastPacket16Debug = {
              time: Date.now(),
              size: msg.length,
              playerIndex: msg.length >= 28 ? msg.readUInt8(27) : -1,
              hexHeader: msg.subarray(0, Math.min(msg.length, 50)).toString('hex'),
            };
            console.log('⚡ [PACKET 16 RX! CarTelemetry2 2026]', lastPacket16Debug);
          }

          if (pId === 6 && (!lastPacket6Debug || Date.now() - lastPacket6Debug.time > 2000)) {
            const playerIdx = msg.readUInt8(27);
            const playerOffset = 29 + (playerIdx * 59);
            lastPacket6Debug = {
              time: Date.now(),
              playerIdx,
              drs: msg.length > playerOffset + 18 ? msg.readUInt8(playerOffset + 18) : -1,
            };
          }

          if (pId === 7 && (!lastPacket7Debug || Date.now() - lastPacket7Debug.time > 2000)) {
            const playerIdx = msg.readUInt8(27);
            const playerOffset = 29 + (playerIdx * 46);
            lastPacket7Debug = {
              time: Date.now(),
              playerIdx,
              drsAllowed: msg.length > playerOffset + 22 ? msg.readUInt8(playerOffset + 22) : -1,
              ersDeployMode: msg.length > playerOffset + 33 ? msg.readUInt8(playerOffset + 33) : -1,
            };
          }

          // Diagnostic log every 2 seconds
          if (Date.now() - lastLogTime > 2000) {
            lastHeaderInfo = `Format=${format}, PktId=${pId}, From=${rinfo.address}:${rinfo.port}, Size=${msg.length}`;
            console.log(`🏎️ [UDP RX] ${packetCount} pacotes. Pkts: ${JSON.stringify(packetTypesCount)}`);
            lastLogTime = Date.now();
          }

          try {
            const uint8 = new Uint8Array(msg.buffer, msg.byteOffset, msg.byteLength);
            const parsed = ParserRegistry.parse(uint8);
            if (parsed) {
              store.processPacket(parsed);
            }
          } catch (e) {
            console.warn('[UDP Parse Error]', e);
          }
        });

        try {
          udpSocket.bind(20777, '0.0.0.0', () => {
            const lanIp = getLocalIp();
            console.log('\n======================================================');
            console.log('🏎️ [F1 UDP Engine] Escutando pacotes UDP na porta 20777');
            console.log(`🌐 [IP do seu PC na Rede]: ${lanIp}`);
            console.log(`🎮 [No PS5 F1 25]: Telemetria UDP -> IP: ${lanIp} | Porta: 20777`);
            console.log(`📱 [No Celular (PC Relay)]: Servidor -> ${lanIp}:5173`);
            console.log('======================================================\n');
          });
        } catch (err) {
          console.warn('[UDP Socket Bind Warning]', err);
        }

        const wss = new WebSocketServer({ noServer: true });

        server.httpServer?.on('upgrade', (request, socket, head) => {
          if (request.url === '/telemetry-ws') {
            wss.handleUpgrade(request, socket, head, (ws) => {
              console.log('📱 [WS Server] Cliente mobile conectado!');
              wss.emit('connection', ws, request);
            });
          }
        });

        // Endpoint HTTP para checar status em tempo real
        server.middlewares.use('/api/telemetry-status', (req, res) => {
          const cockpit = store.getCockpitState();
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            online: Date.now() - lastPacketReceived < 3000,
            packetCount,
            lastPacketReceived,
            lastHeaderInfo,
            wsClients: wss.clients.size,
            speed: cockpit.speed,
            gear: cockpit.gear,
            rpm: cockpit.engineRPM,
            connected: cockpit.connected,
            is2026Regulations: cockpit.is2026Regulations,
            activeAeroMode: cockpit.activeAeroMode,
            activeAeroAvailable: cockpit.activeAeroAvailable,
            activeAeroActivationDistance: cockpit.activeAeroActivationDistance,
            overtakeActive: cockpit.overtakeActive,
            overtakeAvailable: cockpit.overtakeAvailable,
            overtakeActivationDistance: cockpit.overtakeActivationDistance,
            packetTypesCount,
            lastPacket15Debug,
            lastPacket16Debug,
            lastPacket6Debug,
            lastPacket7Debug,
          }));
        });

        // Broadcast otimizado de telemetria (apenas dados do cockpit leves, sem raceState gigante)
        setInterval(() => {
          if (wss.clients.size === 0) return;
          const cockpitState = store.getCockpitState();
          const isLive = Date.now() - lastPacketReceived < 3000;
          const payload = JSON.stringify({
            ...cockpitState,
            connected: true, // O link WebSocket PC <-> Celular está ativo e saudável
            packetsPerSecond: isLive ? (cockpitState.packetsPerSecond || 20) : 0
          });
          for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          }
        }, 1000 / 25); // 25 FPS para aliviar redes Wi-Fi 2.4G sem perder fluidez

      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
