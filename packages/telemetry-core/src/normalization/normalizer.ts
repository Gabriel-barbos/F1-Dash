import { PacketId } from '../models/packet-ids';
import { ParsedPacket } from '../parsers/parser-registry';
import { RaceState, INITIAL_RACE_STATE } from './race-state';
import { DerivedTelemetryEngine } from '../derived/derived-telemetry-engine';
import { RaceEventBus, RaceEvent } from '../events/race-event';
import { SafetyCarStatus } from '../models/session';

export class RaceStateNormalizer {
  private state: RaceState;
  private derivedEngine: DerivedTelemetryEngine;
  private eventBus: RaceEventBus;

  private packetCount = 0;
  private lastHzCheck = Date.now();
  private prevSafetyCar = SafetyCarStatus.None;
  private prevRedFlag = false;

  constructor(eventBus?: RaceEventBus) {
    this.state = JSON.parse(JSON.stringify(INITIAL_RACE_STATE));
    this.derivedEngine = new DerivedTelemetryEngine();
    this.eventBus = eventBus || new RaceEventBus();
  }

  public getState(): RaceState {
    return this.state;
  }

  public getEventBus(): RaceEventBus {
    return this.eventBus;
  }

  public reset(): void {
    this.state = JSON.parse(JSON.stringify(INITIAL_RACE_STATE));
    this.derivedEngine.reset();
    this.packetCount = 0;
    this.prevSafetyCar = SafetyCarStatus.None;
    this.prevRedFlag = false;
  }

