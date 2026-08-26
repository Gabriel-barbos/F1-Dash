import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import { TelemetryStore } from '../state/telemetry-store.js';
import { UdpReceiver } from '../udp/receiver.js';

export class TelemetryWebServer {
  private server: http.Server;
  private wss: WebSocketServer;
  private port: number;
  private publicDir: string;
  private broadcastTimer: NodeJS.Timeout | null = null;
  private wsStatsTimer: NodeJS.Timeout | null = null;

  private wsMessagesInCurrentSecond = 0;
  private wsMessagesPerSecond = 0;

  constructor(port = 3000) {
    this.port = port;
    this.publicDir = path.resolve(process.cwd(), 'public');

    this.server = http.createServer((req, res) => {
      this.handleHttpRequest(req, res);
    });

    this.wss = new WebSocketServer({ server: this.server });

    this.wss.on('connection', (ws: WebSocket) => {
      ws.send(JSON.stringify({ type: 'connected', timestamp: Date.now() }));
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        resolve();
      });
    });
  }

  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.broadcastTimer) {
        clearInterval(this.broadcastTimer);
        this.broadcastTimer = null;
      }
      if (this.wsStatsTimer) {
        clearInterval(this.wsStatsTimer);
        this.wsStatsTimer = null;
      }
      this.wss.close(() => {
        this.server.close(() => resolve());
      });
    });
  }

  /**
   * Inicia o broadcaster de snapshots a 30 Hz desacoplado da recepção UDP.
   */
  public startSnapshotBroadcaster(store: TelemetryStore, receiver: UdpReceiver, targetFps = 30): void {
    const intervalMs = Math.round(1000 / targetFps); // ~33ms para 30 Hz

    // Medição de mensagens WebSocket transmitidas por segundo
    this.wsStatsTimer = setInterval(() => {
      this.wsMessagesPerSecond = this.wsMessagesInCurrentSecond;
      this.wsMessagesInCurrentSecond = 0;
    }, 1000);

    this.broadcastTimer = setInterval(() => {
      if (this.wss.clients.size === 0) return;

      const snapshot = store.getSnapshot();
      const receiverStats = receiver.getStats();

      const message = JSON.stringify({
        type: 'snapshot',
        telemetry: snapshot,
        debug: {
          udpPacketsPerSecond: receiverStats.packetsPerSecond,
          wsMessagesPerSecond: this.wsMessagesPerSecond,
          totalPackets: receiverStats.totalPackets
        }
      });

      for (const client of this.wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
          this.wsMessagesInCurrentSecond++;
        }
      }
    }, intervalMs);
  }

  private handleHttpRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const reqUrl = req.url === '/' ? '/index.html' : (req.url ?? '/index.html');
    const filePath = path.join(this.publicDir, reqUrl);

    const ext = path.extname(filePath);
    const mimeTypes: Record<string, string> = {
      '.html': 'text/html; charset=utf-8',
      '.js': 'application/javascript; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.json': 'application/json',
      '.png': 'image/png',
      '.svg': 'image/svg+xml'
    };

    const contentType = mimeTypes[ext] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end('404 Não Encontrado');
        } else {
          res.writeHead(500);
          res.end(`Erro no servidor: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  }
}
