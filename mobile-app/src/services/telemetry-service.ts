import {
  RaceState,
  CockpitTelemetryState,
  INITIAL_COCKPIT_TELEMETRY_STATE,
  TelemetryStore,
  toCockpitTelemetryState,
  ERSDeployMode,
  VisualTyreCompound,
  SafetyCarStatus,
  Weather,
  PitStatus
} from '@f1-dash/telemetry-core';
import Constants from 'expo-constants';
import { nativeUdpReceiver, isRunningInExpoGo, isNativeUdpSupported } from './native-udp-receiver';
import { raceEngineerDetector } from './race-engineer-detector';

export type TelemetryCallback = (state: CockpitTelemetryState) => void;

export type ConnectionMode = 'UDP_NATIVE' | 'WEBSOCKET' | 'MOCK';

export type MockScenario =
  | 'NORMAL'
  | 'START'
  | 'DRS'
  | 'OVERTAKE'
  | 'SAFETY_CAR'
  | 'VSC'
  | 'RED_FLAG'
  | 'PIT_LANE'
  | 'FASTEST_LAP'
  | 'DAMAGE'
  | 'WET';

export type MomentaryEventType =
  | 'RACE_START'
  | 'SAFETY_CAR'
  | 'VSC'
  | 'RED_FLAG'
  | 'PIT_LANE'
  | 'CAR_DAMAGE'
  | 'CHEQUERED_FLAG'
  | 'TEAM_RADIO';

export const getInitialServerHost = (): string => {
  try {
    const hostUri = Constants.expoConfig?.hostUri || (Constants as any).manifest?.debuggerHost;
    if (hostUri) {
      const ip = hostUri.split(':')[0];
      if (ip) return `${ip}:20778`;
    }
  } catch {}
  return '192.168.0.75:20778';
};

class TelemetryService {
  private ws: WebSocket | null = null;
  private listeners: Set<TelemetryCallback> = new Set();
  private momentaryListeners: Set<(type: MomentaryEventType, payload?: any) => void> = new Set();
  private currentState: CockpitTelemetryState = { ...INITIAL_COCKPIT_TELEMETRY_STATE };
  private mockInterval: any = null;
  private serverHost: string = getInitialServerHost();
  private mode: ConnectionMode = isNativeUdpSupported() ? 'UDP_NATIVE' : 'MOCK';
  private deviceName: string = 'PS5 do Goat';
  private storeUnsub: (() => void) | null = null;
  private lastUiUpdate: number = 0;
  private lastDetectorEval: number = 0;

  constructor() {
    const store = TelemetryStore.getInstance();
    this.storeUnsub = store.subscribe((raceState) => {
      if (this.mode === 'UDP_NATIVE' && raceState.connection.connected) {
        const now = Date.now();
        // Notificação da UI suave a 30 FPS (a cada 33ms) para manter o thread JS do Hermes desimpedido
        if (now - this.lastUiUpdate >= 33) {
          this.lastUiUpdate = now;
          const cockpitState = toCockpitTelemetryState(raceState);
          this.currentState = cockpitState;

          // Avalia eventos do engenheiro de forma cadenciada (a cada 250ms) sem travar a fila de rede
          if (now - this.lastDetectorEval >= 250) {
            this.lastDetectorEval = now;
            raceEngineerDetector.evaluate(cockpitState, (scenario) => {
              this.triggerMomentaryEvent('TEAM_RADIO', { scenario, state: cockpitState });
            });
          }

          this.notify();
        }
      } else if (this.mode === 'UDP_NATIVE' && !raceState.connection.connected && this.currentState.connected) {
        this.currentState = toCockpitTelemetryState(raceState);
        this.notify();
      }
    });

    if (this.mode === 'UDP_NATIVE') {
      // No APK compilado para Android, o UDP nativo escuta a porta 20777 direto no celular
      this.startNativeUdp();
    } else {
      // Apenas no Expo Go de demonstração sem módulos compilados inicia o mock
      this.startInternalMock();
    }
  }

  public isExpoGo(): boolean {
    return isRunningInExpoGo();
  }

  public subscribe(callback: TelemetryCallback): () => void {
    this.listeners.add(callback);
    callback(this.currentState);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    for (const listener of this.listeners) {
      listener(this.currentState);
    }
  }

  public setMode(newMode: ConnectionMode) {
    this.mode = newMode;
    if (this.mode === 'UDP_NATIVE') {
      this.stopInternalMock();
      this.disconnectWs();
      this.startNativeUdp();
    } else if (this.mode === 'WEBSOCKET') {
      this.stopInternalMock();
      this.stopNativeUdp();
      this.connectWs();
    } else if (this.mode === 'MOCK') {
      this.disconnectWs();
      this.stopNativeUdp();
      this.startInternalMock();
    }
  }

