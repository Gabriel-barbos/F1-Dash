import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TimingWidgetProps {
  position: number;
  currentLap: number;
  totalLaps: number;
  currentLapTimeMS: number;
  lastLapTimeMS: number;
  deltaFrontMS: number;
}

export const TimingWidget: React.FC<TimingWidgetProps> = ({
  position,
  currentLap,
  totalLaps,
  currentLapTimeMS,
  lastLapTimeMS,
  deltaFrontMS
}) => {
  const formatTime = (ms: number) => {
    if (ms <= 0) return '--:--.---';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const millis = Math.floor(ms % 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}.${millis.toString().padStart(3, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <View style={styles.posBadge}>
          <Text style={styles.posText}>P{position || '-'}</Text>
          <Text style={styles.posLabel}>POS</Text>
        </View>
        <View style={styles.lapBadge}>
          <Text style={styles.lapText}>LAP {currentLap}/{totalLaps}</Text>
        </View>
      </View>

      <View style={styles.timeBox}>
        <Text style={styles.timeLabel}>CURRENT</Text>
        <Text style={styles.timeValue}>{formatTime(currentLapTimeMS)}</Text>
      </View>

      <View style={styles.bottomRow}>
        <View>
          <Text style={styles.subLabel}>LAST LAP</Text>
          <Text style={styles.subValue}>{formatTime(lastLapTimeMS)}</Text>
        </View>
        {deltaFrontMS !== 0 && (
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.subLabel}>DELTA</Text>
            <Text style={[styles.subValue, { color: deltaFrontMS > 0 ? '#ef4444' : '#22c55e' }]}>
              {deltaFrontMS > 0 ? `+${(deltaFrontMS / 1000).toFixed(3)}s` : `${(deltaFrontMS / 1000).toFixed(3)}s`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#10121a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#24283b',
    minWidth: 120
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  posBadge: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3
  },
  posText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900'
  },
  posLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700'
  },
  lapBadge: {
    backgroundColor: '#181b28',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#2b3149'
  },
  lapText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '700'
  },
  timeBox: {
    marginVertical: 4
  },
  timeLabel: {
    color: '#a855f7',
    fontSize: 9,
    fontWeight: '700'
  },
  timeValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4
  },
  subLabel: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '700'
  },
  subValue: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '700'
  }
});