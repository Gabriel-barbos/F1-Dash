import { ParserRegistry } from '../parser/parser-registry';
import { TelemetryStore } from '../state/telemetry-store';

export interface NetworkReceiverConfig {
  port: number;
  host?: string;
  wsFallbackUrl?: string;
}

export class TelemetryNetworkReceiver {
  private config: NetworkReceiverConfig;
  private isListening = false;
  private udpSocket: any = null;
  private wsSocket: WebSocket | null = null;
  private store: TelemetryStore;

  constructor(config: Partial<NetworkReceiverConfig> = {}) {
    this.config = {
      port: config.port || 20777,
      host: config.host || '0.0.0.0',
      wsFallbackUrl: config.wsFallbackUrl || 'ws://127.0.0.1:8080/raw'
    };
    this.store = TelemetryStore.getInstance();
  }

  /**
   * Inicia a escuta de pacotes UDP.
   * Tenta carregar o módulo nativo de UDP (react-native-udp / dgram) ou faz fallback para WebSocket.
   */
  public async start(): Promise<void> {
    if (this.isListening) return;

    try {
      // 1. Tentar carregar react-native-udp nativo se disponível
      let dgramModule: any = null;
      try {
        dgramModule = require('react-native-udp');
      } catch {
        try {
          dgramModule = require('react-native-quick-udp');
        } catch {
          try {
            dgramModule = require('node:dgram');
          } catch {
            // Ambiente sem suporte dgram síncrono nativo (ex: Web browser puro)
          }
        }
      }

      if (dgramModule && (dgramModule.createSocket || dgramModule.default?.createSocket)) {
        const createSocket = dgramModule.createSocket || dgramModule.default.createSocket;
        this.udpSocket = createSocket({ type: 'udp4', reuseAddr: true });

        this.udpSocket.on('message', (msg: any) => {
          this.handleRawPacket(msg);
        });

        this.udpSocket.on('error', (err: any) => {
          console.warn('[UDP Receiver] Erro no socket UDP:', err);
        });

        this.udpSocket.bind(this.config.port, this.config.host, () => {
          this.isListening = true;
          console.log(`[UDP Receiver] Escutando porta UDP ${this.config.port}`);
        });
      } else {
        // Fallback para WebSocket de desenvolvimento se não houver UDP nativo
        this.startWebSocketFallback();
      }
    } catch (err) {
      console.warn('[UDP Receiver] Falha ao iniciar UDP nativo, usando WebSocket fallback:', err);
      this.startWebSocketFallback();
    }
  }

  /**
   * Processa buffer bruto de qualquer fonte (UDP, WebSocket ou Simulador Mock).
   */
  public handleRawPacket(buffer: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): void {
    const parsed = ParserRegistry.parse(buffer);
    if (parsed) {
      this.store.processPacket(parsed);
    }
  }

  private startWebSocketFallback(): void {
    if (typeof WebSocket === 'undefined') return;

    try {
      if (!this.config.wsFallbackUrl) return;
      this.wsSocket = new WebSocket(this.config.wsFallbackUrl);
      this.wsSocket.binaryType = 'arraybuffer';

      this.wsSocket.onopen = () => {
        console.log(`[WS Fallback] Conectado ao relay de telemetria: ${this.config.wsFallbackUrl}`);
        this.isListening = true;
      };

      this.wsSocket.onmessage = (event: MessageEvent) => {
        if (event.data instanceof ArrayBuffer) {
          this.handleRawPacket(new Uint8Array(event.data));
        }
      };

      this.wsSocket.onerror = () => {
        // Silencioso em caso de ausência de relay
      };

      this.wsSocket.onclose = () => {
        this.isListening = false;
      };
    } catch {
      // Ignora erro em modo offline
    }
  }

  public stop(): void {
    if (this.udpSocket) {
      try {
        this.udpSocket.close();
      } catch {}
      this.udpSocket = null;
    }
    if (this.wsSocket) {
      try {
        this.wsSocket.close();
      } catch {}
      this.wsSocket = null;
    }
    this.isListening = false;
  }
}
