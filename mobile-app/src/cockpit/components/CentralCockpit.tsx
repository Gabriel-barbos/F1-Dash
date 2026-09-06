/**
 * CentralCockpit — Bloco Central do Cockpit
 *
 * - Topo: ShiftLightsBar (15 LEDs circulares com glow)
 * - Meio: Barra de Aceleração + GearSpeedDisplay + Barra de Freio
 * - Perfeitamente centralizado e balanceado
 */

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ERSDeployMode } from '@f1-dash/telemetry-core';
import { CockpitTheme } from '../theme/types';
import { ShiftLightsBar } from './ShiftLightsBar';
import { GearSpeedDisplay } from './GearSpeedDisplay';
import { PedalBar } from './PedalBar';

interface CentralCockpitProps {
  gear: number;
  speed: number;
  rpm: number;
  maxRpm: number;
  revPercent: number;
  throttle: number;
  brake: number;
  drsActive: boolean;
  drsAllowed: boolean;
  is2026Regulations?: boolean;
  activeAeroMode?: number;
  activeAeroAvailable?: boolean;
  activeAeroActivationDistance?: number;
  overtakeActive?: boolean;
  overtakeAvailable?: boolean;
  overtakeActivationDistance?: number;
  ersDeployMode?: ERSDeployMode;
  theme: CockpitTheme;
}

export const CentralCockpit: React.FC<CentralCockpitProps> = memo(({
  gear,
  speed,
  rpm,
  revPercent,
  throttle,
  brake,
  drsActive,
  drsAllowed,
  is2026Regulations = false,
  activeAeroMode = 0,
  activeAeroAvailable = false,
  activeAeroActivationDistance = 0,
  overtakeActive = false,
  overtakeAvailable = false,
  overtakeActivationDistance = 0,
  ersDeployMode = ERSDeployMode.Medium,
  theme,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. LEDs de Shift Lights no topo */}
      <ShiftLightsBar
        revPercent={revPercent}
        palette={theme.shiftLights}
      />

      {/* 2. Coluna de Aceleração + Display de Marcha/Velocidade + Coluna de Freio */}
      <View style={styles.mainRow}>
        <PedalBar value={throttle} type="throttle" />

        <GearSpeedDisplay
          gear={gear}
          speed={speed}
          rpm={rpm}
          drsActive={drsActive}
          drsAllowed={drsAllowed}
          is2026Regulations={is2026Regulations}
          activeAeroMode={activeAeroMode}
          activeAeroAvailable={activeAeroAvailable}
          activeAeroActivationDistance={activeAeroActivationDistance}
          overtakeActive={overtakeActive}
          overtakeAvailable={overtakeAvailable}
          overtakeActivationDistance={overtakeActivationDistance}
          ersDeployMode={ersDeployMode}
          theme={theme}
        />

        <PedalBar value={brake} type="brake" />
      </View>
    </View>
  );
});

CentralCockpit.displayName = 'CentralCockpit';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
});
