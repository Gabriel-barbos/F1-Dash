import * as FileSystem from 'expo-file-system/legacy';
import * as Network from 'expo-network';
import {
  CockpitTelemetryState,
  SafetyCarStatus,
  PitStatus,
  Weather
} from '@f1-dash/telemetry-core';
import {
  CACHE_HEALTH_TIMEOUT_MS,
  DiscoveryMethod,
  ESP32_UDP_PORT,
  discoverLightingDeviceWithDetails,
  isValidIpv4,
  probeJsonInfo
} from './esp32-discovery';

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
const DEFAULT_ESP32_UDP_PORT = ESP32_UDP_PORT;
const CACHE_STORAGE_KEY = 'f1_dash_esp32_lighting_cache';
const DISCOVERY_FAILURE_COOLDOWN_MS = 15000;

export type Esp32ConnectionStatus = 'IDLE' | 'DISCOVERING' | 'CONNECTED' | 'NOT_FOUND';

export interface Esp32DiscoveryStatus {
  status: Esp32ConnectionStatus;
  ip: string;
  port: number;
  method: DiscoveryMethod | null;
  message: string | null;
  lastAttemptTime: number;
}

class Esp32LightingSender {
  private esp32Ip: string = DEFAULT_ESP32_IP;
  private esp32Port: number = DEFAULT_ESP32_UDP_PORT;
  private cachedIp: string | null = null;
  private cacheLoaded: boolean = false;
  private discoveryPromise: Promise<string | null> | null = null;
  private lastDiscoveryFailureTime: number = 0;
  private statusListeners: Set<(status: Esp32DiscoveryStatus) => void> = new Set();
  private discoveryStatus: Esp32DiscoveryStatus = {
    status: 'IDLE',
    ip: DEFAULT_ESP32_IP,
    port: DEFAULT_ESP32_UDP_PORT,
    method: null,
    message: null,
    lastAttemptTime: 0
  };
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
    void this.bootstrapDiscovery();
  }

  private getCacheFileUri(): string | null {
    try {
      if (FileSystem.documentDirectory) {
        return `${FileSystem.documentDirectory}esp32-lighting-cache.json`;
      }
    } catch {}
    return null;
  }

  private async loadCachedIp(): Promise<string | null> {
    if (this.cacheLoaded) {
      return this.cachedIp;
    }

    try {
      const fileUri = this.getCacheFileUri();
      if (fileUri) {
        const info = await FileSystem.getInfoAsync(fileUri);
        if (info.exists) {
          const raw = await FileSystem.readAsStringAsync(fileUri);
          const parsed = JSON.parse(raw);
          if (isValidIpv4(parsed?.ip)) {
            this.cachedIp = parsed.ip.trim();
            if (typeof parsed?.port === 'number') {
              this.esp32Port = parsed.port;
            }
          }
        }
      } else if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(CACHE_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (isValidIpv4(parsed?.ip)) {
            this.cachedIp = parsed.ip.trim();
          }
        }
      }
    } catch (err) {
      console.warn('[ESP32 Sender] Falha ao ler cache do IP:', err);
    }

    this.cacheLoaded = true;
    return this.cachedIp;
  }

  private async saveCachedIp(ip: string, port: number = DEFAULT_ESP32_UDP_PORT): Promise<void> {
    if (!isValidIpv4(ip)) return;
    const cleanIp = ip.trim();
    this.cachedIp = cleanIp;
    this.cacheLoaded = true;

    const payload = JSON.stringify({ ip: cleanIp, port, updatedAt: Date.now() });

    try {
      const fileUri = this.getCacheFileUri();
      if (fileUri) {
        await FileSystem.writeAsStringAsync(fileUri, payload);
      } else if (typeof localStorage !== 'undefined') {
        localStorage.setItem(CACHE_STORAGE_KEY, payload);
      }
    } catch (err) {
      console.warn('[ESP32 Sender] Falha ao salvar cache do IP:', err);
    }
  }

  private async getDeviceLocalIpv4(): Promise<string | null> {
    try {
      const ip = await Network.getIpAddressAsync();
      return isValidIpv4(ip) ? ip.trim() : null;
    } catch {
      return null;
    }
  }

  private notifyStatusListeners() {
    const snapshot = this.getDiscoveryStatus();
    for (const listener of this.statusListeners) {
      try {
        listener(snapshot);
      } catch {}
    }
  }

  public subscribe(listener: (status: Esp32DiscoveryStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.getDiscoveryStatus());
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  public getDiscoveryStatus(): Esp32DiscoveryStatus {
    return { ...this.discoveryStatus };
  }

  private async bootstrapDiscovery(): Promise<void> {
    const cached = await this.loadCachedIp();
    if (cached) {
      this.esp32Ip = cached;
      this.discoveryStatus = {
        ...this.discoveryStatus,
        ip: cached,
        port: this.esp32Port
      };
      this.notifyStatusListeners();
    }
    await this.discoverLightingDevice();
  }

  /**
   * Descobre automaticamente o IP do controlador G7 Desk F1 na rede local:
   * 1. Cache (400 ms) -> 2. mDNS g7-desk-lighting.local (800 ms) -> 3. Varredura paralela da sub-rede.
   */
  public async discoverLightingDevice(options?: { force?: boolean }): Promise<string | null> {
    if (this.discoveryPromise) {
      return this.discoveryPromise;
    }

    if (
      !options?.force &&
      this.lastDiscoveryFailureTime > 0 &&
      Date.now() - this.lastDiscoveryFailureTime < DISCOVERY_FAILURE_COOLDOWN_MS
    ) {
      return null;
    }

    this.discoveryPromise = (async () => {
      this.discoveryStatus = {
        ...this.discoveryStatus,
        status: 'DISCOVERING',
        message: 'Buscando G7 Desk F1 na rede local...',
        lastAttemptTime: Date.now()
      };
      this.notifyStatusListeners();

      const result = await discoverLightingDeviceWithDetails({
        getLastSavedIp: async () => {
          const cached = await this.loadCachedIp();
          if (cached) return cached;
          return isValidIpv4(this.esp32Ip) ? this.esp32Ip : null;
        },
        saveLastIp: (ip, port) => this.saveCachedIp(ip, port),
        getLocalIpv4: () => this.getDeviceLocalIpv4(),
        fallbackPrefixIp: this.esp32Ip
      });

      if (result.ip) {
        this.esp32Ip = result.ip;
        this.esp32Port = result.port;
        this.lastDiscoveryFailureTime = 0;

        const methodLabel =
          result.method === 'CACHE'
            ? 'cache'
            : result.method === 'MDNS'
            ? 'mDNS'
            : 'varredura da rede';

        this.discoveryStatus = {
          status: 'CONNECTED',
          ip: result.ip,
          port: result.port,
          method: result.method,
          message: `G7 Desk F1 encontrado em ${result.ip} via ${methodLabel} (${result.elapsedMs} ms).`,
          lastAttemptTime: Date.now()
        };
        this.notifyStatusListeners();
        console.log(`[ESP32 Discovery] ${this.discoveryStatus.message}`);
        return result.ip;
      }

      this.lastDiscoveryFailureTime = Date.now();
      this.discoveryStatus = {
        ...this.discoveryStatus,
        status: 'NOT_FOUND',
        method: null,
        message: 'G7 Desk F1 não encontrado na rede local. Verifique o Wi-Fi ou informe o IP manualmente.',
        lastAttemptTime: Date.now()
      };
      this.notifyStatusListeners();
      return null;
    })();

    try {
      return await this.discoveryPromise;
    } finally {
      this.discoveryPromise = null;
    }
  }

  /**
   * Garante conectividade ao iniciar uma sessão/corrida:
   * testa o IP atual rapidamente (/json/info) e dispara auto-discovery se não responder.
   */
  public async ensureConnectedOnSessionStart(): Promise<void> {
    if (this.discoveryPromise) {
      await this.discoveryPromise;
      return;
    }

    await this.loadCachedIp();

    if (isValidIpv4(this.esp32Ip)) {
      const info = await probeJsonInfo(this.esp32Ip, CACHE_HEALTH_TIMEOUT_MS);
      if (info) {
        const resolvedIp = isValidIpv4(info.ip) ? info.ip.trim() : this.esp32Ip;
        const port = typeof info.udpport === 'number' ? info.udpport : DEFAULT_ESP32_UDP_PORT;
        this.esp32Ip = resolvedIp;
        this.esp32Port = port;
        if (this.discoveryStatus.status !== 'CONNECTED' || this.discoveryStatus.ip !== resolvedIp) {
          this.discoveryStatus = {
            status: 'CONNECTED',
            ip: resolvedIp,
            port,
            method: 'CACHE',
            message: `G7 Desk F1 ativo em ${resolvedIp}.`,
            lastAttemptTime: Date.now()
          };
          this.notifyStatusListeners();
        }
        return;
      }
    }

    await this.discoverLightingDevice();
  }

  public setTargetIp(ip: string, port: number = DEFAULT_ESP32_UDP_PORT) {
    const cleanIp = ip.trim().split(':')[0];
    if (cleanIp) {
      this.esp32Ip = cleanIp;
      this.discoveryStatus = {
        ...this.discoveryStatus,
        ip: cleanIp,
        port
      };
      this.notifyStatusListeners();
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
    }, 50);
  }

  private async initUdpSockets() {
    if ((this.expoSocket || this.rnSocket) || this.initializingSocket) return;
    this.initializingSocket = true;

    // 1. Inicializa @isvend/expo-udp como canal nativo primário de ultra-baixa latência (C++/Kotlin JSI direto)
    try {
      // @ts-ignore
      const expoUdp = require('@isvend/expo-udp');
      if (expoUdp && typeof expoUdp.createSocket === 'function') {
        const sock = await expoUdp.createSocket({
          type: 'udp4',
          reuseAddress: true,
          reusePort: true
        });
        // BIND EXPLÍCITO A 0.0.0.0:0:
        // Fundamental no Android para alocar o socket nativo imediatamente na interface de rede
        // e evitar atrasos de resolução de rota ou erros silenciosos de socket unbound!
        try {
          await sock.bind({ port: 0, address: '0.0.0.0' });
        } catch {}
        this.expoSocket = sock;
        console.log('[ESP32 Sender] Socket UDP Expo nativo inicializado e vinculado com sucesso.');
      }
    } catch (e) {
      console.warn('[ESP32 Sender] expo-udp não disponível, inicializando fallback react-native-udp:', e);
    }

    // 2. Fallback react-native-udp (apenas se expo-udp não estiver disponível)
    if (!this.expoSocket) {
      try {
        // @ts-ignore
        const dgram = require('react-native-udp');
        if (dgram && typeof dgram.createSocket === 'function') {
          const sock = dgram.createSocket({ type: 'udp4' });
          try {
            sock.bind(0, '0.0.0.0');
          } catch {}
          this.rnSocket = sock;
          console.log('[ESP32 Sender] Socket UDP Fallback (Dgram) inicializado.');
        }
      } catch {}
    }

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
    // Transmissão contínua em alta taxa (25 Hz / a cada 40ms):
    // Mantém o chip Wi-Fi do celular em estado ativo contínuo (sem entrar em power save)
    // e garante que qualquer frame seja refletido em < 40ms mesmo em caso de oscilação momentânea
    const isUdpHeartbeatDue = now - this.lastUdpSendTime >= 40;

    if (!isPriorityChanged && !isUdpHeartbeatDue) {
      return;
    }

    this.lastPriorityHash = priorityHash;
    this.lastUdpSendTime = now;

    const jsonStr = JSON.stringify(payload);

    if (isPriorityChanged) {
      // TRANSIÇÃO DE ESTADO CRÍTICA (Reta, DRS, Overtake, Bandeiras, Boxes, Batida):
      // Disparo imediato (0ms) + rajada leve de redundância (+15ms, +35ms, +60ms)
      this.sendUdp(jsonStr, true);
      for (const delayMs of [15, 35, 60]) {
        setTimeout(() => {
          if (this.latestPayload) {
            this.sendUdp(JSON.stringify(this.latestPayload), true);
          }
        }, delayMs);
      }
    } else {
      // Fluxo contínuo regular via UDP puro a 25 Hz
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

      // 1. Canal Primário: @isvend/expo-udp (JSI Nativo Direto — Sem base64, sem criar Threads extras no Android)
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
          .catch((err: any) => {
            this.lastError = `Expo UDP: ${err?.message || err}`;
            // Se expoSocket falhar pontualmente, despacha pelo fallback dgram
            if (this.rnSocket) {
              try {
                this.rnSocket.send(bytes, 0, bytes.length, this.esp32Port, this.esp32Ip);
              } catch {}
            }
          });
        return;
      }

      // 2. Canal Fallback: react-native-udp (Dgram)
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

    // Testa HTTP em /api/effect apenas quando o botão de teste no menu é clicado
    try {
      const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
      const timeoutId = controller ? setTimeout(() => controller.abort(), 2000) : null;

      const res = await fetch(`http://${this.esp32Ip}/api/effect?name=aero`, {
        method: 'POST',
        signal: controller ? controller.signal : undefined
      });

      if (timeoutId) clearTimeout(timeoutId);

      if (res.ok) {
        this.packetsSentCount++;
        this.lastSuccessTime = Date.now();
        await this.saveCachedIp(this.esp32Ip, this.esp32Port);
        this.discoveryStatus = {
          status: 'CONNECTED',
          ip: this.esp32Ip,
          port: this.esp32Port,
          method: this.discoveryStatus.method ?? 'CACHE',
          message: `Conectado ao ESP32 (${this.esp32Ip})!`,
          lastAttemptTime: Date.now()
        };
        this.notifyStatusListeners();
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
