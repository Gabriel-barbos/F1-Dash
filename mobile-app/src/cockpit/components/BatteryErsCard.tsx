/**
 * BatteryErsCard — Card de Bateria e ERS
 *
 * Layout ajustado:
 * - Topo: "BATERIA" na esquerda e "78%" no canto superior direito
 * - Badge em pílula: [ ⚡ BOOST ON ] (azul) ou [ ERS DISPONÍVEL ] (amarelo)
 * - Barra de carga bem espessa e arredondada (22px de altura)
 * - Cores preservadas independentemente do tema:
 *     * Boost ativo: Azul (#3b82f6)
 *     * Normal: Amarelo (#eab308 / #facc15)
 * - Subtítulo: 2.1 MJ / 4.0 MJ abaixo da barra
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { CockpitTheme } from '../theme/types';

interface BatteryErsCardProps {
  batteryPercent: number;
  ersStoreEnergy: number;
  ersDeployedThisLap: number;
  ersHarvestedThisLap: number;
  boostActive: boolean;
  theme: CockpitTheme;
}

const ERS_MAX_ENERGY = 4_000_000; // 4.0 MJ

const joulesToMJ = (j: number): string => (j / 1_000_000).toFixed(1);

export const BatteryErsCard: React.FC<BatteryErsCardProps> = memo(({
  batteryPercent,
  ersStoreEnergy,
  boostActive,
  theme,
}) => {
  const clampedPercent = Math.max(0, Math.min(100, batteryPercent));
  const ersAvailableMJ = joulesToMJ(ersStoreEnergy);
  const ersMaxMJ = joulesToMJ(ERS_MAX_ENERGY);

  // Cores fixas da bateria: Azul com boost ativo, Amarelo no normal
  const primaryBatteryColor = boostActive ? '#3b82f6' : '#eab308';
  const batteryGlowColor = boostActive ? 'rgba(59, 130, 246, 0.45)' : 'rgba(234, 179, 8, 0.45)';
  const badgeBgColor = boostActive ? 'rgba(59, 130, 246, 0.18)' : 'rgba(234, 179, 8, 0.14)';

  return (
    <View style={[styles.container, { borderColor: theme.cardBorder }]}>
      {/* Topo: BATERIA na esquerda e % no canto superior direito */}
      <View style={styles.topRow}>
        <Text style={styles.titleLabel}>BATERIA</Text>
        <Text style={styles.percentText}>{clampedPercent.toFixed(0)}%</Text>
      </View>

      {/* Badge ERS / BOOST */}
      {boostActive ? (
        <View style={[styles.badgePill, { borderColor: '#3b82f6', backgroundColor: badgeBgColor }]}>
          <Zap size={11} color="#3b82f6" strokeWidth={3} />
          <Text style={[styles.badgeText, { color: '#3b82f6' }]}>BOOST ON</Text>
        </View>
      ) : (
        <View style={[styles.badgePill, { borderColor: '#eab308', backgroundColor: badgeBgColor }]}>
          <Text style={[styles.badgeText, { color: '#eab308' }]}>ERS DISPONÍVEL</Text>
        </View>
      )}

      {/* Barra de carga BEM GROSSA (22px) */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${clampedPercent}%`,
              backgroundColor: primaryBatteryColor,
              shadowColor: primaryBatteryColor,
            },
          ]}
        />
      </View>

      {/* Subtítulo MJ na direita */}
      <Text style={styles.mjLabel}>
        {ersAvailableMJ} MJ / {ersMaxMJ} MJ
      </Text>
    </View>
  );
});

BatteryErsCard.displayName = 'BatteryErsCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0c14',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  percentText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 3.5,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 8,
    alignSelf: 'flex-start',
    minWidth: 110,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  barTrack: {
    height: 42,
    backgroundColor: '#121624',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#1e2436',
    overflow: 'hidden',
    justifyContent: 'center',
    padding: 2,
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 10,
    elevation: 6,
  },
  mjLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '700',
    alignSelf: 'flex-end',
    marginTop: 4,
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
});
