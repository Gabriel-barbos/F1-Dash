import {
  RaceState,
  RaceEvent,
  RaceEventType,
  SafetyCarStatus
} from '@f1-dash/telemetry-core';
import { CooldownManager } from './cooldown-manager';
import {
  RadioPriority,
  BrainDecision,
  GeminiRaceContext,
  RadioMessageOutput
} from './types';
import { RaceEngineerConfig } from '../config/engineer-config';

export class EngineerBrain {
  private cooldownManager: CooldownManager;
  private previousPosition: number = 0;
  private previousSafetyCar: SafetyCarStatus = SafetyCarStatus.None;
  private previousMaxTyreWear: number = 0;
  private notifiedTyreThresholds: Set<number> = new Set();
  private lastObservedLap: number = 1;

  constructor(private config: RaceEngineerConfig) {
    this.cooldownManager = new CooldownManager(config.cooldown);
  }

  /**
   * Avalia um evento disparado pelo RaceEventBus.
   */
  public evaluateRaceEvent(event: RaceEvent, state: RaceState): BrainDecision {
    if (!this.config.enabled) {
      return { shouldTriggerGemini: false, reason: 'Race Engineer desabilitado', priority: 'INFORMATIONAL' };
    }

    const currentLap = state.timing.currentLap || 1;
    let priority: RadioPriority = 'INFORMATIONAL';
    let eventKey = event.type;
    let detail = '';

    switch (event.type) {
      case 'SAFETY_CAR':
        priority = 'CRITICAL';
        detail = 'Safety car na pista. Segura o delta.';
        break;
      case 'VSC':
        priority = 'CRITICAL';
        detail = 'Virtual Safety Car acionado. Atenção ao delta positivo.';
        break;
      case 'RED_FLAG':
        priority = 'CRITICAL';
        detail = 'Bandeira Vermelha. Sessão paralisada, volta pros boxes.';
        break;
      case 'CAR_DAMAGE':
        const wingDmg = Math.max(state.damage.frontLeftWing, state.damage.frontRightWing);
        if (wingDmg > 30) {
          priority = 'CRITICAL';
          detail = `Dano grave na asa dianteira (${wingDmg}%). Avalie parada.`;
        } else {
          priority = 'STRATEGIC';
          detail = `Toque no carro. Leve dano na asa dianteira (${wingDmg}%).`;
        }
        break;
      case 'OVERTAKE':
        priority = 'HIGH';
        detail = 'Ultrapassagem realizada com sucesso!';
        break;
      case 'PENALTY':
        priority = 'CRITICAL';
        detail = `Penalidade recebida: ${state.timing.penalties}s`;
        break;
      case 'FASTEST_LAP':
        priority = 'HIGH';
        detail = 'Melhor volta marcada da corrida!';
        break;
      case 'PIT_ENTRY':
      case 'PIT_EXIT':
        priority = 'STRATEGIC';
        detail = event.type === 'PIT_ENTRY' ? 'Entrando nos boxes' : 'Saindo dos boxes, pé embaixo';
        break;
      default:
        priority = 'INFORMATIONAL';
        detail = `Evento: ${event.type}`;
        break;
    }

    const cooldownCheck = this.cooldownManager.canSpeak(priority, eventKey, currentLap);
    if (!cooldownCheck.allowed) {
      return { shouldTriggerGemini: false, reason: cooldownCheck.reason, priority };
    }

    const context = this.buildContext(eventKey, priority, state, detail);
    return {
      shouldTriggerGemini: true,
      reason: 'Evento relevante aprovado pelo Engineer Brain',
      priority,
      context
    };
  }

