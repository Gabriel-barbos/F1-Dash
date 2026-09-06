/**
 * SpeedDisplay — Velocidade do Cockpit F1
 *
 * Exibição nítida com alinhamento tabular e tipografia esportiva:
 * - Numeral em destaque (ex: 283)
 * - Rótulo KM/H proporcional
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface SpeedDisplayProps {
  speed: number;
}

export const SpeedDisplay: React.FC<SpeedDisplayProps> = memo(({ speed }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.speedValue}>{speed ?? 0}</Text>
      <Text style={styles.speedLabel}>KM/H</Text>
    </View>
  );
});

SpeedDisplay.displayName = 'SpeedDisplay';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedValue: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 0.8,
    lineHeight: 36,
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  speedLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginTop: 2,
  },
});
