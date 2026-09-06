import dgram, { Socket, RemoteInfo } from 'node:dgram';
import { EventEmitter } from 'node:events';
import { ReceiverConfig, ReceiverStats } from './types.js';
import { ParserRegistry, ParsedPacket, PacketId } from '../../packages/telemetry-core/src/index.js';

export class UdpReceiver extends EventEmitter {
  private socket: Socket | null = null;
  private config: ReceiverConfig;
  private stats: ReceiverStats = {
    totalPackets: 0,
    totalBytes: 0,
    packetsPerSecond: 0,
    bytesPerSecond: 0,
    packetCountByType: {},
    lastPacketTime: null,
    remoteInfo: null
  };

  private packetsInCurrentSecond = 0;
  private bytesInCurrentSecond = 0;
  private statsTimer: NodeJS.Timeout | null = null;

  constructor(config: Partial<ReceiverConfig> = {}) {
    super();
    this.config = {
      port: config.port ?? 20777,
      host: config.host ?? '0.0.0.0'
    };
  }

  /**
   * Inicia a escuta do socket UDP.
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

        this.socket.on('error', (err) => {
          this.emit('error', err);
        });

        this.socket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
          this.handleMessage(msg, rinfo);
        });

        this.socket.on('listening', () => {
          const address = this.socket?.address();
          if (address && typeof address === 'object') {
            this.startStatsTimer();
            this.emit('listening', address.address, address.port);
            resolve();
          }
        });

        this.socket.bind(this.config.port, this.config.host);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Encerra o socket UDP e timers.
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.statsTimer) {
        clearInterval(this.statsTimer);
        this.statsTimer = null;
      }

      if (this.socket) {
        this.socket.close(() => {
          this.socket = null;
          this.emit('closed');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Retorna as estatísticas atuais de tráfego.
   */
  public getStats(): ReceiverStats {
    return { ...this.stats };
  }

  private handleMessage(msg: Buffer, rinfo: RemoteInfo): void {
    const byteLength = msg.length;
    this.stats.totalPackets += 1;
    this.stats.totalBytes += byteLength;
    this.stats.lastPacketTime = new Date();
    this.stats.remoteInfo = rinfo;

    this.packetsInCurrentSecond += 1;
    this.bytesInCurrentSecond += byteLength;

    this.emit('raw', msg, rinfo);

    const uint8 = new Uint8Array(msg.buffer, msg.byteOffset, msg.byteLength);
    const parsed = ParserRegistry.parse(uint8);
    if (parsed) {
      const type = parsed.type;
      this.stats.packetCountByType[type] = (this.stats.packetCountByType[type] ?? 0) + 1;
      this.emit('packet', parsed, msg, rinfo);
    }
  }

  private startStatsTimer(): void {
    this.statsTimer = setInterval(() => {
      this.stats.packetsPerSecond = this.packetsInCurrentSecond;
      this.stats.bytesPerSecond = this.bytesInCurrentSecond;
      this.packetsInCurrentSecond = 0;
      this.bytesInCurrentSecond = 0;
      this.emit('stats', this.getStats());
    }, 1000);
  }
}
