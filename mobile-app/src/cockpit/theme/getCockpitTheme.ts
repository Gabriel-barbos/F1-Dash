/**
 * Cockpit Theme System — getCockpitTheme
 *
 * Função pura que determina o tema visual ativo baseado no estado atual
 * da telemetria. Usa um sistema de prioridade explícito — sem if/else cascadeado.
 *
 * IMPORTANTE: Esta função não tem efeitos colaterais e não acessa nenhum store.
 * Deve ser chamada com useMemo para evitar recálculo a cada frame de telemetria.
 */

import { CockpitTelemetryState } from '../../core/state/telemetry-state';
import { SafetyCarStatus, Weather } from '../../core/models/session';
import { PitStatus } from '../../core/models/lap-data';
import { ERSDeployMode } from '../../core/models/car-status';
import { CockpitTheme, CockpitStateKey } from './types';
import { COCKPIT_THEMES } from './cockpitThemes';

/**
 * Determina qual CockpitStateKey está ativo com base no estado atual.
 *
 * A prioridade é determinada pelo enum CockpitStateKey (menor valor = maior prioridade).
 * Múltiplos estados podem ser verdadeiros ao mesmo tempo; o de maior prioridade vence.
 */
function determineCockpitState(state: CockpitTelemetryState): CockpitStateKey {
  // P1 — Bandeira Vermelha (sessão paralisada)
  if (state.isRedFlagActive) {
    return CockpitStateKey.RED_FLAG;
  }

  // P2 — Safety Car completo na pista
  if (state.safetyCarStatus === SafetyCarStatus.Full) {
    return CockpitStateKey.SAFETY_CAR;
  }

  // P3 — Virtual Safety Car
  if (state.safetyCarStatus === SafetyCarStatus.Virtual) {
    return CockpitStateKey.VSC;
  }

  // P4 — Formation Lap (Safety Car de largada)
  if (state.safetyCarStatus === SafetyCarStatus.FormationLap) {
    return CockpitStateKey.FORMATION_LAP;
  }

  // P5 — Pit Lane (limiter ativo, status de pit ou em área de pit)
  if (
    state.pitLimiterActive ||
    state.pitStatus === PitStatus.Pitting ||
    state.pitStatus === PitStatus.InPitArea
  ) {
    return CockpitStateKey.PIT_LANE;
  }

  // P6 — Modo Overtake (ERS Deploy Mode = Overtake)
  if (state.ersDeployMode === ERSDeployMode.Overtake) {
    return CockpitStateKey.OVERTAKE;
  }

  // P7 — Volta mais rápida (heurística local: lastLap foi o melhor)
  // Só válido se lastLapTimeInMS > 0 e bestLapTimeInMS > 0
  if (
    state.lastLapTimeInMS > 0 &&
    state.bestLapTimeInMS > 0 &&
    state.lastLapTimeInMS === state.bestLapTimeInMS
  ) {
    return CockpitStateKey.FASTEST_LAP;
  }

  // P8 — Modo Reta (DRS ativo — melhor proxy para "straight mode" disponível)
  if (state.drsActive) {
    return CockpitStateKey.STRAIGHT_MODE;
  }

  // P9 — Pista Molhada (chuva leve ou mais)
  if (
    state.weather === Weather.LightRain ||
    state.weather === Weather.HeavyRain ||
    state.weather === Weather.Storm
  ) {
    return CockpitStateKey.WET_TRACK;
  }

  // P10 — Normal
  return CockpitStateKey.NORMAL;
}

/**
 * Retorna o tema visual ativo para o estado atual da telemetria.
 *
 * @param state - Estado atual da telemetria (CockpitTelemetryState)
 * @returns CockpitTheme com todas as cores, labels e configurações visuais
 *
 * @example
 * // Dentro de useMemo no CockpitScreen:
 * const theme = useMemo(
 *   () => getCockpitTheme(telemetry),
 *   [
 *     telemetry.isRedFlagActive,
 *     telemetry.safetyCarStatus,
 *     telemetry.pitLimiterActive,
 *     telemetry.pitStatus,
 *     telemetry.ersDeployMode,
 *     telemetry.drsActive,
 *     telemetry.weather,
 *     telemetry.lastLapTimeInMS,
 *     telemetry.bestLapTimeInMS,
 *   ]
 * );
 */
export function getCockpitTheme(state: CockpitTelemetryState): CockpitTheme {
  const key = determineCockpitState(state);
  return COCKPIT_THEMES[key];
}

/**
 * Retorna apenas o CockpitStateKey ativo, sem o tema completo.
 * Útil para comparações leves.
 */
export function getCockpitStateKey(state: CockpitTelemetryState): CockpitStateKey {
  return determineCockpitState(state);
}

/**
 * Lista das dependências do estado que afetam o tema.
 * Use esta lista para construir o array de deps do useMemo.
 */
export const COCKPIT_THEME_DEPS = [
  'isRedFlagActive',
  'safetyCarStatus',
  'pitLimiterActive',
  'pitStatus',
  'ersDeployMode',
  'drsActive',
  'weather',
  'lastLapTimeInMS',
  'bestLapTimeInMS',
] as const satisfies ReadonlyArray<keyof CockpitTelemetryState>;