  public processPacket(parsed: ParsedPacket | null): RaceState {
    if (!parsed) return this.state;

    this.packetCount++;
    const now = Date.now();
    this.state.connection.connected = true;
    this.state.connection.lastPacketTime = now;

    const header = 'data' in parsed ? (parsed.data as any).header : (parsed as any).header;
    if (header) {
      this.state.connection.gameYear = header.gameYear;
      this.state.connection.packetFormat = header.packetFormat;
      this.state.connection.frameIdentifier = header.frameIdentifier;
      this.state.connection.sessionUID = header.sessionUID.toString();
    }

    switch (parsed.type) {
      case PacketId.CarTelemetry: {
        const tel = parsed.data.playerCarTelemetry;
        this.state.car.speed = tel.speed;
        this.state.car.gear = tel.gear;
        this.state.car.rpm = tel.engineRPM;
        this.state.car.throttle = tel.throttle;
        this.state.car.brake = tel.brake;
        this.state.car.clutch = tel.clutch;
        this.state.car.steer = tel.steer;
        this.state.car.drsActive = tel.drs;
        this.state.car.revLightsPercent = tel.revLightsPercent;
        this.state.car.revLightsBitValue = tel.revLightsBitValue;
        this.state.car.engineTemperature = tel.engineTemperature;

        this.state.tyres.brakesTemperature = [...tel.brakesTemperature];
        this.state.tyres.surfaceTemperature = [...tel.tyresSurfaceTemperature];
        this.state.tyres.innerTemperature = [...tel.tyresInnerTemperature];
        this.state.tyres.pressure = [...tel.tyresPressure];
        break;
      }

      case PacketId.CarTelemetry2: {
        const tel2 = parsed.data.playerCarTelemetry2;
        this.state.car.activeAeroMode = tel2.activeAeroMode;
        this.state.car.activeAeroAvailable = tel2.activeAeroAvailable;
        this.state.car.activeAeroActivationDistance = tel2.activeAeroActivationDistance;
        this.state.car.overtakeActive = tel2.overtakeActive;
        this.state.car.overtakeAvailable = tel2.overtakeAvailable;
        this.state.car.overtakeActivationDistance = tel2.overtakeActivationDistance;
        this.state.car.is2026Regulations = Boolean(tel2.is2026Regulations || (header && header.packetFormat === 2026));

        if (tel2.ersEnergyStore && tel2.ersEnergyStore > 0) {
          this.state.ers.storedJoules = tel2.ersEnergyStore;
          this.state.ers.percent = Math.min(100, Math.max(0, (tel2.ersEnergyStore / this.state.ers.maxCapacityJoules) * 100));
        }
        break;
      }

      case PacketId.CarStatus: {
        const status = parsed.data.playerCarStatus;
        this.state.car.maxRPM = status.maxRPM || 13500;
        this.state.car.idleRPM = status.idleRPM || 4000;
        this.state.car.drsAllowed = status.drsAllowed;

        this.state.ers.storedJoules = status.ersStoreEnergy;
        this.state.ers.percent = Math.min(100, Math.max(0, (status.ersStoreEnergy / this.state.ers.maxCapacityJoules) * 100));
        this.state.ers.deployMode = status.ersDeployMode;
        this.state.ers.harvestedLapMGUK = status.ersHarvestedThisLapMGUK;
        this.state.ers.deployedLap = status.ersDeployedThisLap;

        this.state.fuel.fuelInTank = status.fuelInTank;
        this.state.fuel.fuelCapacity = status.fuelCapacity;
        this.state.fuel.fuelRemainingLaps = status.fuelRemainingLaps;
        this.state.fuel.fuelMix = status.fuelMix;

        this.state.pit.limiterActive = status.pitLimiterStatus;
        this.state.session.fiaFlag = status.vehicleFiaFlags;
        this.state.tyres.compound = status.visualTyreCompound;
        this.state.tyres.ageLaps = status.tyresAgeLaps;
        break;
      }

      case PacketId.LapData: {
        const lap = parsed.data.playerLapData;
        this.state.timing.carPosition = lap.carPosition;
        this.state.timing.gridPosition = lap.gridPosition;
        this.state.timing.currentLap = lap.currentLapNum;
        this.state.timing.currentLapTimeMS = lap.currentLapTimeInMS;
        this.state.timing.lastLapTimeMS = lap.lastLapTimeInMS;
        this.state.timing.sector1TimeMS = lap.sector1TimeInMS;
        this.state.timing.sector2TimeMS = lap.sector2TimeInMS;
        this.state.timing.currentSector = lap.sector;
        this.state.timing.deltaToCarInFrontMS = lap.deltaToCarInFrontInMS;
        this.state.timing.deltaToCarBehindMS = parsed.data.deltaToCarBehindInMS ?? 0;
        this.state.timing.deltaToRaceLeaderMS = lap.deltaToRaceLeaderInMS;
        this.state.timing.safetyCarDelta = lap.safetyCarDelta;
        this.state.timing.lapInvalid = lap.currentLapInvalid;
        this.state.timing.penalties = lap.penalties;

        this.state.pit.status = lap.pitStatus;
        this.state.pit.laneTimeMS = lap.pitLaneTimeInLaneInMS;
        this.state.pit.stopTimeMS = lap.pitStopTimerInMS;
        this.state.pit.stopsCount = lap.numPitStops;

        if (lap.lastLapTimeInMS > 0 && (this.state.timing.bestLapTimeMS === 0 || lap.lastLapTimeInMS < this.state.timing.bestLapTimeMS)) {
          this.state.timing.bestLapTimeMS = lap.lastLapTimeInMS;
        }
        break;
      }

      case PacketId.Session: {
        const session = parsed.data;
        this.state.session.type = session.sessionType;
        this.state.session.weather = session.weather;
        this.state.session.trackTemperature = session.trackTemperature;
        this.state.session.airTemperature = session.airTemperature;
        this.state.session.trackId = session.trackId;
        this.state.session.timeLeft = session.sessionTimeLeft;
        this.state.session.safetyCarStatus = session.safetyCarStatus;
        this.state.session.isRedFlagActive = session.isRedFlagActive;
        this.state.pit.speedLimit = session.pitSpeedLimit;
        this.state.timing.totalLaps = session.totalLaps;

        // Disparo de eventos se houver transição
        if (session.safetyCarStatus !== this.prevSafetyCar) {
          if (session.safetyCarStatus === SafetyCarStatus.Full) {
            this.emitEvent('SAFETY_CAR', { status: SafetyCarStatus.Full });
          } else if (session.safetyCarStatus === SafetyCarStatus.Virtual) {
            this.emitEvent('VSC', { status: SafetyCarStatus.Virtual });
          }
          this.prevSafetyCar = session.safetyCarStatus;
        }

        if (session.isRedFlagActive !== this.prevRedFlag) {
          if (session.isRedFlagActive) {
            this.emitEvent('RED_FLAG', {});
          }
          this.prevRedFlag = session.isRedFlagActive;
        }
        break;
      }

      case PacketId.CarDamage: {
        const dmg = parsed.data.playerCarDamage;
        this.state.tyres.wear = [...dmg.tyresWear];
        this.state.tyres.damage = [...dmg.tyresDamage];
        this.state.damage.frontLeftWing = dmg.frontLeftWingDamage;
        this.state.damage.frontRightWing = dmg.frontRightWingDamage;
        this.state.damage.rearWing = dmg.rearWingDamage;
        this.state.damage.floor = dmg.floorDamage;
        this.state.damage.diffuser = dmg.diffuserDamage;
        this.state.damage.sidepod = dmg.sidepodDamage;
        this.state.damage.gearbox = dmg.gearBoxDamage;
        this.state.damage.engine = dmg.engineDamage;
        this.state.damage.engineICE = dmg.engineICEWear;
        this.state.damage.engineMGUK = dmg.engineMGUKWear;
        this.state.damage.engineTC = dmg.engineTCWear;
        this.state.damage.drsFault = dmg.drsFault;
        this.state.damage.engineBlown = dmg.engineBlown;
        this.state.damage.engineSeized = dmg.engineSeized;

        if (dmg.frontLeftWingDamage > 50 || dmg.frontRightWingDamage > 50 || dmg.floorDamage > 50 || dmg.engineDamage > 50) {
          this.emitEvent('CAR_DAMAGE', { damage: this.state.damage });
        }
        break;
      }

      case PacketId.Event: {
        const evt = parsed.data;
        this.handleRawGameEvent(evt);
        break;
      }
    }

    // 2. Executa cálculos derivados
    const derived = this.derivedEngine.update({
      engineRPM: this.state.car.rpm,
      maxRPM: this.state.car.maxRPM,
      revLightsPercent: this.state.car.revLightsPercent,
      lastLapTimeMS: this.state.timing.lastLapTimeMS,
      sector1TimeMS: this.state.timing.sector1TimeMS,
      sector2TimeMS: this.state.timing.sector2TimeMS,
      carPosition: this.state.timing.carPosition,
      gridPosition: this.state.timing.gridPosition,
      fuelInTank: this.state.fuel.fuelInTank,
      fuelRemainingLaps: this.state.fuel.fuelRemainingLaps,
      currentLap: this.state.timing.currentLap,
      totalLaps: this.state.timing.totalLaps,
      tyresWear: this.state.tyres.wear,
      tyresAgeLaps: this.state.tyres.ageLaps
    });

    this.state.timing.sector3TimeMS = derived.sector3TimeMS;
    this.state.derived = derived;

    // 3. Atualiza medição de frequência de pacotes
    const elapsedSec = (now - this.lastHzCheck) / 1000;
    if (elapsedSec >= 1) {
      this.state.connection.packetsPerSecond = Math.round(this.packetCount / elapsedSec);
      this.packetCount = 0;
      this.lastHzCheck = now;
    }

    return this.state;
  }

  private handleRawGameEvent(evt: any): void {
    const code = evt.eventStringCode;
    switch (code) {
      case 'FTLP':
        this.emitEvent('FASTEST_LAP', evt.eventDetails.details);
        break;
      case 'CHQF':
        this.emitEvent('CHEQUERED_FLAG', {});
        break;
      case 'RDFL':
        this.emitEvent('RED_FLAG', {});
        break;
      case 'PENA':
        this.emitEvent('PENALTY', evt.eventDetails.details);
        break;
      case 'OVTK':
        this.emitEvent('OVERTAKE', evt.eventDetails.details);
        break;
      case 'DRSE':
        this.emitEvent('DRS_ENABLED', {});
        break;
      case 'DRSD':
        this.emitEvent('DRS_DISABLED', {});
        break;
      case 'LGOT':
        this.emitEvent('RACE_START', {});
        break;
    }
  }

  private emitEvent(type: any, data: any): void {
    const event: RaceEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type,
      timestamp: Date.now(),
      sessionTime: this.state.connection.lastPacketTime,
      frameId: this.state.connection.frameIdentifier,
      data
    };
    this.eventBus.emit(event);
  }
}
