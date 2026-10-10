import {
  CockpitTelemetryState,
  SafetyCarStatus,
  PitStatus
} from '@f1-dash/telemetry-core';

export interface DetectorOptions {
  driverName?: string;
  cooldownDamageMs?: number;
  cooldownOvertakeMs?: number;
  cooldownSafetyCarMs?: number;
  cooldownPitMs?: number;
  cooldownGlobalMs?: number;
}

export class RaceEngineerDetector {
  private initialized: boolean = false;
  private prevDamageSum: number = 0;
  private prevMaxWingDamage: number = 0;
  private prevPosition: number = 0;
  private prevSafetyCar: SafetyCarStatus = SafetyCarStatus.None;
  private prevRedFlag: boolean = false;
  private prevPitStatus: PitStatus = PitStatus.None;
  private prevPitLimiter: boolean = false;
  private prevLapNum: number = 0;
  private prevBestLapTime: number = 0;
  private prevTyreWearThresholdNotified: Set<number> = new Set();

  private lastGlobalTriggerTime: number = 0;
  private lastTriggerByScenario: Map<string, number> = new Map();

  private readonly cooldownDamageMs: number;
  private readonly cooldownOvertakeMs: number;
  private readonly cooldownSafetyCarMs: number;
  private readonly cooldownPitMs: number;
  private readonly cooldownGlobalMs: number;

  constructor(options: DetectorOptions = {}) {
    this.cooldownDamageMs = options.cooldownDamageMs ?? 10000; // 10s entre alertas de dano
    this.cooldownOvertakeMs = options.cooldownOvertakeMs ?? 15000; // 15s entre ultrapassagens
    this.cooldownSafetyCarMs = options.cooldownSafetyCarMs ?? 20000; // 20s para safety car
    this.cooldownPitMs = options.cooldownPitMs ?? 25000; // 25s para pit lane
    this.cooldownGlobalMs = options.cooldownGlobalMs ?? 5000; // Mínimo de 5s entre qualquer fala
  }

  public reset() {
    this.initialized = false;
    this.prevDamageSum = 0;
    this.prevMaxWingDamage = 0;
    this.prevPosition = 0;
    this.prevSafetyCar = SafetyCarStatus.None;
    this.prevRedFlag = false;
    this.prevPitStatus = PitStatus.None;
    this.prevPitLimiter = false;
    this.prevLapNum = 0;
    this.prevBestLapTime = 0;
    this.prevTyreWearThresholdNotified.clear();
    this.lastGlobalTriggerTime = 0;
    this.lastTriggerByScenario.clear();
  }