  public getMode(): ConnectionMode {
    return this.mode;
  }

  public async startNativeUdp() {
    const started = await nativeUdpReceiver.start();
    if (!started) {
      console.log('[TelemetryService] UDP nativo não disponível no ambiente atual.');
    }
  }

  public stopNativeUdp() {
    nativeUdpReceiver.stop();
  }

  public setServerHost(host: string) {
    this.serverHost = host.trim();
    if (this.mode === 'WEBSOCKET') {
      this.connectWs();
    }
  }

  private isWsLinkOpen: boolean = false;

  public isWsConnected(): boolean {
    return this.mode === 'WEBSOCKET' && this.isWsLinkOpen;
  }

  public connectWs() {
    this.disconnectWs();

    try {
      const url = `ws://${this.serverHost}/telemetry-ws`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.isWsLinkOpen = true;
        this.currentState.connected = true;
        this.notify();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type === 'TEAM_RADIO') {
            this.triggerMomentaryEvent('TEAM_RADIO', data);
            return;
          }
          this.isWsLinkOpen = true;
          this.currentState = { ...this.currentState, ...data };
          this.notify();
        } catch {}
      };

      this.ws.onclose = () => {
        this.isWsLinkOpen = false;
        this.currentState.connected = false;
        this.notify();
        setTimeout(() => {
          if (this.mode === 'WEBSOCKET' && (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
            this.connectWs();
          }
        }, 2500);
      };

      this.ws.onerror = () => {
        this.isWsLinkOpen = false;
        this.ws?.close();
      };
    } catch {
      this.isWsLinkOpen = false;
      this.currentState.connected = false;
      this.notify();
    }
  }

  public disconnectWs() {
    this.isWsLinkOpen = false;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }
  }

  public toggleMockMode(): boolean {
    if (this.mode === 'MOCK') {
      this.setMode('UDP_NATIVE');
      return false;
    } else {
      this.setMode('MOCK');
      return true;
    }
  }

  public isMockActive(): boolean {
    return this.mode === 'MOCK';
  }

  private currentScenario: MockScenario = 'NORMAL';

  private startInternalMock() {
    this.stopInternalMock();
    let tick = 0;
    let gear = 1;
    let rpm = 4000;
    let speed = 60;
    let throttle = 0;
    let brake = 0;

    this.mockInterval = setInterval(() => {
      tick++;
      if (gear <= 7) {
        throttle = Math.min(1, throttle + 0.05);
        brake = 0;
        rpm += 350;
        speed += 4;
        if (rpm >= 12800) {
          gear++;
          rpm = 9500;
        }
      } else {
        throttle = 0;
        brake = Math.min(1, brake + 0.1);
        rpm -= 450;
        speed = Math.max(70, speed - 8);
        if (rpm <= 7000 && gear > 2) {
          gear--;
          rpm = 10500;
        } else if (gear <= 2 && speed <= 80) {
          gear = 1;
          throttle = 0;
          brake = 0;
          rpm = 4000;
        }
      }

      const revPercent = Math.min(100, Math.max(0, ((rpm - 4000) / (13500 - 4000)) * 100));
      const ersPercent = Math.max(10, 100 - (tick % 300) * 0.3);

      const isNormal = this.currentScenario === 'NORMAL';

      let currentSpeed = Math.round(speed);
      let currentGear = gear;
      let currentRpm = rpm;
      let currentLapTime = (tick * 50) % 84000;

      if (this.currentScenario === 'PIT_LANE') {
        currentSpeed = 78;
        currentGear = 2;
      } else if (this.currentScenario === 'START') {
        currentSpeed = 0;
        currentGear = 1;
        currentRpm = 10800;
      } else if (this.currentScenario === 'FASTEST_LAP') {
        currentLapTime = 4000;
      }

      this.currentState = {
        ...this.currentState,
        connected: true,
        packetsPerSecond: 60,
        gear: currentGear,
        engineRPM: currentRpm,
        speed: currentSpeed,
        throttle: throttle,
        brake: brake,
        revLightsPercent: revPercent,
        ersPercentage: ersPercent,
        currentLapTimeInMS: currentLapTime,
        // Só alterna DRS/Overtake dinamicamente no mock se for explicitamente modo DRS ou OVERTAKE
        drsActive: this.currentScenario === 'DRS',
        drsAllowed: this.currentScenario === 'DRS',
        activeAeroMode: this.currentScenario === 'DRS' ? 1 : 0,
        activeAeroAvailable: this.currentScenario === 'DRS',
        overtakeActive: this.currentScenario === 'OVERTAKE',
        overtakeAvailable: this.currentScenario === 'OVERTAKE',
        ersDeployMode: this.currentScenario === 'OVERTAKE' ? ERSDeployMode.Overtake : ERSDeployMode.Medium,
        carPosition: 3,
        currentLapNum: 12,
        totalLaps: 56,
      };

      this.notify();
    }, 50);
  }

  private stopInternalMock() {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
    }
  }

  public getCurrentScenario(): MockScenario {
    return this.currentScenario;
  }

  public forceStateScenario(scenario: MockScenario) {
    this.currentScenario = scenario;

    // Reset base flags
    const baseReset = {
      safetyCarStatus: SafetyCarStatus.None,
      isRedFlagActive: false,
      pitStatus: PitStatus.None,
      pitLimiterActive: false,
      drsActive: false,
      drsAllowed: false,
      activeAeroMode: 0,
      activeAeroAvailable: false,
      activeAeroActivationDistance: 0,
      overtakeActive: false,
      overtakeAvailable: false,
      overtakeActivationDistance: 0,
      ersDeployMode: ERSDeployMode.Medium,
      weather: Weather.Clear,
      visualTyreCompound: VisualTyreCompound.F1_Hard,
      frontLeftWingDamage: 0,
      frontRightWingDamage: 0,
      floorDamage: 0,
      rearWingDamage: 0,
      engineDamage: 0,
      lastLapTimeInMS: 88456,
      bestLapTimeInMS: 87891,
      currentLapTimeInMS: 35000,
    };

    switch (scenario) {
      case 'START':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          safetyCarStatus: SafetyCarStatus.FormationLap,
          speed: 0,
          gear: 1,
          engineRPM: 10800,
          revLightsPercent: 75,
        };
        break;
      case 'SAFETY_CAR':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          safetyCarStatus: SafetyCarStatus.Full,
          safetyCarDelta: 12.543,
        };
        break;
      case 'VSC':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          safetyCarStatus: SafetyCarStatus.Virtual,
          safetyCarDelta: 8.214,
        };
        break;
      case 'RED_FLAG':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          isRedFlagActive: true,
        };
        break;
      case 'PIT_LANE':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          pitStatus: PitStatus.Pitting,
          pitLimiterActive: true,
          pitSpeedLimit: 80,
          speed: 78,
          gear: 2,
        };
        break;
      case 'OVERTAKE':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          ersDeployMode: ERSDeployMode.Overtake,
          overtakeActive: true,
          overtakeAvailable: true,
          overtakeActivationDistance: 0,
        };
        break;
      case 'DRS':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          drsActive: true,
          drsAllowed: true,
          activeAeroMode: 1,
          activeAeroAvailable: true,
          activeAeroActivationDistance: 0,
        };
        break;
      case 'DAMAGE':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          frontLeftWingDamage: 45,
          frontRightWingDamage: 10,
          floorDamage: 30,
          rearWingDamage: 15,
          engineDamage: 22,
        };
        break;
      case 'FASTEST_LAP':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          lastLapTimeInMS: 83210,
          bestLapTimeInMS: 83210,
          currentLapTimeInMS: 4000,
        };
        break;
      case 'WET':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          weather: Weather.HeavyRain,
          visualTyreCompound: VisualTyreCompound.F1_Wet,
        };
        break;
      case 'NORMAL':
      default:
        this.currentState = {
          ...this.currentState,
          ...baseReset,
        };
        break;
    }
    this.notify();
  }

  public getDeviceName(): string {
    return this.deviceName;
  }

  public setDeviceName(name: string) {
    this.deviceName = name;
    this.notify();
  }

  public getServerHost(): string {
    return this.serverHost;
  }

  public subscribeMomentaryEvent(callback: (type: MomentaryEventType, payload?: any) => void): () => void {
    this.momentaryListeners.add(callback);
    return () => {
      this.momentaryListeners.delete(callback);
    };
  }

  public triggerMomentaryEvent(type: MomentaryEventType, payload?: any) {
    if (this.mode === 'MOCK') {
      if (type === 'SAFETY_CAR') {
        this.forceStateScenario('SAFETY_CAR');
      } else if (type === 'VSC') {
        this.forceStateScenario('VSC');
      } else if (type === 'RED_FLAG') {
        this.forceStateScenario('RED_FLAG');
      } else if (type === 'PIT_LANE') {
        this.forceStateScenario('PIT_LANE');
      } else if (type === 'CAR_DAMAGE') {
        this.forceStateScenario('DAMAGE');
      }
    }

    for (const listener of this.momentaryListeners) {
      listener(type, payload);
    }
  }
}

export const telemetryService = new TelemetryService();