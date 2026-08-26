import { ParserRegistry } from '../core/parser/parser-registry';
import { TelemetryStore } from '../core/state/telemetry-store';

export class NativeUdpReceiver {
  private socket: any = null;
  private port: number;
  private isListening: boolean = false;
  private store: TelemetryStore;

  constructor(port: number = 20777) {
    this.port = port;
    this.store = TelemetryStore.getInstance();
  }

  /**
   * Inicia a escuta de pacotes UDP diretamente na placa de rede do celular.
   * Utiliza 'react-native-udp' quando executado em build nativo (Expo Dev Client / APK).
   */
  public async start(): Promise<boolean> {
    if (this.isListening) return true;

    try {
      // Import dinâmico para não quebrar a execução se estiver rodando no Expo Go padrão
      // @ts-ignore
      const dgram = require('react-native-udp');
      
      this.socket = dgram.createSocket({ type: 'udp4' });

      this.socket.on('message', (msg: Uint8Array | ArrayBuffer | string, rinfo: any) => {
        try {
          // Converte mensagem recebida para Uint8Array caso venha em formato diferente
          let buffer: Uint8Array;
          if (typeof msg === 'string') {
            // Em alguns bindings de socket nativo, a string pode ser binária
            const len = msg.length;
            buffer = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
              buffer[i] = msg.charCodeAt(i) & 0xff;
            }
          } else if (msg instanceof ArrayBuffer) {
            buffer = new Uint8Array(msg);
          } else {
            buffer = msg;
          }

          const parsed = ParserRegistry.parse(buffer);
          if (parsed) {
            this.store.processPacket(parsed);
          }
        } catch (err) {
          console.warn('[UDP Message Error]', err);
        }
      });

      this.socket.on('error', (err: any) => {
        console.warn('[UDP Socket Error]', err);
      });

      this.socket.bind(this.port, '0.0.0.0', () => {
        this.isListening = true;
        console.log([Native UDP] Escutando porta  no dispositivo Android);
      });

      return true;
    } catch (err) {
      console.warn('[Native UDP] Módulo react-native-udp não encontrado (esperado se estiver no Expo Go sem Dev Build):', err);
      return false;
    }
  }

  public stop(): void {
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.isListening = false;
  }

  public isActive(): boolean {
    return this.isListening;
  }
}

export const nativeUdpReceiver = new NativeUdpReceiver(20777);
