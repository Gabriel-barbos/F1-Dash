import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ThrottleBrakeBarsProps {
  throttle: number; // 0.0 a 1.0
  brake: number;    // 0.0 a 1.0
}

export const ThrottleBrakeBars: React.FC<ThrottleBrakeBarsProps> = ({ throttle, brake }) => {
  const thrPercent = Math.round(Math.max(0, Math.min(1, throttle)) * 100);
  const brkPercent = Math.round(Math.max(0, Math.min(1, brake)) * 100);

  return (
    <View style={styles.container}>
      {/* Barra de Acelerador */}
      <View style={styles.barGroup}>
        <Text style={styles.label}>THROTTLE</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { height: ${thrPercent}%, backgroundColor: '#22c55e' }]} />
        </View>
        <Text style={styles.valueText}>{thrPercent}%</Text>
      </View>

      {/* Barra de Freio */}
      <View style={styles.barGroup}>
        <Text style={styles.label}>BRAKE</Text>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { height: ${brkPercent}%, backgroundColor: '#ef4444' }]} />
        </View>
        <Text style={styles.valueText}>{brkPercent}%</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  barGroup: {
    alignItems: 'center'
  },
  label: {
    color: '#8b92a5',
    fontSize: 9,
    fontWeight: '700',
    marginBottom: 4
  },
  barTrack: {
    width: 22,
    height: 76,
    backgroundColor: '#181a24',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#2b2f42'
  },
  barFill: {
    width: '100%',
    borderRadius: 2
  },
  valueText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 4
  }
});
