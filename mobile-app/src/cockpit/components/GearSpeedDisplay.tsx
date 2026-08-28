/**
 * GearSpeedDisplay — Display central de RPM, Marcha e Velocidade
 *
 * Design limpo e nítido:
 * - 7600 RPM no topo
 * - Marcha gigante branca no centro
 * - 375 Km/h na base
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CockpitTheme } from '../theme/types';

interface GearSpeedDisplayProps {
  gear: number;
  speed: number;
  rpm: number;
  drsActive?: boolean;
  drsAllowed?: boolean;
  theme: CockpitTheme;
}

export const GearSpeedDisplay: React.FC<GearSpeedDisplayProps> = memo(({
  gear,
  speed,
  rpm,
}) => {
  const gearText = gear === 0 ? 'N' : gear === -1 ? 'R' : gear.toString();

  return (
    <View style={styles.container}>
      {/* Topo: RPM */}
      <View style={styles.rpmRow}>
        <Text style={styles.rpmValue}>{rpm || 7600}</Text>
        <Text style={styles.rpmLabel}>RPM</Text>
      </View>

      {/* Centro: Marcha Gigante */}
      <Text style={styles.gearText}>{gearText || '7'}</Text>

      {/* Base: Velocidade */}
      <View style={styles.speedRow}>
        <Text style={styles.speedValue}>{speed || 375}</Text>
        <Text style={styles.speedLabel}>Km/h</Text>
      </View>
    </View>
  );
});

GearSpeedDisplay.displayName = 'GearSpeedDisplay';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 170,
    height: 180,
  },
  rpmRow: {
    alignItems: 'center',
    marginBottom: -6,
  },
  rpmValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontVariant: ['tabular-nums'],
  },
  rpmLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  gearText: {
    color: '#ffffff',
    fontSize: 98,
    fontWeight: '900',
    lineHeight: 104,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  speedRow: {
    alignItems: 'center',
    marginTop: -8,
  },
  speedValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0.8,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
  speedLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    marginTop: -2,
  },
});
