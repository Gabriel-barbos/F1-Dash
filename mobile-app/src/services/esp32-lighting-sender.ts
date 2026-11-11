import {
  CockpitTelemetryState,
  SafetyCarStatus,
  PitStatus,
  Weather
} from '@f1-dash/telemetry-core';

export type AmbientLightingMode = 'DAY' | 'NIGHT' | 'WAITING';
export type WeatherLightingMode = 'CLEAR' | 'CLOUDY' | 'RAIN' | 'STORM';
export type TrackStatusLightingMode = 'CLEAR' | 'GREEN' | 'YELLOW' | 'RED' | 'SAFETY_CAR' | 'VSC' | 'CHEQUERED';
export type ActiveAeroLightingMode = 'OFF' | 'Z_MODE_CORNER' | 'X_MODE_STRAIGHT';

export interface Esp32RaceStatePayload {
  ambient: AmbientLightingMode;
  waiting: boolean;
  weather: WeatherLightingMode;
  trackTempCelsius: number;
  trackStatus: TrackStatusLightingMode;
  chequeredFlag: boolean;
  overtake: boolean;
  activeAero: ActiveAeroLightingMode;
  drsActive: boolean;
  drsAllowed: boolean;
  pitLimiter: boolean;
  inPits: boolean;
  isCrash: boolean;
  engineBlown: boolean;
  rpmPercent: number;
  revLightsPercent: number;
  shiftFlash: boolean;
  timestamp: number;
}

const DEFAULT_ESP32_IP = '192.168.1.103';
const DEFAULT_ESP32_UDP_PORT = 4210;

class Esp32LightingSender {
  private esp32Ip: string = DEFAULT_ESP32_IP;
  private esp32Port: number = DEFAULT_ESP32_UDP_PORT;
  private expoSocket: any = null;
  private rnSocket: any = null;
  private initializingSocket: boolean = false;

  private prevSpeed: number = 0;
  private prevDamageSum: number = 0;
  private isCrashActive: boolean = false;
  private crashTimer: number = 0;

  // Latch inteligente para zona de Modo Reta (Active Aero 2026 / DRS 2025)
  private prevAeroDistance: number = 0;
  private prevAeroMode: number = 0;
  private isStraightLatched: boolean = false;
  private straightLatchExpiry: number = 0;

  // Histerese Dia/Noite e detecção de Waiting (Loading / Lobby)
  private latchedDayNight: 'DAY' | 'NIGHT' = 'DAY';
  private lastDrivingActivityMs: number = 0;
  private lastTelemetryReceivedMs: number = 0;
  private latestPayload: Esp32RaceStatePayload | null = null;
  private heartbeatInterval: any = null;

  private lastPriorityHash: string = '';
  private lastUdpSendTime: number = 0;

  public packetsSentCount: number = 0;
  public lastError: string | null = null;
  public lastSuccessTime: number = 0;

  constructor() {
    this.initUdpSockets();
    this.startContinuousHeartbeat();
  }

  public setTargetIp(ip: string, port: number = DEFAULT_ESP32_UDP_PORT) {
    const cleanIp = ip.trim().split(':')[0];
    if (cleanIp) {
      this.esp32Ip = cleanIp;
    }
    this.esp32Port = port;
  }

  public getTargetIp(): string {
    return this.esp32Ip;
  }

  public getTargetPort(): number {
    return this.esp32Port;
  }

