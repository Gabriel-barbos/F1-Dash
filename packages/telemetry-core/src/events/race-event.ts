export type RaceEventType =
  | 'RACE_START'
  | 'CHEQUERED_FLAG'
  | 'FASTEST_LAP'
  | 'RETIREMENT'
  | 'DRS_ENABLED'
  | 'DRS_DISABLED'
  | 'SAFETY_CAR'
  | 'VSC'
  | 'RED_FLAG'
  | 'PIT_ENTRY'
  | 'PIT_EXIT'
  | 'PENALTY'
  | 'OVERTAKE'
  | 'SPEED_TRAP'
  | 'CAR_DAMAGE';

export interface RaceEvent<T = any> {
  id: string;
  type: RaceEventType;
  timestamp: number;
  sessionTime: number;
  frameId: number;
  data: T;
}

export type RaceEventListener = (event: RaceEvent) => void;

export class RaceEventBus {
  private listeners: Set<RaceEventListener> = new Set();
  private history: RaceEvent[] = [];
  private maxHistorySize = 100;

  public emit(event: RaceEvent): void {
    this.history.push(event);
    if (this.history.length > this.maxHistorySize) {
      this.history.shift();
    }

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch (err) {
        console.warn('[RaceEventBus] Erro ao disparar listener:', err);
      }
    }
  }

  public subscribe(listener: RaceEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getHistory(): RaceEvent[] {
    return [...this.history];
  }

  public clear(): void {
    this.history = [];
  }
}
