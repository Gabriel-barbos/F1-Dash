import { CockpitTelemetryState, INITIAL_TELEMETRY_STATE } from '../core/state/telemetry-state';
import { TelemetryStore } from '../core/state/telemetry-store';
import { nativeUdpReceiver, isRunningInExpoGo } from './native-udp-receiver';
import { ERSDeployMode, VisualTyreCompound } from '../core/models/car-status';
import { SafetyCarStatus, Weather } from '../core/models/session';
import { PitStatus } from '../core/models/lap-data';

export type TelemetryCallback = (state: CockpitTelemetryState) => void;

export type ConnectionMode = 'UDP_NATIVE' | 'WEBSOCKET' | 'MOCK';

export type MomentaryEventType =
  | 'RACE_START'
  | 'SAFETY_CAR'
  | 'VSC'
  | 'RED_FLAG'
  | 'PIT_LANE'
  | 'CAR_DAMAGE'
  | 'CHEQUERED_FLAG';

class TelemetryService {
  private ws: WebSocket | null = null;
  private listeners: Set<TelemetryCallback> = new Set();
  private momentaryListeners: Set<(type: MomentaryEventType) => void> = new Set();
  private currentState: CockpitTelemetryState = { ...INITIAL_TELEMETRY_STATE };
  private mockInterval: any = null;
  private serverHost: string = '192.168.1.107:5173';
  private mode: ConnectionMode = isRunningInExpoGo() ? 'MOCK' : 'UDP_NATIVE';
  private deviceName: string = 'PS5 do Goat';
  private storeUnsub: (() => void) | null = null;

  constructor() {
    const store = TelemetryStore.getInstance();
    this.storeUnsub = store.subscribe((storeState) => {
      if (this.mode === 'UDP_NATIVE' && storeState.connected) {
        this.currentState = {
          ...storeState,
          floorDamage: storeState.floorDamage ?? 0,
          diffuserDamage: storeState.diffuserDamage ?? 0,
          sidepodDamage: storeState.sidepodDamage ?? 0,
          gearBoxDamage: storeState.gearBoxDamage ?? 0
        };
        this.notify();
      }
    });

    if (isRunningInExpoGo()) {
      // No Expo Go, o simulador (MOCK) inicia por padrão para testes sem erro de módulo nativo
      this.mode = 'MOCK';
      this.startInternalMock();
    } else {
      // No APK compilado para Android, o UDP nativo escuta a porta 20777 direto no celular
      this.mode = 'UDP_NATIVE';
      this.startNativeUdp();
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
      this.startNativeUdp();
      // Em celulares com Expo Go onde UDP direto não é liberado pelo SO,
      // conecta via WebSocket à bridge do PC para que os pacotes do PS5 cheguem com 60 FPS
      this.connectWs();
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

  public connectWs() {
    this.disconnectWs();

    try {
      const url = `ws://${this.serverHost}/telemetry-ws`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        this.currentState.connected = true;
        this.notify();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.currentState = { ...this.currentState, ...data, connected: true };
          this.notify();
        } catch {}
      };

      this.ws.onclose = () => {
        this.currentState.connected = false;
        this.notify();
        setTimeout(() => {
          if ((this.mode === 'WEBSOCKET' || this.mode === 'UDP_NATIVE') && (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
            this.connectWs();
          }
        }, 2500);
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.currentState.connected = false;
      this.notify();
    }
  }

  public disconnectWs() {
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

  private currentScenario: string = 'NORMAL';

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

      this.currentState = {
        ...this.currentState,
        connected: true,
        packetsPerSecond: 60,
        gear: this.currentScenario === 'PIT_LANE' ? 2 : gear,
        engineRPM: rpm,
        speed: this.currentScenario === 'PIT_LANE' ? 78 : Math.round(speed),
        throttle: throttle,
        brake: brake,
        revLightsPercent: revPercent,
        drsActive: isNormal ? (speed > 240 && gear >= 6) : this.currentState.drsActive,
        drsAllowed: isNormal ? (gear >= 5) : this.currentState.drsAllowed,
        ersPercentage: ersPercent,
        ersDeployMode: isNormal
          ? (speed > 260 ? ERSDeployMode.Overtake : ERSDeployMode.Medium)
          : this.currentState.ersDeployMode,
        carPosition: 3,
        currentLapNum: 12,
        totalLaps: 56,
        currentLapTimeInMS: (tick * 50) % 84000,
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

  public forceStateScenario(scenario: 'NORMAL' | 'DRS' | 'OVERTAKE' | 'SAFETY_CAR' | 'VSC' | 'RED_FLAG' | 'PIT_LANE' | 'DAMAGE' | 'FASTEST_LAP' | 'WET') {
    this.currentScenario = scenario;

    // Reset base flags
    const baseReset = {
      safetyCarStatus: SafetyCarStatus.None,
      isRedFlagActive: false,
      pitStatus: PitStatus.None,
      pitLimiterActive: false,
      drsActive: false,
      drsAllowed: false,
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
    };

    switch (scenario) {
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
          safetyCarDelta: -0.421,
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
          pitStatus: PitStatus.InPitArea,
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
        };
        break;
      case 'DRS':
        this.currentState = {
          ...this.currentState,
          ...baseReset,
          drsActive: true,
          drsAllowed: true,
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

  public subscribeMomentaryEvent(callback: (type: MomentaryEventType) => void): () => void {
    this.momentaryListeners.add(callback);
    return () => {
      this.momentaryListeners.delete(callback);
    };
  }

  public triggerMomentaryEvent(type: MomentaryEventType) {
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

    for (const listener of this.momentaryListeners) {
      listener(type);
    }
  }
}

export const telemetryService = new TelemetryService();