/**
 * CentralCockpit — Bloco Central do Cockpit
 *
 * - Topo: ShiftLightsBar (15 LEDs circulares com glow)
 * - Meio: Barra de Aceleração + GearSpeedDisplay + Barra de Freio
 * - Perfeitamente centralizado e balanceado
 */

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
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
