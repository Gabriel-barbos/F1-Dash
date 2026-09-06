/**
 * InputBars — Instrumentos Periféricos de Aceleração (ACC) e Frenagem (BRAKE)
 *
 * Barras verticais ultra-finas e discretas integradas à periferia do Center HUD:
 * - Quando não acionadas (0%): Traço sutil escuro, sem poluição
 * - Quando acionadas (>0%): Preenchimento rápido e luminoso
 * - ACC em verde (#22c55e), BRAKE em vermelho (#ef4444)
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface InputBarProps {
  value: number; // 0.0 a 1.0
  type: 'throttle' | 'brake';
  height?: number;
}

export const InputBar: React.FC<InputBarProps> = memo(({
  value,
  type,
  height = 110,
}) => {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);
  const isThrottle = type === 'throttle';
  const color = isThrottle ? '#22c55e' : '#ef4444';
  const label = isThrottle ? 'ACC' : 'BRK';
  const isActive = percent > 1;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: isActive ? color : '#475569' }]}>
        {label}
      </Text>

      <View style={[styles.track, { height, borderColor: isActive ? '#243048' : '#141824' }]}>
        <View
          style={[
            styles.fill,
            {
              height: `${percent}%`,
              backgroundColor: color,
              shadowColor: color,
              shadowOpacity: isActive ? 0.9 : 0,
              shadowRadius: isActive ? 6 : 0,
              elevation: isActive ? 4 : 0,
            },
          ]}
        />
      </View>

      <Text style={[styles.percent, { color: isActive ? '#cbd5e1' : '#334155' }]}>
        {percent}
      </Text>
    </View>
  );
});

InputBar.displayName = 'InputBar';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 3,
    width: 22,
  },
  label: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  track: {
    width: 7,
    backgroundColor: '#090b12',
    borderRadius: 3,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 0.5,
  },
  fill: {
    width: '100%',
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
  },
  percent: {
    fontSize: 7,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
