/**
 * Cockpit Theme System — useCockpitTheme hook
 *
 * Hook React que retorna o tema ativo com base no estado de telemetria.
 * Usa useMemo internamente para evitar recálculo a cada frame de RPM/speed.
 *
 * O tema só é recalculado quando os campos que realmente afetam o tema mudam
 * (flags, safety car, pit, ERS mode, DRS, weather) — não a cada update de RPM.
 */

import { useMemo } from 'react';
import { CockpitTelemetryState } from '@f1-dash/telemetry-core';
import { CockpitTheme } from './types';
import { getCockpitTheme } from './getCockpitTheme';

/**
 * Hook que retorna o tema visual ativo para o estado de telemetria fornecido.
 *
 * @param telemetry - Estado atual da telemetria
 * @returns CockpitTheme com todas as configurações visuais
 *
 * @example
 * // No CockpitScreen:
 * const theme = useCockpitTheme(telemetry);
 * // Em seguida, passe theme para os componentes filhos como prop
 */
export function useCockpitTheme(telemetry: CockpitTelemetryState): CockpitTheme {
  return useMemo(
    () => getCockpitTheme(telemetry),
    [
      // Apenas os campos que afetam o tema — NÃO incluir RPM, speed, throttle, brake
      telemetry.isRedFlagActive,
      telemetry.safetyCarStatus,
      telemetry.pitLimiterActive,
      telemetry.pitStatus,
      telemetry.ersDeployMode,
      telemetry.drsActive,
      telemetry.weather,
      telemetry.lastLapTimeInMS,
      telemetry.bestLapTimeInMS,
      telemetry.overtakeActive,
      telemetry.overtakeAvailable,
      telemetry.activeAeroMode,
      telemetry.activeAeroAvailable,
    ]
  );
}