  /**
   * Avalia o estado da telemetria e dispara o rádio automaticamente se um evento relevante for detectado.
   */
  public evaluate(
    state: CockpitTelemetryState,
    onTrigger: (scenario: string) => void
  ) {
    if (!state.connected) {
      return;
    }

    const currentDamageSum =
      (state.frontLeftWingDamage ?? 0) +
      (state.frontRightWingDamage ?? 0) +
      (state.rearWingDamage ?? 0) +
      (state.floorDamage ?? 0) +
      (state.diffuserDamage ?? 0) +
      (state.sidepodDamage ?? 0) +
      (state.gearBoxDamage ?? 0) +
      (state.engineDamage ?? 0);

    const maxWingDamage = Math.max(
      state.frontLeftWingDamage ?? 0,
      state.frontRightWingDamage ?? 0
    );

    const now = Date.now();

    // Na primeira leitura de telemetria após conectar, apenas registra o estado base
    if (!this.initialized) {
      this.initialized = true;
      this.prevDamageSum = currentDamageSum;
      this.prevMaxWingDamage = maxWingDamage;
      this.prevPosition = state.carPosition ?? 0;
      this.prevSafetyCar = state.safetyCarStatus ?? SafetyCarStatus.None;
      this.prevRedFlag = !!state.isRedFlagActive;
      this.prevPitStatus = state.pitStatus ?? PitStatus.None;
      this.prevPitLimiter = !!state.pitLimiterActive;
      this.prevLapNum = state.currentLapNum ?? 0;
      this.prevBestLapTime = state.bestLapTimeInMS ?? 0;
      return;
    }

    const canSpeakGlobally = now - this.lastGlobalTriggerTime >= this.cooldownGlobalMs;

    const canSpeakScenario = (scenario: string, cooldownMs: number): boolean => {
      if (!canSpeakGlobally) return false;
      const last = this.lastTriggerByScenario.get(scenario) ?? 0;
      return now - last >= cooldownMs;
    };

    const trigger = (scenario: string, cooldownMs: number) => {
      this.lastGlobalTriggerTime = now;
      this.lastTriggerByScenario.set(scenario, now);
      onTrigger(scenario);
    };

    // 1. IMPACTO / BATIDA / NOVO DANO (Alta Prioridade)
    // Se o dano total aumentou em >= 4% ou a asa dianteira tomou impacto de >= 5%
    const damageDelta = currentDamageSum - this.prevDamageSum;
    const wingDelta = maxWingDamage - this.prevMaxWingDamage;

    if (damageDelta >= 4 || wingDelta >= 5 || state.engineBlown) {
      if (canSpeakScenario('DAMAGE', this.cooldownDamageMs)) {
        trigger('DAMAGE', this.cooldownDamageMs);
      }
      this.prevDamageSum = currentDamageSum;
      this.prevMaxWingDamage = maxWingDamage;
    } else if (currentDamageSum < this.prevDamageSum) {
      // Carro foi consertado no pit lane
      this.prevDamageSum = currentDamageSum;
      this.prevMaxWingDamage = maxWingDamage;
    }

    // 2. BANDEIRA VERMELHA
    if (state.isRedFlagActive && !this.prevRedFlag) {
      if (canSpeakScenario('RED_FLAG', this.cooldownSafetyCarMs)) {
        trigger('RED_FLAG', this.cooldownSafetyCarMs);
      }
    }
    this.prevRedFlag = !!state.isRedFlagActive;

    // 3. SAFETY CAR COMPLETO
    if (
      state.safetyCarStatus === SafetyCarStatus.Full &&
      this.prevSafetyCar !== SafetyCarStatus.Full
    ) {
      if (canSpeakScenario('SAFETY_CAR', this.cooldownSafetyCarMs)) {
        trigger('SAFETY_CAR', this.cooldownSafetyCarMs);
      }
    }

    // 4. VIRTUAL SAFETY CAR (VSC)
    if (
      state.safetyCarStatus === SafetyCarStatus.Virtual &&
      this.prevSafetyCar !== SafetyCarStatus.Virtual
    ) {
      if (canSpeakScenario('VSC', this.cooldownSafetyCarMs)) {
        trigger('VSC', this.cooldownSafetyCarMs);
      }
    }
    this.prevSafetyCar = state.safetyCarStatus ?? SafetyCarStatus.None;

    // 5. ENTRADA DE BOX / LIMITADOR DE PIT
    const isPitting =
      state.pitStatus === PitStatus.Pitting ||
      state.pitStatus === PitStatus.InPitLane ||
      state.pitLimiterActive;
    const wasPitting =
      this.prevPitStatus === PitStatus.Pitting ||
      this.prevPitStatus === PitStatus.InPitLane ||
      this.prevPitLimiter;

    if (isPitting && !wasPitting) {
      if (canSpeakScenario('PIT_LANE', this.cooldownPitMs)) {
        trigger('PIT_LANE', this.cooldownPitMs);
      }
    }
    this.prevPitStatus = state.pitStatus ?? PitStatus.None;
    this.prevPitLimiter = !!state.pitLimiterActive;

    // 6. ULTRAPASSAGEM (Ganho de Posição)
    const curPos = state.carPosition ?? 0;
    if (this.prevPosition > 0 && curPos > 0) {
      if (curPos < this.prevPosition) {
        // Ex: de P3 para P2 (ganhou posição)
        if (canSpeakScenario('OVERTAKE', this.cooldownOvertakeMs)) {
          trigger('OVERTAKE', this.cooldownOvertakeMs);
        }
      } else if (curPos > this.prevPosition) {
        // Ex: de P2 para P3 (perdeu posição)
        if (canSpeakScenario('POSITION_LOST', this.cooldownOvertakeMs)) {
          trigger('POSITION_LOST', this.cooldownOvertakeMs);
        }
      }
    }
    if (curPos > 0) {
      this.prevPosition = curPos;
    }

    // 7. VOLTA MAIS RÁPIDA (Roxo na tela)
    const curLap = state.currentLapNum ?? 0;
    const lastLapTime = state.lastLapTimeInMS ?? 0;
    const bestLapTime = state.bestLapTimeInMS ?? 0;

    if (
      curLap > this.prevLapNum &&
      lastLapTime > 0 &&
      bestLapTime > 0 &&
      lastLapTime <= bestLapTime
    ) {
      if (canSpeakScenario('FASTEST_LAP', 30000)) {
        trigger('FASTEST_LAP', 30000);
      }
    }
    if (curLap > 0) {
      this.prevLapNum = curLap;
    }
    if (bestLapTime > 0) {
      this.prevBestLapTime = bestLapTime;
    }

    // 8. DESGASTE CRÍTICO DE PNEUS (> 70%)
    if (state.tyresWear && state.tyresWear.length >= 4) {
      const maxWear = Math.max(...state.tyresWear);
      if (maxWear >= 70 && !this.prevTyreWearThresholdNotified.has(70)) {
        this.prevTyreWearThresholdNotified.add(70);
        if (canSpeakScenario('TYRE_WEAR', 45000)) {
          trigger('TYRE_WEAR', 45000);
        }
      }
    }
  }
}

export const raceEngineerDetector = new RaceEngineerDetector();
