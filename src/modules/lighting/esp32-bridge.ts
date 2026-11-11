import dgram, { Socket } from 'node:dgram';
import { CockpitTelemetryState } from '@f1-dash/telemetry-core';
import {
  Esp32RaceStatePayload,
  Esp32BridgeConfig,
  Esp32Status
} from './types.js';
import { LightingStateBuilder, lightingStateBuilder } from './lighting-state-builder.js';

export class Esp32LightingBridge {
  private socket: Socket | null = null;
  private config: Esp32BridgeConfig;
  private builder: LightingStateBuilder;
  private status: Esp32Status;
  private lastSentHash: string = '';
  private lastHeartbeatTime: number = 0;

  constructor(config?: Partial<Esp32BridgeConfig>) {
    this.config = {
      ipAddress: config?.ipAddress ?? '192.168.1.103',
      port: config?.port ?? 4210,
      transport: config?.transport ?? 'UDP',
      wledPresetMapping: config?.wledPresetMapping ?? {
        dayPreset: 1,
        nightPreset: 2,
        rainPreset: 3,
        overtakePreset: 4,
        speedStraightPreset: 5,
        pitPreset: 6,
        yellowFlagPreset: 7,
        redFlagPreset: 8,
        crashPreset: 9,
        chequeredPreset: 10
      }
    };

    this.builder = lightingStateBuilder;

    this.status = {
      connected: false,
      ipAddress: this.config.ipAddress,
      port: this.config.port,
      transport: this.config.transport,
      lastStateSent: null,
      packetsSent: 0,
      lastSendTimestamp: 0
    };
  }

  /**
   * Conecta ao ESP32 / WLED na rede local.
   */
  public async connect(ip?: string, port?: number): Promise<boolean> {
    if (ip) this.config.ipAddress = ip;
    if (port) this.config.port = port;

    try {
      if (this.config.transport === 'UDP' && !this.socket) {
        this.socket = dgram.createSocket('udp4');
      }

      this.status.connected = true;
      this.status.ipAddress = this.config.ipAddress;
      this.status.port = this.config.port;

      console.log(`\x1b[32m✔ [ESP32 Lighting Bridge] Conectado via ${this.config.transport} (${this.config.ipAddress}:${this.config.port})\x1b[0m`);
      return true;
    } catch (err) {
      console.warn('[ESP32 Lighting Bridge] Erro ao conectar:', err);
      this.status.connected = false;
      return false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        this.socket.close();
      } catch {}
      this.socket = null;
    }
    this.status.connected = false;
  }

  /**
   * Atualiza a iluminação a partir do estado de telemetria.
   * Transmite para o ESP32 de forma inteligente:
   * 1. Apenas quando o estado visual muda (ex: ativou DRS, bandeira amarela, chuva, crash)
   * 2. Ou em heartbeat suave de 5 Hz (a cada 200ms) para manter o ESP32 em sincronia sem saturar o Wi-Fi.
   */
  public updateTelemetry(telemetry: CockpitTelemetryState): void {
    const payload = this.builder.buildState(telemetry);
    this.dispatchState(payload);
  }

  /**
   * Envia o estado de corrida diretamente para o ESP32 / WLED.
   */
  public dispatchState(payload: Esp32RaceStatePayload): void {
    if (!this.status.connected) return;

    const now = Date.now();
    // Chave de comparação rápida para detectar mudança de evento
    const currentHash = `${payload.ambient}_${payload.weather}_${payload.trackStatus}_${payload.overtake}_${payload.activeAero}_${payload.pitLimiter}_${payload.isCrash}_${payload.chequeredFlag}_${payload.shiftFlash}`;

    const isStateChanged = currentHash !== this.lastSentHash;
    const isHeartbeatDue = now - this.lastHeartbeatTime >= 200; // 5 Hz

    if (!isStateChanged && !isHeartbeatDue) {
      return;
    }

    this.lastSentHash = currentHash;
    this.lastHeartbeatTime = now;
    this.status.lastStateSent = payload;

    if (this.config.transport === 'UDP') {
      this.sendUdpJson(payload);
    } else if (this.config.transport === 'WLED_HTTP') {
      this.sendWledHttp(payload);
    }
  }

  private sendUdpJson(payload: Esp32RaceStatePayload): void {
    if (!this.socket) return;

    const jsonString = JSON.stringify(payload);
    const buffer = Buffer.from(jsonString);

    this.socket.send(
      buffer,
      0,
      buffer.length,
      this.config.port,
      this.config.ipAddress,
      (err) => {
        if (!err) {
          this.status.packetsSent++;
          this.status.lastSendTimestamp = Date.now();
        }
      }
    );
  }

  /**
   * Integração direta com a API do WLED (/json/state) acionando Presets dedicados configurados no ESP32.
   */
  private async sendWledHttp(payload: Esp32RaceStatePayload): Promise<void> {
    const presets = this.config.wledPresetMapping;
    if (!presets) return;

    let targetPreset: number | undefined;

    if (payload.isCrash) targetPreset = presets.crashPreset;
    else if (payload.trackStatus === 'RED') targetPreset = presets.redFlagPreset;
    else if (payload.trackStatus === 'YELLOW' || payload.trackStatus === 'SAFETY_CAR') targetPreset = presets.yellowFlagPreset;
    else if (payload.pitLimiter || payload.inPits) targetPreset = presets.pitPreset;
    else if (payload.overtake) targetPreset = presets.overtakePreset;
    else if (payload.activeAero === 'X_MODE_STRAIGHT') targetPreset = presets.speedStraightPreset;
    else if (payload.weather === 'RAIN' || payload.weather === 'STORM') targetPreset = presets.rainPreset;
    else if (payload.ambient === 'NIGHT') targetPreset = presets.nightPreset;
    else targetPreset = presets.dayPreset;

    if (targetPreset === undefined) return;

    try {
      await fetch(`http://${this.config.ipAddress}/json/state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ps: targetPreset })
      });
      this.status.packetsSent++;
      this.status.lastSendTimestamp = Date.now();
    } catch (err) {
      // Silencia timeouts de HTTP ocasionais
    }
  }

  public getStatus(): Esp32Status {
    return { ...this.status };
  }
}

export const esp32LightingBridge = new Esp32LightingBridge();
