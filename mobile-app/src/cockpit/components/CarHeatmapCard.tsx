/**
 * CarHeatmapCard — Card inline de dano do carro
 *
 * Exibe o SVG top-down parametrizado do carro com zonas coloridas
 * por nível de dano, mais colunas de barras laterais para desgaste
 * e dano detalhado. Substituiu o modal DamageHeatmap na visão principal.
 *
 * Layout:
 *   [Desgaste gauges] [CarTopDownSvg] [Dano gauges]
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CockpitTheme } from '../theme/types';
import { CarTopDownSvg } from './CarTopDownSvg';
import { MiniGaugeBar } from './MiniGaugeBar';
import { getDamageColor } from '../utils/getDamageColor';

interface CarHeatmapCardProps {
  // Dados de dano (Packet 10)
  frontLeftWingDamage: number;
  frontRightWingDamage: number;
  rearWingDamage: number;
  floorDamage: number;
  diffuserDamage: number;
  sidepodDamage: number;
  gearBoxDamage: number;
  engineDamage: number;
  // Dados de desgaste (também Packet 10)
  tyresWear: [number, number, number, number]; // [RL, RR, FL, FR]
  // Tema
  theme: CockpitTheme;
}

export const CarHeatmapCard: React.FC<CarHeatmapCardProps> = memo(({
  frontLeftWingDamage,
  frontRightWingDamage,
  rearWingDamage,
  floorDamage,
  diffuserDamage,
  sidepodDamage,
  gearBoxDamage,
  engineDamage,
  tyresWear,
  theme,
}) => {
  // Status geral de dano
  const maxDamage = Math.max(
    frontLeftWingDamage,
    frontRightWingDamage,
    rearWingDamage,
    floorDamage,
    engineDamage,
    gearBoxDamage,
  );

  const statusColor = getDamageColor(maxDamage);
  const statusLabel =
    maxDamage > 50 ? 'DANO CRÍTICO' :
    maxDamage > 20 ? 'DANO MODERADO' :
    maxDamage > 0  ? 'DESGASTE LEVE' :
    'OK';

  return (
    <View style={[styles.container, { borderColor: theme.cardBorder }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.sectionLabel}>DANO / DESGASTE</Text>
        <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
      </View>

      {/* Corpo principal */}
      <View style={styles.body}>
        {/* Coluna esquerda: Desgaste dos pneus */}
        <View style={styles.gaugesColumn}>
          <Text style={styles.columnLabel}>DESGASTE</Text>
          <MiniGaugeBar value={tyresWear[2] ?? 0} type="wear" label="DE" />
          <MiniGaugeBar value={tyresWear[3] ?? 0} type="wear" label="DD" />
          <MiniGaugeBar value={tyresWear[0] ?? 0} type="wear" label="TE" />
          <MiniGaugeBar value={tyresWear[1] ?? 0} type="wear" label="TD" />
        </View>

        {/* SVG do carro no centro */}
        <CarTopDownSvg
          frontLeftWing={frontLeftWingDamage}
          frontRightWing={frontRightWingDamage}
          rearWing={rearWingDamage}
          floor={floorDamage}
          diffuser={diffuserDamage}
          sidepod={sidepodDamage}
          gearBox={gearBoxDamage}
          engine={engineDamage}
          width={100}
          height={168}
        />

        {/* Coluna direita: Dano dos componentes */}
        <View style={styles.gaugesColumn}>
          <Text style={styles.columnLabel}>DANO</Text>
          <MiniGaugeBar value={Math.max(frontLeftWingDamage, frontRightWingDamage)} type="damage" label="ASA F" />
          <MiniGaugeBar value={rearWingDamage} type="damage" label="ASA T" />
          <MiniGaugeBar value={floorDamage} type="damage" label="PISO" />
          <MiniGaugeBar value={Math.max(engineDamage, gearBoxDamage)} type="damage" label="MOTOR" />
        </View>
      </View>

      {/* Legenda de status pneus compacta */}
      <View style={styles.tyresFooter}>
        <Text style={styles.tyresLabel}>STATUS PNEUS</Text>
        <View style={styles.tyresGrid}>
          {[
            { pos: 'DE', val: tyresWear[2] ?? 0 },
            { pos: 'DD', val: tyresWear[3] ?? 0 },
            { pos: 'TE', val: tyresWear[0] ?? 0 },
            { pos: 'TD', val: tyresWear[1] ?? 0 },
          ].map(({ pos, val }) => (
            <View key={pos} style={styles.tyreChip}>
              <Text style={styles.tyreChipPos}>{pos}</Text>
              <Text style={[styles.tyreChipVal, { color: getDamageColor(val) }]}>
                {(10 - Math.floor(val / 10))}/10
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
});

CarHeatmapCard.displayName = 'CarHeatmapCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0c0e17',
    borderWidth: 1,
    borderRadius: 10,
    padding: 8,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
  },
  gaugesColumn: {
    alignItems: 'center',
    gap: 6,
  },
  columnLabel: {
    color: '#475569',
    fontSize: 6,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tyresFooter: {
    borderTopWidth: 1,
    borderTopColor: '#1e2436',
    paddingTop: 5,
    gap: 3,
  },
  tyresLabel: {
    color: '#475569',
    fontSize: 7,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  tyresGrid: {
    flexDirection: 'row',
    gap: 4,
  },
  tyreChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f1118',
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#1e2436',
  },
  tyreChipPos: {
    color: '#64748b',
    fontSize: 7,
    fontWeight: '700',
  },
  tyreChipVal: {
    fontSize: 8,
    fontWeight: '800',
  },
});
