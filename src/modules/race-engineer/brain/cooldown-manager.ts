import { RadioPriority } from './types';
import { CooldownConfig } from '../config/engineer-config';

export class CooldownManager {
  private lastSpokenTimestamp: number = 0;
  private lastSpokenLap: number = -1;
  private routineCountThisLap: number = 0;
  private lastSpokenEventTypes: Map<string, number> = new Map(); // Event -> timestamp
  private lastSpokenMessageHash: string = '';

  constructor(private config: CooldownConfig) {}

  /**
   * Avalia se uma mensagem com determinada prioridade e tipo de evento tem permissão para ser gerada.
   */
  public canSpeak(priority: RadioPriority, eventKey: string, currentLap: number): { allowed: boolean; reason: string } {
    const now = Date.now();

    // 1. Prioridade CRITICAL ignora limites normais de volta e cooldowns longos
    if (priority === 'CRITICAL') {
      const lastSameEventTime = this.lastSpokenEventTypes.get(eventKey) || 0;
      // Evita repetição em spam imediato do mesmo evento crítico em menos de 8 segundos
      if (now - lastSameEventTime < 8000) {
        return { allowed: false, reason: `Evento crítico ${eventKey} recente (<8s)` };
      }
      return { allowed: true, reason: 'Prioridade CRITICAL autorizada imediatamente' };
    }

    // 2. Reseta contador de rotina caso tenha mudado de volta
    if (currentLap !== this.lastSpokenLap) {
      this.lastSpokenLap = currentLap;
      this.routineCountThisLap = 0;
    }

    // 3. Verifica limite de mensagens de rotina por volta
    if (this.routineCountThisLap >= this.config.maxRoutineMessagesPerLap) {
      // Prioridade HIGH ainda pode furar se o intervalo mínimo de tempo foi respeitado
      if (priority !== 'HIGH') {
        return { allowed: false, reason: `Limite de mensagens de rotina atingido na volta ${currentLap}` };
      }
    }

    // 4. Intervalo mínimo de tempo geral entre mensagens
    const secondsSinceLast = (now - this.lastSpokenTimestamp) / 1000;
    if (secondsSinceLast < this.config.minSecondsBetweenMessages) {
      return {
        allowed: false,
        reason: `Aguardando cooldown geral (${secondsSinceLast.toFixed(0)}s < ${this.config.minSecondsBetweenMessages}s)`
      };
    }

    // 5. Cooldown para mensagens de humor / silêncio
    if (priority === 'FUN') {
      if (secondsSinceLast < this.config.funCooldownSeconds) {
        return { allowed: false, reason: `Silêncio insuficiente para mensagem descontraída (< ${this.config.funCooldownSeconds}s)` };
      }
    }

    // 6. Deduplicação do mesmo tipo de evento recente (ex: mesmo rival chegando)
    const lastTimeThisEvent = this.lastSpokenEventTypes.get(eventKey) || 0;
    if (now - lastTimeThisEvent < 45000) { // 45 segundos para o mesmo tipo de evento
      return { allowed: false, reason: `Evento ${eventKey} já comunicado recentemente (<45s)` };
    }

    return { allowed: true, reason: 'Cooldown liberado' };
  }

  /**
   * Registra que uma mensagem foi transmitida com sucesso.
   */
  public recordSpeech(priority: RadioPriority, eventKey: string, currentLap: number): void {
    const now = Date.now();
    this.lastSpokenTimestamp = now;
    this.lastSpokenLap = currentLap;
    if (priority !== 'CRITICAL') {
      this.routineCountThisLap++;
    }
    this.lastSpokenEventTypes.set(eventKey, now);
  }

  /**
   * Tempo em segundos desde a última fala
   */
  public getSecondsSinceLastSpeech(): number {
    if (this.lastSpokenTimestamp === 0) return 9999;
    return (Date.now() - this.lastSpokenTimestamp) / 1000;
  }

  public reset(): void {
    this.lastSpokenTimestamp = 0;
    this.lastSpokenLap = -1;
    this.routineCountThisLap = 0;
    this.lastSpokenEventTypes.clear();
    this.lastSpokenMessageHash = '';
  }
}
