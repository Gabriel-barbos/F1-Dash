import { CockpitTelemetryState, INITIAL_TELEMETRY_STATE } from '../core/state/telemetry-state';
import { TelemetryStore } from '../core/state/telemetry-store';
import { nativeUdpReceiver } from './native-udp-receiver';
import { ERSDeployMode, VisualTyreCompound } from '../core/models/car-status';
import { SafetyCarStatus } from '../core/models/session';
import { PitStatus } from '../core/models/lap-data';

export type TelemetryCallback = (state: CockpitTelemetryState) => void;

export type ConnectionMode = 'UDP_NATIVE' | 'WEBSOCKET' | 'MOCK';

class TelemetryService {
  private ws: WebSocket | null = null;
  private listeners: Set<TelemetryCallback> = new Set();
  private currentState: CockpitTelemetryState = { ...INITIAL_TELEMETRY_STATE };
  private mockInterval: any = null;
  private serverHost: string = '192.168.1.104:5173';
  private mode: ConnectionMode = 'UDP_NATIVE';
  private storeUnsub: (() => void) | null = null;

  constructor() {
    // Escuta o TelemetryStore interno (utilizado quando os pacotes UDP chegam diretamente no celular)
    const store = TelemetryStore.getInstance();
    this.storeUnsub = store.subscribe((storeState) => {
      if (this.mode === 'UDP_NATIVE' && storeState.connected) {
        this.currentState = { ...storeState };
        this.notify();
      }
    });
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
      console.log('[TelemetryService] UDP nativo não disponível no ambiente atual, ativando fallback.');
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
      const url = ws:///telemetry-ws;
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
          if (this.mode === 'WEBSOCKET' && (!this.ws || this.ws.readyState === WebSocket.CLOSED)) {
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

      this.currentState = {
        ...this.currentState,
        connected: true,
        packetsPerSecond: 60,
        gear: gear,
        engineRPM: rpm,
        speed: Math.round(speed),
        throttle: throttle,
        brake: brake,
        revLightsPercent: revPercent,
        drsActive: speed > 240 && gear >= 6,
        drsAllowed: gear >= 5,
        ersPercentage: ersPercent,
        ersDeployMode: speed > 260 ? ERSDeployMode.Overtake : ERSDeployMode.Medium,
        carPosition: 5,
        currentLapNum: 23,
        totalLaps: 58,
        currentLapTimeInMS: (tick * 50) % 84000,
        lastLapTimeInMS: 84305,
        bestLapTimeInMS: 83942,
        visualTyreCompound: VisualTyreCompound.F1_Hard,
        tyresAgeLaps: 12,
        tyresSurfaceTemperature: [98, 99, 102, 101],
        tyresPressure: [23.8, 23.9, 24.1, 24.0],
        brakesTemperature: [450, 470, 520, 510],
        tyresWear: [18, 21, 25, 23],
        frontLeftWingDamage: (tick % 500 > 350) ? 25 : 0,
        frontRightWingDamage: 0,
        floorDamage: (tick % 500 > 350) ? 15 : 0,
        rearWingDamage: 0,
        engineDamage: 4
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

  public forceStateScenario(scenario: 'NORMAL' | 'DRS' | 'OVERTAKE' | 'SAFETY_CAR' | 'VSC' | 'RED_FLAG' | 'PIT_LANE' | 'DAMAGE') {
    switch (scenario) {
      case 'SAFETY_CAR':
        this.currentState = {
          ...this.currentState,
          safetyCarStatus: SafetyCarStatus.FullSafetyCar,
          safetyCarDelta: 12.543,
          isRedFlagActive: false,
          pitStatus: PitStatus.None
        };
        break;
      case 'VSC':
        this.currentState = {
          ...this.currentState,
          safetyCarStatus: SafetyCarStatus.VirtualSafetyCar,
          safetyCarDelta: -0.421,
          isRedFlagActive: false,
          pitStatus: PitStatus.None
        };
        break;
      case 'RED_FLAG':
        this.currentState = {
          ...this.currentState,
          isRedFlagActive: true,
          safetyCarStatus: SafetyCarStatus.NoSafetyCar,
          pitStatus: PitStatus.None
        };
        break;
      case 'PIT_LANE':
        this.currentState = {
          ...this.currentState,
          pitStatus: PitStatus.PitLane,
          pitLimiterActive: true,
          pitSpeedLimit: 80,
          speed: 78,
          gear: 2,
          safetyCarStatus: SafetyCarStatus.NoSafetyCar,
          isRedFlagActive: false
        };
        break;
      case 'OVERTAKE':
        this.currentState = {
          ...this.currentState,
          ersDeployMode: ERSDeployMode.Overtake,
          drsActive: false,
          safetyCarStatus: SafetyCarStatus.NoSafetyCar,
          isRedFlagActive: false
        };
        break;
      case 'DRS':
        this.currentState = {
          ...this.currentState,
          drsActive: true,
          drsAllowed: true,
          ersDeployMode: ERSDeployMode.Medium,
          safetyCarStatus: SafetyCarStatus.NoSafetyCar,
          isRedFlagActive: false
        };
        break;
      case 'DAMAGE':
        this.currentState = {
          ...this.currentState,
          frontLeftWingDamage: 45,
          frontRightWingDamage: 10,
          floorDamage: 30,
          rearWingDamage: 15,
          engineDamage: 22
        };
        break;
      case 'NORMAL':
      default:
        this.currentState = {
          ...this.currentState,
          safetyCarStatus: SafetyCarStatus.NoSafetyCar,
          isRedFlagActive: false,
          pitStatus: PitStatus.None,
          drsActive: false,
          frontLeftWingDamage: 0,
          frontRightWingDamage: 0,
          floorDamage: 0
        };
        break;
    }
    this.notify();
  }
}

export const telemetryService = new TelemetryService();
