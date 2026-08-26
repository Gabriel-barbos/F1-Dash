import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ERSDeployMode } from '../core/models/car-status';
import { Formatters } from '../core/utils/formatters';

interface ERSWidgetProps {
  ersPercentage: number;
  ersDeployMode: ERSDeployMode;
  fuelInTank: number;
  fuelRemainingLaps: number;
}

export const ERSWidget: React.FC<ERSWidgetProps> = ({
  ersPercentage,
  ersDeployMode,
  fuelInTank,
  fuelRemainingLaps
}) => {
  const modeName = Formatters.getErsModeName(ersDeployMode);
  const isOvertake = ersDeployMode === ERSDeployMode.Overtake;

  return (
    <View style={styles.container}>
      {/* ERS Header & Modo */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>⚡ ERS</Text>
        <View
          style={[
            styles.modeBadge,
            isOvertake ? styles.modeOvertake : styles.modeNormal
          ]}
        >
          <Text
            style={[
              styles.modeText,
              isOvertake ? styles.modeTextOvertake : styles.modeTextNormal
            ]}
          >
            {modeName}
          </Text>
        </View>
      </View>

      {/* Barra de Bateria ERS */}
      <View style={styles.batteryTrack}>
        <View
          style={[
            styles.batteryFill,
            { width: `${Math.min(100, Math.max(0, ersPercentage))}%` },
            isOvertake ? styles.batteryOvertake : styles.batteryNormal
          ]}
        />
      </View>
      <Text style={styles.batteryValue}>{ersPercentage.toFixed(0)}%</Text>

      {/* Combustível */}
      <View style={styles.fuelSection}>
        <Text style={styles.fuelTitle}>⛽ FUEL</Text>
        <View style={styles.fuelValuesRow}>
          <Text style={styles.fuelMain}>{fuelInTank.toFixed(1)} kg</Text>
          <Text style={styles.fuelSub}>
            ({fuelRemainingLaps >= 0 ? '+' : ''}
            {fuelRemainingLaps.toFixed(1)} v)
          </Text>
        </View>
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
    minWidth: 150
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  title: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '800'
  },
  modeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  modeNormal: {
    backgroundColor: '#1e293b'
  },
  modeOvertake: {
    backgroundColor: '#f59e0b'
  },
  modeText: {
    fontSize: 10,
    fontWeight: '800'
  },
  modeTextNormal: {
    color: '#38bdf8'
  },
  modeTextOvertake: {
    color: '#000000'
  },
  batteryTrack: {
    height: 10,
    backgroundColor: '#27272a',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 4
  },
  batteryFill: {
    height: '100%',
    borderRadius: 5
  },
  batteryNormal: {
    backgroundColor: '#0ea5e9'
  },
  batteryOvertake: {
    backgroundColor: '#f59e0b'
  },
  batteryValue: {
    color: '#e4e4e7',
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: 8
  },
  fuelSection: {
    borderTopWidth: 1,
    borderTopColor: '#27272a',
    paddingTop: 6
  },
  fuelTitle: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700'
  },
  fuelValuesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  fuelMain: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800'
  },
  fuelSub: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '600'
  }
});