  /**
   * Avalia periodicamente o RaceState contínuo para detectar situações que não geram pacotes de eventos UDP
   * (ex: desgaste acumulado de pneus, gap com rival caindo, volta calmaria para piada).
   */
  public evaluateContinuousState(state: RaceState): BrainDecision {
    if (!this.config.enabled || !state.connection.connected) {
      return { shouldTriggerGemini: false, reason: 'Sem conexão ou desabilitado', priority: 'INFORMATIONAL' };
    }

    const currentLap = state.timing.currentLap || 1;
    this.lastObservedLap = currentLap;

    // 1. Mudança brusca de posição (ganho ou perda sem pacote de evento)
    if (this.previousPosition > 0 && state.timing.carPosition > 0) {
      if (state.timing.carPosition < this.previousPosition) {
        // Ganhou posição
        this.previousPosition = state.timing.carPosition;
        const cooldown = this.cooldownManager.canSpeak('HIGH', 'POSITION_GAINED', currentLap);
        if (cooldown.allowed) {
          return {
            shouldTriggerGemini: true,
            reason: 'Ganho de posição',
            priority: 'HIGH',
            context: this.buildContext('POSITION_GAINED', 'HIGH', state, `Subiu para P${state.timing.carPosition}`)
          };
        }
      } else if (state.timing.carPosition > this.previousPosition) {
        // Perdeu posição
        this.previousPosition = state.timing.carPosition;
        const cooldown = this.cooldownManager.canSpeak('HIGH', 'POSITION_LOST', currentLap);
        if (cooldown.allowed) {
          return {
            shouldTriggerGemini: true,
            reason: 'Perda de posição',
            priority: 'HIGH',
            context: this.buildContext('POSITION_LOST', 'HIGH', state, `Caiu para P${state.timing.carPosition}`)
          };
        }
      }
    } else if (state.timing.carPosition > 0) {
      this.previousPosition = state.timing.carPosition;
    }

    // 2. Desgaste de pneu crítico (> 55% e > 75%)
    const maxWear = Math.max(...state.tyres.wear);
    if (maxWear >= 70 && !this.notifiedTyreThresholds.has(70)) {
      this.notifiedTyreThresholds.add(70);
      const cooldown = this.cooldownManager.canSpeak('STRATEGIC', 'TYRE_WEAR_70', currentLap);
      if (cooldown.allowed) {
        return {
          shouldTriggerGemini: true,
          reason: 'Pneus muito desgastados (>70%)',
          priority: 'STRATEGIC',
          context: this.buildContext('TYRE_WEAR_CRITICAL', 'STRATEGIC', state, `Desgaste de pneus em ${maxWear.toFixed(0)}%`)
        };
      }
    } else if (maxWear >= 50 && !this.notifiedTyreThresholds.has(50)) {
      this.notifiedTyreThresholds.add(50);
      const cooldown = this.cooldownManager.canSpeak('STRATEGIC', 'TYRE_WEAR_50', currentLap);
      if (cooldown.allowed) {
        return {
          shouldTriggerGemini: true,
          reason: 'Pneus atingiram 50% de desgaste',
          priority: 'STRATEGIC',
          context: this.buildContext('TYRE_WEAR_WARNING', 'STRATEGIC', state, `Pneus chegaram a 50% de desgaste`)
        };
      }
    }

    // 3. Momento de silêncio longo / Humor (Claudinho Ronaldo descontraído)
    const secondsSinceLast = this.cooldownManager.getSecondsSinceLastSpeech();
    if (secondsSinceLast >= this.config.cooldown.funCooldownSeconds && state.car.speed > 100) {
      const cooldown = this.cooldownManager.canSpeak('FUN', 'CALM_RACE', currentLap);
      if (cooldown.allowed) {
        return {
          shouldTriggerGemini: true,
          reason: 'Período prolongado de calmaria',
          priority: 'FUN',
          context: this.buildContext('CALM_RACE', 'FUN', state, 'Corrida estável e tranquila')
        };
      }
    }

    return { shouldTriggerGemini: false, reason: 'Sem eventos novos elegíveis', priority: 'INFORMATIONAL' };
  }

  /**
   * Confirma ao CooldownManager que a mensagem foi executada no rádio.
   */
  public onMessageSpoken(output: RadioMessageOutput, eventKey: string): void {
    this.cooldownManager.recordSpeech(output.priority, eventKey, this.lastObservedLap);
  }

  private buildContext(
    event: string,
    priority: RadioPriority,
    state: RaceState,
    detail: string
  ): GeminiRaceContext {
    const maxWear = Math.max(...state.tyres.wear);
    const compoundName = state.tyres.compound ? String(state.tyres.compound) : 'MÉDIO';

    return {
      event,
      priority,
      lap: state.timing.currentLap || 1,
      totalLaps: state.timing.totalLaps || 50,
      position: state.timing.carPosition || 1,
      driverName: this.config.personality.driverName,
      engineerName: this.config.personality.name,
      speedKmH: Math.round(state.car.speed || 0),
      gapAheadSeconds: state.timing.deltaToCarInFrontMS ? Number((state.timing.deltaToCarInFrontMS / 1000).toFixed(1)) : undefined,
      tyreCompound: compoundName,
      maxTyreWearPercent: Math.round(maxWear),
      safetyCarStatus: state.session.safetyCarStatus !== SafetyCarStatus.None ? 'ATIVO' : 'NENHUM',
      damageDescription: detail,
      additionalDetail: detail
    };
  }

  public reset(): void {
    this.cooldownManager.reset();
    this.previousPosition = 0;
    this.notifiedTyreThresholds.clear();
  }
}
