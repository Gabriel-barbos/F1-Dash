/**
 * RpmIndicator — Barra de LEDs de RPM Reativa & Suave
 *
 * 16 LEDs em formato de cápsula com halo de glow reativo:
 * - Resposta direta à rotação do motor
 * - Transição suave de iluminação por zonas de giro (Verde -> Laranja -> Roxo/Vermelho)
 * - Shift point (revPercent >= 96%): Efeito de pico esportivo sincronizado
 */

import React, { memo, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ShiftLightsPalette } from '../theme/types';

interface RpmIndicatorProps {
  revPercent: number;
  palette: ShiftLightsPalette;
  totalLeds?: number;
}

export const RpmIndicator: React.FC<RpmIndicatorProps> = memo(({
  revPercent,
  palette,
  totalLeds = 16,
}) => {
  const clamped = Math.max(0, Math.min(100, revPercent));
  const activeCount = Math.round((clamped / 100) * totalLeds);
  const isPeakShift = clamped >= 96;

  const leds = useMemo(() => {
    return Array.from({ length: totalLeds }).map((_, idx) => {
      const active = idx < activeCount;

      let color = '#151926'; // Inativo / desligado
      let glow = 'transparent';

      if (active) {
        if (isPeakShift) {
          color = palette.peak || '#ffffff';
          glow = palette.peak || '#ffffff';
        } else if (idx < Math.floor(totalLeds * 0.35)) {
          color = palette.low || '#22c55e';
          glow = palette.low || '#22c55e';
        } else if (idx < Math.floor(totalLeds * 0.70)) {
          color = palette.mid || '#f59e0b';
          glow = palette.mid || '#f59e0b';
        } else {
          color = palette.high || '#a855f7';
          glow = palette.high || '#a855f7';
        }
      }

      return {
        idx,
        active,
        color,
        glow,
      };
    });
  }, [activeCount, isPeakShift, palette, totalLeds]);

  return (
    <View style={styles.container}>
      {leds.map(({ idx, active, color, glow }) => (
        <View
          key={idx}
          style={[
            styles.led,
            {
              backgroundColor: color,
              borderColor: active ? color : '#1e2436',
              shadowColor: glow,
              shadowOpacity: active ? (isPeakShift ? 0.95 : 0.8) : 0,
              shadowRadius: active ? (isPeakShift ? 10 : 6) : 0,
              elevation: active ? 5 : 0,
            },
          ]}
        />
      ))}
    </View>
  );
});

RpmIndicator.displayName = 'RpmIndicator';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  led: {
    width: 13,
    height: 14,
    borderRadius: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
  },
});
