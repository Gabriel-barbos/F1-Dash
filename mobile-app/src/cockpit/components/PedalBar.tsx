/**
 * PedalBar — Barra vertical de aceleração e frenagem
 *
 * Design fiel à referência:
 * - Topo: 100% ou 0%
 * - Barra vertical espessa com preenchimento em gradiente/glow
 * - Base: ACELERAÇÃO ou FREIO
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PedalBarProps {
  value: number; // 0.0 a 1.0
  type: 'throttle' | 'brake';
}

export const PedalBar: React.FC<PedalBarProps> = memo(({ value, type }) => {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const isThrottle = type === 'throttle';
  const color = isThrottle ? '#22c55e' : '#ef4444';
  const label = isThrottle ? 'ACELERAÇÃO' : 'FREIO';

  return (
    <View style={styles.container}>
      <Text style={[styles.percentValue, { color }]}>{percent}%</Text>

      <View style={[styles.barTrack, { borderColor: '#1e2436' }]}>
        <View
          style={[
            styles.barFill,
            {
              height: `${percent}%`,
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        />
      </View>

      <Text style={styles.bottomLabel}>{label}</Text>
    </View>
  );
});

PedalBar.displayName = 'PedalBar';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
    width: 58,
  },
  percentValue: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  barTrack: {
    width: 22,
    height: 125,
    backgroundColor: '#0f121a',
    borderRadius: 6,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 1.5,
  },
  barFill: {
    width: '100%',
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 6,
  },
  bottomLabel: {
    color: '#64748b',
    fontSize: 7.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
});
