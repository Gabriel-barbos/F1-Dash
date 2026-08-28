import Constants, { ExecutionEnvironment } from 'expo-constants';
import { ParserRegistry } from '../core/parser/parser-registry';
import { TelemetryStore } from '../core/state/telemetry-store';

export const isRunningInExpoGo = (): boolean => {
  return (
    Constants.executionEnvironment === ExecutionEnvironment.StoreClient ||
    Constants.appOwnership === 'expo'
  );
};

export class NativeUdpReceiver {
  private socket: any = null;
  private subscription: any = null;
  private port: number;
  private isListening: boolean = false;
  private store: TelemetryStore;

  constructor(port: number = 20777) {
    this.port = port;
    this.store = TelemetryStore.getInstance();
  }

  public async start(): Promise<boolean> {
    if (this.isListening) return true;

    // Se estiver rodando no Expo Go, módulos C++/Java nativos de terceiros não estão
    // compilados no sandbox da Play Store. Evitamos chamar o require para não disparar erro nativo.
    if (isRunningInExpoGo()) {
      console.log('[Native UDP] Expo Go detectado: sockets UDP nativos requerem APK compilado.');
      return false;
    }

    // 1. Tenta usar @isvend/expo-udp (Módulo nativo oficial do ecossistema Expo no APK)
    try {
      // @ts-ignore
      const expoUdp = require('@isvend/expo-udp');
      if (expoUdp && typeof expoUdp.createSocket === 'function') {
        this.socket = await expoUdp.createSocket({
          type: 'udp4',
          reuseAddress: true,
          reusePort: true
        });

        this.subscription = this.socket.addListener('message', (event: any) => {
          try {
            if (!event || !event.data) return;
            const buffer =
              event.data instanceof Uint8Array ? event.data : new Uint8Array(event.data);
            const parsed = ParserRegistry.parse(buffer);
            if (parsed) {
              this.store.processPacket(parsed);
            }
          } catch (err) {
            console.warn('[Expo UDP Parse Error]', err);
          }
        });

        try {
          await this.socket.setBroadcast(true);
        } catch {}

        await this.socket.bind({ port: this.port, address: '0.0.0.0' });
        this.isListening = true;
        console.log(`[Native UDP] Escutando porta ${this.port} diretamente no APK compilado`);
        return true;
      }
    } catch (errExpo) {
      console.log('[Native UDP] expo-udp não disponível, tentando fallback react-native-udp:', errExpo);
    }

    // 2. Fallback para react-native-udp
    try {
      // @ts-ignore
      const dgram = require('react-native-udp');
      if (dgram && typeof dgram.createSocket === 'function') {
        this.socket = dgram.createSocket({ type: 'udp4' });

        this.socket.on('message', (msg: any) => {
          try {
            let buffer: Uint8Array;
            if (typeof msg === 'string') {
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

        this.socket.bind(this.port, '0.0.0.0', () => {
          this.isListening = true;
          console.log(`[Native UDP] Escutando porta ${this.port} no dispositivo`);
        });

        return true;
      }
    } catch (err) {
      console.warn('[Native UDP] Módulo UDP nativo não disponível:', err);
    }

    return false;
  }

  public stop(): void {
    if (this.subscription) {
      try {
        this.subscription.remove();
      } catch {}
      this.subscription = null;
    }
    if (this.socket) {
      try {
        if (typeof this.socket.close === 'function') {
          this.socket.close();
        }
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