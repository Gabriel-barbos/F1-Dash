/**
 * TimingCard — Card de Posicionamento e Tempos
 *
 * Layout fiel às referências:
 * - Topo: P3 + LAP 12/56
 * - Meio: ATUAL (0:56.234) + Delta (-0.247 vs. melhor)
 * - Base: LAST LAP (1:28.456) + BEST LAP (1:27.891)
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CockpitTheme } from '../theme/types';

interface TimingCardProps {
  position: number;
  currentLap: number;
  totalLaps: number;
  currentLapTimeMS: number;
  lastLapTimeMS: number;
  bestLapTimeMS: number;
  deltaFrontMS: number;
  sector1TimeMS: number;
  sector2TimeMS: number;
  currentSector: number;
  lapInvalid: boolean;
  theme: CockpitTheme;
}

function formatLapTime(ms: number): string {
  if (!ms || ms <= 0 || ms > 3_600_000 || isNaN(ms)) return '--:--.---';
  const mins = Math.floor(ms / 60_000);
  const secs = Math.floor((ms % 60_000) / 1_000);
  const millis = Math.floor(ms % 1_000);
  return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
}

export const TimingCard: React.FC<TimingCardProps> = memo(({
  position,
  currentLap,
  totalLaps,
  currentLapTimeMS,
  lastLapTimeMS,
  bestLapTimeMS,
  deltaFrontMS,
  lapInvalid,
  theme,
}) => {
  const hasDelta = deltaFrontMS !== 0 && !isNaN(deltaFrontMS);
  const isDeltaNegative = deltaFrontMS <= 0;
  const deltaFormatted = !hasDelta
    ? '--'
    : deltaFrontMS > 0
    ? `+${(deltaFrontMS / 1000).toFixed(3)}`
    : `${(deltaFrontMS / 1000).toFixed(3)}`;

  const deltaColor = !hasDelta ? '#6b7280' : isDeltaNegative ? '#22c55e' : '#ef4444';
  const displayPosition = position > 0 && position <= 24 ? `P${position}` : 'P--';

  return (
    <View style={[styles.container, { borderColor: theme.cardBorder, backgroundColor: theme.background.secondary }]}>
      {/* Linha 1: Posição e Volta */}
      <View style={styles.topRow}>
        <Text style={styles.positionText}>{displayPosition}</Text>
        <Text style={styles.lapText}>
          LAP {currentLap > 0 ? currentLap : '--'}/{totalLaps > 0 ? totalLaps : '--'}
        </Text>
      </View>

      {/* Linha 2: Tempo Atual e Delta vs. Melhor */}
      <View style={styles.currentTimingRow}>
        <View>
          <Text style={styles.sectionLabel}>ATUAL</Text>
          <Text style={[styles.currentTimeText, lapInvalid && styles.invalidText]}>
            {formatLapTime(currentLapTimeMS)}
          </Text>
        </View>

        <View style={styles.deltaBox}>
          <Text style={[styles.deltaValue, { color: deltaColor }]}>
            {deltaFormatted}
          </Text>
          <Text style={[styles.deltaSub, { color: deltaColor }]}>vs. melhor</Text>
        </View>
      </View>

      {/* Linha 3: Last Lap e Best Lap */}
      <View style={styles.bottomTimingRow}>
        <View>
          <Text style={styles.sectionLabel}>LAST LAP</Text>
          <Text style={styles.historyLapTime}>
            {formatLapTime(lastLapTimeMS)}
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end' }}>
          <Text style={[styles.sectionLabel, { color: '#c084fc' }]}>BEST LAP</Text>
          <Text style={[styles.historyLapTime, { color: '#c084fc' }]}>
            {formatLapTime(bestLapTimeMS)}
          </Text>
        </View>
      </View>
    </View>
  );
});

TimingCard.displayName = 'TimingCard';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0c14',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    width: '100%',
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 4,
  },
  positionText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
  },
  lapText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  currentTimingRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 1,
    textTransform: 'uppercase',
  },
  currentTimeText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  invalidText: {
    color: '#ef4444',
  },
  deltaBox: {
    alignItems: 'flex-end',
  },
  deltaValue: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0.5,
    fontVariant: ['tabular-nums'],
  },
  deltaSub: {
    fontSize: 7.5,
    fontWeight: '700',
  },
  bottomTimingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
    paddingTop: 6,
  },
  historyLapTime: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
});
