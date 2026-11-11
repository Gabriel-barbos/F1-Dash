import { ParserRegistry, TelemetryStore } from '@f1-dash/telemetry-core';

/**
 * Detecta se algum módulo nativo de UDP está compilado no ambiente atual.
 * No Expo Go (sandbox da loja), os módulos nativos não existem e o require dispara erro capturado no try/catch.
 * No APK compilado para Android, @isvend/expo-udp ou react-native-udp carrega com sucesso.
 */
export const isNativeUdpSupported = (): boolean => {
  try {
    // @ts-ignore
    const expoUdp = require('@isvend/expo-udp');
    if (expoUdp && typeof expoUdp.createSocket === 'function') return true;
  } catch {}
  try {
    // @ts-ignore
    const dgram = require('react-native-udp');
    if (dgram && typeof dgram.createSocket === 'function') return true;
  } catch {}
  return false;
};

export const isRunningInExpoGo = (): boolean => {
  return !isNativeUdpSupported();
};

// Packet IDs que o Cockpit Display efetivamente exibe na tela.
// Todos os outros (Motion, MotionEx, Participants, CarSetups, SessionHistory,
// TyreSets, FinalClassification, LobbyInfo, TimeTrial, LapPositions) são
// descartados ANTES de parsear para não sobrecarregar o Hermes do celular.
// No PC esses pacotes continuam sendo processados normalmente pelo core.
const COCKPIT_PACKET_IDS = new Set([
  1,   // Session       — clima, safety car, bandeiras
  2,   // LapData       — tempos, posições, setores
  3,   // Event         — largada, ultrapassagens, bandeirada
  6,   // CarTelemetry  — velocidade, RPM, marcha, pedais, temps pneus
  7,   // CarStatus     — ERS, combustível, DRS, compostos, FIA flags
  10,  // CarDamage     — danos em asas, motor, assoalho
  16,  // CarTelemetry2 — Active Aero 2026, Overtake
]);

/**
 * Lê o byte no offset 6 do buffer bruto (PacketId) sem alocar objetos.
 * Retorna -1 se o buffer for muito pequeno.
 */
function peekPacketIdRaw(data: ArrayLike<number>): number {
  if (!data || data.length < 7) return -1;
  return data[6];
}

export class NativeUdpReceiver {
  private socket: any = null;
  private subscription: any = null;
  private port: number;
  private isListening: boolean = false;
  private store: TelemetryStore;
  private hasReceivedFirstPacket: boolean = false;

  constructor(port: number = 20777) {
    this.port = port;
    this.store = TelemetryStore.getInstance();
  }

  public async start(): Promise<boolean> {
    if (this.isListening) return true;

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

            // Filtro rápido por Packet ID ANTES de alocar Uint8Array:
            // descarta Motion/Participants sem copiar 1400 bytes no JS
            const packetId = peekPacketIdRaw(event.data);
            if (!COCKPIT_PACKET_IDS.has(packetId)) return;

            const buffer =
              event.data instanceof Uint8Array ? event.data : new Uint8Array(event.data);

            // Decodifica diretamente sem perder nenhum pacote legítimo
            const parsed = ParserRegistry.parse(buffer, { playerOnly: true });
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
              if (msg.length < 7 || !COCKPIT_PACKET_IDS.has(msg.charCodeAt(6) & 0xff)) return;
              const len = msg.length;
              buffer = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                buffer[i] = msg.charCodeAt(i) & 0xff;
              }
            } else if (msg instanceof ArrayBuffer) {
              buffer = new Uint8Array(msg);
              if (!COCKPIT_PACKET_IDS.has(peekPacketIdRaw(buffer))) return;
            } else {
              if (!COCKPIT_PACKET_IDS.has(peekPacketIdRaw(msg))) return;
              buffer = msg;
            }

            const parsed = ParserRegistry.parse(buffer, { playerOnly: true });
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
