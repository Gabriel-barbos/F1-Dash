import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Formatters } from '../core/utils/formatters';

interface TimingWidgetProps {
  position: number;
  lapNumber: number;
  totalLaps: number;
  currentLapTimeInMS: number;
  lastLapTimeInMS: number;
  bestLapTimeInMS: number;
  deltaToLeaderInMS: number;
  deltaToFrontInMS: number;
}

export const TimingWidget: React.FC<TimingWidgetProps> = ({
  position,
  lapNumber,
  totalLaps,
  currentLapTimeInMS,
  lastLapTimeInMS,
  bestLapTimeInMS,
  deltaToLeaderInMS,
  deltaToFrontInMS
}) => {
  return (
    <View style={styles.container}>
      {/* Top row: Posição & Volta */}
      <View style={styles.topRow}>
        <View style={styles.positionBox}>
          <Text style={styles.posLabel}>POS</Text>
          <Text style={styles.posNumber}>P{position || 1}</Text>
        </View>
        <View style={styles.lapBox}>
          <Text style={styles.lapLabel}>VOLTA</Text>
          <Text style={styles.lapNumber}>
            {lapNumber || 1}
            {totalLaps > 0 ? `/${totalLaps}` : ''}
          </Text>
        </View>
      </View>

      {/* Tempos de volta */}
      <View style={styles.timesContainer}>
        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>ATUAL</Text>
          <Text style={[styles.timeValue, styles.currentTime]}>
            {Formatters.formatLapTime(currentLapTimeInMS)}
          </Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>ÚLTIMA</Text>
          <Text style={styles.timeValue}>
            {Formatters.formatLapTime(lastLapTimeInMS)}
          </Text>
        </View>

        <View style={styles.timeRow}>
          <Text style={styles.timeLabel}>MELHOR</Text>
          <Text style={[styles.timeValue, styles.bestTime]}>
            {Formatters.formatLapTime(bestLapTimeInMS)}
          </Text>
        </View>
      </View>

      {/* Deltas */}
      <View style={styles.deltasRow}>
        <Text style={styles.deltaText}>
          FRENTE: {Formatters.formatDelta(deltaToFrontInMS)}
        </Text>
        <Text style={styles.deltaText}>
          LÍDER: {Formatters.formatDelta(deltaToLeaderInMS)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#09090b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 10,
    minWidth: 180
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  positionBox: {
    alignItems: 'flex-start'
  },
  posLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '700'
  },
  posNumber: {
    color: '#eab308',
    fontSize: 22,
    fontWeight: '900'
  },
  lapBox: {
    alignItems: 'flex-end'
  },
  lapLabel: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '700'
  },
  lapNumber: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800'
  },
  timesContainer: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 6,
    marginBottom: 6
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  timeLabel: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '700'
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    fontFamily: 'monospace'
  },
  currentTime: {
    color: '#38bdf8'
  },
  bestTime: {
    color: '#a855f7'
  },
  deltasRow: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  deltaText: {
    color: '#71717a',
    fontSize: 9,
    fontWeight: '600'
  }
});
