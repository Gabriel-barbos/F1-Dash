/**
 * MiniGaugeBar — Barra vertical pequena para desgaste e dano
 *
 * Componente reutilizável para mostrar valores percentuais
 * em formato de barra vertical compacta.
 * Usado nas colunas laterais do CarHeatmapCard.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getDamageColor, getTyreWearColor } from '../utils/getDamageColor';

interface MiniGaugeBarProps {
  /** Valor percentual (0–100) */
  value: number;
  /** Tipo de gauge — define a função de cor */
  type?: 'damage' | 'wear';
  /** Label acima da barra */
  label?: string;
}

export const MiniGaugeBar: React.FC<MiniGaugeBarProps> = memo(({
  value,
  type = 'damage',
  label,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const color = type === 'wear' ? getTyreWearColor(clampedValue) : getDamageColor(clampedValue);
  const fillPercent = type === 'wear' ? clampedValue : clampedValue;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.track}>
        <View
          style={[
            styles.fill,
            {
              height: `${fillPercent}%` as any,
              backgroundColor: color,
              shadowColor: color,
            },
          ]}
        />
      </View>
      <Text style={[styles.value, { color }]}>{clampedValue.toFixed(0)}%</Text>
    </View>
  );
});

MiniGaugeBar.displayName = 'MiniGaugeBar';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 2,
  },
  label: {
    color: '#64748b',
    fontSize: 6,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  track: {
    width: 10,
    height: 48,
    backgroundColor: '#181a24',
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#2b2f42',
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  fill: {
    width: '100%',
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 2,
  },
  value: {
    fontSize: 7,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
