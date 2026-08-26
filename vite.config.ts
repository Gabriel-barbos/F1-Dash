import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dgram from 'node:dgram';
import { WebSocketServer, WebSocket } from 'ws';
import { ParserRegistry } from './src/core/parser/parser-registry';
import { TelemetryStore } from './src/core/state/telemetry-store';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'f1-udp-telemetry-server',
      configureServer(server) {
        const store = TelemetryStore.getInstance();
        const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        udpSocket.on('error', (err) => {
          console.warn('[UDP Socket Error]', err);
        });

        udpSocket.on('message', (msg: Buffer) => {
          const parsed = ParserRegistry.parse(msg);
          if (parsed) {
            store.processPacket(parsed);
          }
        });

        try {
          udpSocket.bind(20777, '0.0.0.0', () => {
            console.log('\n🏎️ [F1 UDP Engine] Escutando pacotes UDP na porta 20777');
            console.log('📱 [Mobile Hot Reload] Abra no celular: http://192.168.1.104:5173\n');
          });
        } catch (err) {
          console.warn('[UDP Socket Bind Warning]', err);
        }

        const wss = new WebSocketServer({ noServer: true });

        server.httpServer?.on('upgrade', (request, socket, head) => {
          if (request.url === '/telemetry-ws') {
            wss.handleUpgrade(request, socket, head, (ws) => {
              wss.emit('connection', ws, request);
            });
          }
        });

        // Broadcast de telemetria a 60Hz para todas as telas conectadas
        setInterval(() => {
          if (wss.clients.size === 0) return;
          const state = store.getState();
          const payload = JSON.stringify(state);
          for (const client of wss.clients) {
            if (client.readyState === WebSocket.OPEN) {
              client.send(payload);
            }
          }
        }, 1000 / 60);
      }
    }
  ],
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