  /**
   * Mantém o ESP32 sincronizado mesmo durante telas de Loading do PS5
   * (onde o console pausa o envio de pacotes por alguns segundos enquanto carrega a pista).
   */
  private startContinuousHeartbeat() {
    if (this.heartbeatInterval) return;
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      // Enquanto a sessão do jogo esteve ativa nos últimos 15 segundos, mantém o heartbeat vivo
      if (this.latestPayload && now - this.lastTelemetryReceivedMs < 15000) {
        // Se o console pausou pacotes por >5s (ex: tela de loading longa), força estado WAITING estável
        if (now - this.lastTelemetryReceivedMs > 5000 && !this.latestPayload.waiting) {
          this.latestPayload = {
            ...this.latestPayload,
            ambient: 'WAITING',
            waiting: true,
            activeAero: 'OFF',
            overtake: false,
            drsActive: false,
            shiftFlash: false,
            timestamp: now
          };
        } else {
          this.latestPayload.timestamp = now;
        }
        this.dispatch(this.latestPayload);
      }
    }, 150);
  }

  private async initUdpSockets() {
    if ((this.expoSocket || this.rnSocket) || this.initializingSocket) return;
    this.initializingSocket = true;

    // 1. Inicializa react-native-udp (dgram) — canal nativo independente da recepção 20777
    try {
      // @ts-ignore
      const dgram = require('react-native-udp');
      if (dgram && typeof dgram.createSocket === 'function') {
        const sock = dgram.createSocket({ type: 'udp4' });
        try {
          sock.bind(0, '0.0.0.0');
        } catch {}
        this.rnSocket = sock;
        console.log('[ESP32 Sender] Socket UDP Dgram independente inicializado.');
      }
    } catch {}

    // 2. Inicializa @isvend/expo-udp com envio IO fire-and-forget
    try {
      // @ts-ignore
      const expoUdp = require('@isvend/expo-udp');
      if (expoUdp && typeof expoUdp.createSocket === 'function') {
        const sock = await expoUdp.createSocket({
          type: 'udp4',
          reuseAddress: true,
          reusePort: true
        });
        this.expoSocket = sock;
        console.log('[ESP32 Sender] Socket UDP Expo inicializado.');
      }
    } catch {}

    this.initializingSocket = false;
  }

  public buildState(telemetry: CockpitTelemetryState): Esp32RaceStatePayload {
    const now = Date.now();
    const speed = telemetry.speed ?? 0;
    const rpm = telemetry.engineRPM ?? 0;

    // Detecta atividade real do motor/carro na pista vs Loading / Lobby / Box parado
    if (rpm > 500 || speed > 1) {
      this.lastDrivingActivityMs = now;
    }
    const isWaiting = (now - this.lastDrivingActivityMs) > 6000;

    // 1. Clima
    let weather: WeatherLightingMode = 'CLEAR';
    const rawWeather = telemetry.weather;
    if (rawWeather === Weather.LightRain || rawWeather === Weather.HeavyRain) {
      weather = 'RAIN';
    } else if (rawWeather === Weather.Storm) {
      weather = 'STORM';
    } else if (rawWeather === Weather.Overcast || rawWeather === Weather.LightCloud) {
      weather = 'CLOUDY';
    }

    // 2. Ambiente com Histerese (Impede oscilação Dia/Noite durante loading ou temp limítrofe)
    const rawTrackTemp = telemetry.trackTemperature ?? 0;
    if (rawTrackTemp > 0) {
      if (this.latchedDayNight === 'DAY' && rawTrackTemp <= 23) {
        this.latchedDayNight = 'NIGHT';
      } else if (this.latchedDayNight === 'NIGHT' && rawTrackTemp >= 26) {
        this.latchedDayNight = 'DAY';
      }
    }
    const ambient: AmbientLightingMode = isWaiting ? 'WAITING' : this.latchedDayNight;

    // 3. Estado da Pista e Bandeiras
    let trackStatus: TrackStatusLightingMode = 'CLEAR';
    if (telemetry.isRedFlagActive || telemetry.vehicleFiaFlags === 4) {
      trackStatus = 'RED';
    } else if (telemetry.safetyCarStatus === SafetyCarStatus.Full) {
      trackStatus = 'SAFETY_CAR';
    } else if (telemetry.safetyCarStatus === SafetyCarStatus.Virtual) {
      trackStatus = 'VSC';
    } else if (telemetry.vehicleFiaFlags === 3) {
      trackStatus = 'YELLOW';
    } else if (telemetry.vehicleFiaFlags === 1) {
      trackStatus = 'GREEN';
    }

    // 4. Detecção de Batida Violenta (Crash) — apenas quando em condução ativa
    const currentDamageSum =
      (telemetry.frontLeftWingDamage ?? 0) +
      (telemetry.frontRightWingDamage ?? 0) +
      (telemetry.rearWingDamage ?? 0) +
      (telemetry.floorDamage ?? 0);

    const damageDelta = currentDamageSum - this.prevDamageSum;
    const isSuddenDecel = !isWaiting && this.prevSpeed >= 65 && speed <= 12 && (telemetry.brake ?? 0) < 0.85;

    if (!isWaiting && (damageDelta >= 5 || isSuddenDecel || telemetry.engineBlown)) {
      this.isCrashActive = true;
      this.crashTimer = now + 3500;
    } else if (now > this.crashTimer || isWaiting) {
      this.isCrashActive = false;
    }

    this.prevSpeed = speed;
    this.prevDamageSum = currentDamageSum;

    // 5. Modo Reta (Active Aero 2026 / DRS 2025):
    // Aciona no exato instante em que entra na zona de Modo Reta (distância == 0m vindo de aproximação) ou quando a asa abre (activeAeroMode === 1 / drsActive)
    const currentAeroDist = telemetry.activeAeroActivationDistance ?? 0;
    const currentAeroMode = telemetry.activeAeroMode ?? 0;

    if (!isWaiting) {
      if (currentAeroMode === 1 || telemetry.drsActive) {
        this.isStraightLatched = true;
        this.straightLatchExpiry = now + 12000;
      } else if (this.prevAeroDistance > 0 && currentAeroDist === 0) {
        // Borda de entrada na zona de reta pela contagem regressiva zerada
        this.isStraightLatched = true;
        this.straightLatchExpiry = now + 9000;
      } else if (
        currentAeroMode === 2 || // Entrou em modo curva (Z-Mode)
        (this.prevAeroMode === 1 && currentAeroMode === 0) || // Asa acabou de fechar no ponto de frenagem
        now > this.straightLatchExpiry
      ) {
        this.isStraightLatched = false;
      }
    } else {
      this.isStraightLatched = false;
    }

    this.prevAeroDistance = currentAeroDist;
    this.prevAeroMode = currentAeroMode;

    let activeAero: ActiveAeroLightingMode = 'OFF';
    if (!isWaiting) {
      if (
        this.isStraightLatched ||
        currentAeroMode === 1 ||
        telemetry.drsActive ||
        (Boolean(telemetry.activeAeroAvailable) && currentAeroDist === 0)
      ) {
        activeAero = 'X_MODE_STRAIGHT';
      } else if (currentAeroMode === 2) {
        activeAero = 'Z_MODE_CORNER';
      }
    }

    // 6. Modo Overtake (Apenas quando a < 1s do carro da frente no Regulamento 2026 com Overtake habilitado/ativo; NUNCA pelo botão normal de ERS):
    const overtake =
      !isWaiting &&
      Boolean(
        telemetry.overtakeActive ||
        (telemetry.overtakeAvailable && (telemetry.overtakeActivationDistance ?? 0) === 0)
      );

    // 7. Boxes
    const inPits =
      !isWaiting &&
      (telemetry.pitStatus === PitStatus.Pitting ||
       telemetry.pitStatus === PitStatus.InPitArea);
    const pitLimiter = !isWaiting && !!telemetry.pitLimiterActive;

    // 8. RPM & Shift Lights
    const maxRpm = telemetry.maxRPM || 13500;
    const rpmPercent = Math.min(100, Math.max(0, (rpm / maxRpm) * 100));
    const revPercent = Math.max(rpmPercent, telemetry.revLightsPercent ?? 0);
    const shiftFlash = !isWaiting && revPercent >= 96;

    return {
      ambient,
      waiting: isWaiting,
      weather,
      trackTempCelsius: rawTrackTemp > 0 ? rawTrackTemp : 30,
      trackStatus,
      chequeredFlag: !isWaiting && !!(telemetry.totalLaps > 0 && telemetry.currentLapNum > telemetry.totalLaps),
      overtake,
      activeAero,
      drsActive: !isWaiting && (activeAero === 'X_MODE_STRAIGHT' || !!telemetry.drsActive),
      drsAllowed: !isWaiting && !!telemetry.drsAllowed,
      pitLimiter,
      inPits,
      isCrash: this.isCrashActive,
      engineBlown: !isWaiting && !!telemetry.engineBlown,
      rpmPercent: Math.round(rpmPercent),
      revLightsPercent: Math.round(revPercent),
      shiftFlash,
      timestamp: now
    };
  }

  public updateFromTelemetry(telemetry: CockpitTelemetryState) {
    if (!telemetry.connected) return;

    this.lastTelemetryReceivedMs = Date.now();
    const payload = this.buildState(telemetry);
    this.latestPayload = payload;
    this.dispatch(payload);
  }

  public dispatch(payload: Esp32RaceStatePayload) {
    const now = Date.now();

    // Hash de eventos prioritários (NÃO inclui shiftFlash para não saturar a rede em retas de alto giro!)
    const priorityHash = `${payload.ambient}_${payload.waiting}_${payload.weather}_${payload.trackStatus}_${payload.overtake}_${payload.activeAero}_${payload.drsActive}_${payload.pitLimiter}_${payload.inPits}_${payload.isCrash}_${payload.engineBlown}_${payload.chequeredFlag}`;

    const isPriorityChanged = priorityHash !== this.lastPriorityHash;
    const isUdpHeartbeatDue = now - this.lastUdpSendTime >= 120; // ~8.3 Hz contínuo via UDP puro

    if (!isPriorityChanged && !isUdpHeartbeatDue) {
      return;
    }

    this.lastPriorityHash = priorityHash;
    this.lastUdpSendTime = now;

    const jsonStr = JSON.stringify(payload);

    if (isPriorityChanged) {
      // TRANSIÇÃO DE ESTADO CRÍTICA (ex: entrou na zona de Modo Reta ou habilitou Overtake <1s):
      // Usa SOMENTE rajada UDP pura (0ms, +10ms, +25ms, +45ms, +75ms) na porta 4210!
      // NÃO abre conexão TCP HTTP durante a corrida para jamais travar o loop single-thread do WebServer no ESP32!
      this.sendUdp(jsonStr, true);
      for (const delayMs of [10, 25, 45, 75]) {
        setTimeout(() => {
          if (this.latestPayload) {
            this.sendUdp(JSON.stringify(this.latestPayload), true);
          }
        }, delayMs);
      }
    } else {
      // Heartbeat regular via UDP puro
      this.sendUdp(jsonStr, false);
    }
  }

  private sendUdp(jsonStr: string, isPriority: boolean = false) {
    if (!this.expoSocket && !this.rnSocket) {
      this.initUdpSockets();
      return;
    }

    try {
      const bytes = new Uint8Array(jsonStr.length);
      for (let i = 0; i < jsonStr.length; i++) {
        bytes[i] = jsonStr.charCodeAt(i) & 0xff;
      }

      // Envio paralelo de altíssima confiabilidade: dispara via react-native-udp E expo-udp
      if (this.rnSocket) {
        try {
          this.rnSocket.send(bytes, 0, bytes.length, this.esp32Port, this.esp32Ip, (err: any) => {
            if (!err) {
              this.packetsSentCount++;
              this.lastSuccessTime = Date.now();
            }
          });
        } catch {}
      }

      if (this.expoSocket) {
        this.expoSocket
          .send(bytes, {
            host: this.esp32Ip,
            port: this.esp32Port,
            address: this.esp32Ip
          })
          .then(() => {
            this.packetsSentCount++;
            this.lastSuccessTime = Date.now();
          })
          .catch(() => {});
      }
    } catch (e: any) {
      this.lastError = `Send exception: ${e?.message || e}`;
    }
  }

  /**
   * Testa a conectividade com o ESP32 enviando um comando de teste (UDP + HTTP no menu)
   */
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    const testPayload: Esp32RaceStatePayload = {
      ambient: 'DAY',
      waiting: false,
      weather: 'CLEAR',
      trackTempCelsius: 32,
      trackStatus: 'CLEAR',
      chequeredFlag: false,
      overtake: false,
      activeAero: 'X_MODE_STRAIGHT', // Ativa animação roxa de teste
      drsActive: true,
      drsAllowed: true,
      pitLimiter: false,
      inPits: false,
      isCrash: false,
      engineBlown: false,
      rpmPercent: 96,
      revLightsPercent: 96,
      shiftFlash: true,
      timestamp: Date.now()
    };

    const jsonStr = JSON.stringify(testPayload);

    // Envia rajada UDP imediata
    this.sendUdp(jsonStr, true);
    setTimeout(() => this.sendUdp(jsonStr, true), 20);
    setTimeout(() => this.sendUdp(jsonStr, true), 50);

    // Testa HTTP apenas quando o botão de teste no menu é clicado
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;

      const res = await fetch(`http://${this.esp32Ip}/api/f1-state`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonStr,
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        this.packetsSentCount++;
        this.lastSuccessTime = Date.now();
        return { success: true, message: `Conectado ao ESP32 (${this.esp32Ip})! Efeito Modo Reta ativado nas fitas.` };
      } else {
        return { success: false, message: `ESP32 respondeu com status HTTP ${res.status}.` };
      }
    } catch (err: any) {
      if (Date.now() - this.lastSuccessTime < 2000) {
        return {
          success: true,
          message: `Comando enviado via UDP para ${this.esp32Ip}:${this.esp32Port}! Verifique se as fitas acenderam em roxo.`
        };
      }
      return {
        success: false,
        message: `Não foi possível conectar em http://${this.esp32Ip}: ${err?.message || 'Sem resposta'}. Verifique se o celular está na mesma rede do ESP32.`
      };
    }
  }
}

export const esp32LightingSender = new Esp32LightingSender();
