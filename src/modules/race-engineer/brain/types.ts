/**
 * Tipos e Interfaces do Engineer Brain
 * F1 Dash - Race Engineer
 */

export type RadioPriority = 'CRITICAL' | 'HIGH' | 'STRATEGIC' | 'INFORMATIONAL' | 'FUN';

export type RadioTone = 'urgent' | 'calm' | 'celebratory' | 'tactical' | 'humorous';

export interface GeminiRaceContext {
  event: string;
  priority: RadioPriority;
  lap: number;
  totalLaps: number;
  position: number;
  driverName: string;
  engineerName: string;
  speedKmH: number;
  gapAheadSeconds?: number;
  gapBehindSeconds?: number;
  rivalName?: string;
  tyreCompound?: string;
  maxTyreWearPercent?: number;
  safetyCarStatus?: string;
  flagStatus?: string;
  fuelDeltaLaps?: number;
  damageDescription?: string;
  additionalDetail?: string;
}

export interface RadioMessageOutput {
  shouldSpeak: boolean;
  message: string;
  tone: RadioTone;
  category: string;
  priority: RadioPriority;
  estimatedDurationMs?: number;
  audioBase64?: string;
  mimeType?: string;
}

export interface BrainDecision {
  shouldTriggerGemini: boolean;
  reason: string;
  priority: RadioPriority;
  context?: GeminiRaceContext;
}
