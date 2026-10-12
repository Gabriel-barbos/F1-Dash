/**
 * SpeedDisplay — Velocidade do Cockpit F1
 *
 * Exibição nítida com alinhamento tabular e tipografia de transmissão F1:
 * - Numeral em Titillium Bold Italic (ex: 283)
 * - Fio de acento + rótulo KM/H com tracking largo
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { F1Font } from '../../theme/typography';

interface SpeedDisplayProps {
  speed: number;
}

export const SpeedDisplay: React.FC<SpeedDisplayProps> = memo(({ speed }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.speedValue}>{Math.round(speed ?? 0)}</Text>
      <View style={styles.labelRow}>
        <View style={styles.accent} />
        <Text style={styles.speedLabel}>KM/H</Text>
        <View style={styles.accent} />
      </View>
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
    fontFamily: F1Font.boldItalic,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    textShadowColor: 'rgba(255, 255, 255, 0.2)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -2,
  },
  accent: {
    width: 14,
    height: 2,
    backgroundColor: '#E10600',
    transform: [{ skewX: '-14deg' }],
  },
  speedLabel: {
    color: '#7c869b',
    fontFamily: F1Font.semi,
    fontSize: 11,
    letterSpacing: 2.6,
    includeFontPadding: false,
  },
});
