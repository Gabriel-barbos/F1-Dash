import { RaceState, INITIAL_RACE_STATE, CockpitTelemetryState, toCockpitTelemetryState } from './race-state';
import { RaceStateNormalizer } from './normalizer';
import { ParsedPacket } from '../parsers/parser-registry';
import { RaceEventBus } from '../events/race-event';

export type RaceStateListener = (state: RaceState) => void;

/**
 * Universal TelemetryStore (Singleton).
 * Gerenciador central de estado de telemetria compartilhado entre PC e Mobile.
 * Uma única implementação e uma única fonte de verdade.
 */
export class TelemetryStore {
  private static instance: TelemetryStore;
  private normalizer: RaceStateNormalizer;
  private listeners: Set<RaceStateListener> = new Set();
  private eventBus: RaceEventBus;

  private constructor() {
    this.eventBus = new RaceEventBus();
    this.normalizer = new RaceStateNormalizer(this.eventBus);
  }

  public static getInstance(): TelemetryStore {
    if (!TelemetryStore.instance) {
      TelemetryStore.instance = new TelemetryStore();
    }
    return TelemetryStore.instance;
  }

  public getState(): RaceState {
    return this.normalizer.getState();
  }

  public getCockpitState(): CockpitTelemetryState {
    return toCockpitTelemetryState(this.normalizer.getState());
  }

  public getEventBus(): RaceEventBus {
    return this.eventBus;
  }

  public processPacket(parsed: ParsedPacket | null): RaceState {
    const newState = this.normalizer.processPacket(parsed);
    this.notify();
    return newState;
  }

  public subscribe(listener: RaceStateListener): () => void {
    this.listeners.add(listener);
    listener(this.normalizer.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public reset(): void {
    this.normalizer.reset();
    this.notify();
  }

  private notify(): void {
    const state = this.normalizer.getState();
    for (const listener of this.listeners) {
      try {
        listener(state);
      } catch (err) {
        console.warn('[TelemetryStore] Erro ao notificar listener:', err);
      }
    }
  }
}
