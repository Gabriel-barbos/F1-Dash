/**
 * ShiftLightsBar — Barra de LEDs de RPM
 *
 * 15 LEDs circulares com halo de glow intenso,
 * sincronizados com a rotação do motor e o tema visual do cockpit.
 */

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ShiftLightsPalette } from '../theme/types';

interface ShiftLightsBarProps {
  revPercent: number;
  palette: ShiftLightsPalette;
  totalLeds?: number;
}

export const ShiftLightsBar: React.FC<ShiftLightsBarProps> = memo(({
  revPercent,
  palette,
  totalLeds = 15,
}) => {
  const clamped = Math.max(0, Math.min(100, revPercent));
  const activeCount = Math.round((clamped / 100) * totalLeds);
  const isShiftPeak = clamped >= 96;

  const getLedColor = (idx: number): string => {
    if (idx >= activeCount) return '#171924';
    if (isShiftPeak) return palette.peak;
    if (idx < 5) return palette.low;
    if (idx < 10) return palette.mid;
    return palette.high;
  };

  return (
    <View style={styles.container}>
      {Array.from({ length: totalLeds }).map((_, idx) => {
        const active = idx < activeCount;
        const color = getLedColor(idx);

        return (
          <View
            key={idx}
            style={[
              styles.led,
              {
                backgroundColor: color,
                shadowColor: active ? color : 'transparent',
                shadowOpacity: active ? 0.95 : 0,
                shadowRadius: 8,
                elevation: active ? 6 : 0,
              },
            ]}
          />
        );
      })}
    </View>
  );
});

ShiftLightsBar.displayName = 'ShiftLightsBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  led: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
