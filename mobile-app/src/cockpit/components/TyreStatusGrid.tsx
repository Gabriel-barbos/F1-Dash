/**
 * TyreStatusGrid — Painel de Temperatura e Status dos Pneus
 *
 * Exibe as temperaturas (°C), pressões (PSI), composto e integridade dos 4 pneus
 * com layout motorsport moderno de alto contraste.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VisualTyreCompound } from '../../core/models/car-status';
import { CockpitTheme } from '../theme/types';

interface TyreStatusGridProps {
  compound: VisualTyreCompound;
  tyresAgeLaps: number;
  surfaceTemps: [number, number, number, number]; // [RL, RR, FL, FR]
  pressures: [number, number, number, number];
  wear: [number, number, number, number];
  theme: CockpitTheme;
}

interface CompoundConfig {
  letter: string;
  color: string;
  name: string;
}

function getCompoundConfig(compound: VisualTyreCompound): CompoundConfig {
  switch (compound) {
    case VisualTyreCompound.F1_Soft:
      return { letter: 'S', color: '#ef4444', name: 'SOFT' };
    case VisualTyreCompound.F1_Medium:
      return { letter: 'M', color: '#eab308', name: 'MEDIUM' };
    case VisualTyreCompound.F1_Inter:
      return { letter: 'I', color: '#22c55e', name: 'INTER' };
    case VisualTyreCompound.F1_Wet:
      return { letter: 'W', color: '#3b82f6', name: 'WET' };
    case VisualTyreCompound.F1_Hard:
    default:
      return { letter: 'H', color: '#ffffff', name: 'HARD' };
  }
}

function getTempColor(temp: number): string {
  if (temp < 80) return '#38bdf8';   // Frio
  if (temp <= 104) return '#22c55e'; // Ótimo
  if (temp <= 114) return '#f59e0b'; // Quente
  return '#ef4444';                  // Superaquecido
}

interface SingleTyreProps {
  pos: string;
  temp: number;
  psi: number;
  wearPct: number;
}

const SingleTyre: React.FC<SingleTyreProps> = memo(({ pos, temp, psi, wearPct }) => {
  const tempColor = getTempColor(temp);
  const lifeRemaining = Math.max(0, 10 - Math.floor(wearPct / 10));

  return (
    <View style={styles.tyreCard}>
      <View style={styles.tyreHeader}>
        <Text style={styles.tyrePos}>{pos}</Text>
        <Text style={styles.tyreLife}>{lifeRemaining}/10</Text>
      </View>

      <Text style={[styles.tyreTemp, { color: tempColor }]}>{temp}°C</Text>

      <View style={styles.tyreFooter}>
        <Text style={styles.tyrePsi}>{psi.toFixed(1)} PSI</Text>
        <Text style={styles.tyreWearPct}>{wearPct}% desg</Text>
      </View>
    </View>
  );
});

export const TyreStatusGrid: React.FC<TyreStatusGridProps> = memo(({
  compound,
  tyresAgeLaps,
  surfaceTemps,
  pressures,
  wear,
  theme,
}) => {
  const config = getCompoundConfig(compound);

  return (
    <View style={[styles.container, { borderColor: theme.cardBorder }]}>
      {/* Cabeçalho do Card */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Text style={styles.sectionTitle}>STATUS PNEUS</Text>
          <Text style={styles.sectionSubtitle}>TEMPERATURA & PRESSÃO</Text>
        </View>

        <View style={[styles.compoundPill, { borderColor: config.color }]}>
          <Text style={[styles.compoundLetter, { color: config.color }]}>{config.letter}</Text>
          <Text style={[styles.compoundName, { color: config.color }]}>{config.name}</Text>
          <Text style={styles.ageLaps}>({tyresAgeLaps || 1}V)</Text>
        </View>
      </View>

      {/* Grid 2x2 com os 4 pneus */}
      <View style={styles.grid}>
        <View style={styles.gridRow}>
          <SingleTyre
            pos="DE (FL)"
            temp={surfaceTemps[2] || 98}
            psi={pressures[2] || 23.8}
            wearPct={wear[2] || 18}
          />
          <SingleTyre
            pos="DD (FR)"
            temp={surfaceTemps[3] || 99}
            psi={pressures[3] || 23.9}
            wearPct={wear[3] || 21}
          />
        </View>

        <View style={styles.gridRow}>
          <SingleTyre
            pos="TE (RL)"
            temp={surfaceTemps[0] || 102}
            psi={pressures[0] || 24.1}
            wearPct={wear[0] || 25}
          />
          <SingleTyre
            pos="TD (RR)"
            temp={surfaceTemps[1] || 101}
            psi={pressures[1] || 24.0}
            wearPct={wear[1] || 23}
          />
        </View>
      </View>
    </View>
  );
});

TyreStatusGrid.displayName = 'TyreStatusGrid';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0c14',
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    width: 230,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1e2e',
    paddingBottom: 6,
  },
  titleGroup: {
    gap: 1,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 7.5,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  compoundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: '#101422',
  },
  compoundLetter: {
    fontSize: 10,
    fontWeight: '900',
  },
  compoundName: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  ageLaps: {
    color: '#64748b',
    fontSize: 7.5,
    fontWeight: '700',
  },
  grid: {
    gap: 8,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tyreCard: {
    flex: 1,
    backgroundColor: '#0f121d',
    borderWidth: 1,
    borderColor: '#1e2436',
    borderRadius: 8,
    padding: 7,
    gap: 2,
  },
  tyreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tyrePos: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  tyreLife: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '800',
  },
  tyreTemp: {
    fontSize: 18,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginVertical: 1,
  },
  tyreFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  tyrePsi: {
    color: '#cbd5e1',
    fontSize: 8,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  tyreWearPct: {
    color: '#64748b',
    fontSize: 7.5,
    fontWeight: '600',
  },
});
