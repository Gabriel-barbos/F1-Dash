import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ERSDeployMode } from '../core/models/car-status';

interface ErsWidgetProps {
  batteryPercent: number;
  deployMode: ERSDeployMode;
  overtakeActive?: boolean;
}

export const ErsWidget: React.FC<ErsWidgetProps> = ({
  batteryPercent,
  deployMode,
  overtakeActive = false
}) => {
  const modeName =
    overtakeActive || deployMode === ERSDeployMode.Overtake
      ? 'OVERTAKE'
      : deployMode === ERSDeployMode.Hotlap
      ? 'HOTLAP'
      : deployMode === ERSDeployMode.Medium
      ? '3'
      : 'NONE';

  const isOvertake = overtakeActive || deployMode === ERSDeployMode.Overtake;

  return (
    <View style={styles.container}>
      <Text style={styles.headerTitle}>BATTERY</Text>
      <View style={styles.percentRow}>
        <Text style={styles.percentText}>{batteryPercent.toFixed(0)}%</Text>
      </View>

      {/* Barra de Bateria */}
      <View style={styles.barTrack}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.max(0, Math.min(100, batteryPercent))}%`,
              backgroundColor: isOvertake ? '#eab308' : '#22c55e'
            }
          ]}
        />
      </View>

      {/* Modo ERS */}
      <View style={styles.modeContainer}>
        <Text style={styles.modeLabel}>ERS</Text>
        <Text style={[styles.modeValue, isOvertake && styles.modeOvertake]}>{modeName}</Text>
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
    minWidth: 100
  },
  headerTitle: {
    color: '#8b92a5',
    fontSize: 10,
    fontWeight: '700'
  },
  percentRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 4
  },
  percentText: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: '900'
  },
  barTrack: {
    height: 8,
    backgroundColor: '#1b1f2e',
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#282f47',
    marginBottom: 6
  },
  barFill: {
    height: '100%',
    borderRadius: 3
  },
  modeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2
  },
  modeLabel: {
    color: '#8b92a5',
    fontSize: 10,
    fontWeight: '600'
  },
  modeValue: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: 'bold'
  },
  modeOvertake: {
    color: '#eab308',
    fontWeight: '900'
  }
});