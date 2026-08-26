import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface PitLaneBannerProps {
  speedLimit: number;
  currentSpeed: number;
  timeInLaneMS?: number;
}

export const PitLaneBanner: React.FC<PitLaneBannerProps> = ({
  speedLimit = 80,
  currentSpeed,
  timeInLaneMS = 0
}) => {
  const isSpeeding = currentSpeed > speedLimit;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>PIT LANE</Text>
      <Text style={styles.subtitle}>PIT ENTRY / SPEED LIMITER ON</Text>

      <View style={styles.row}>
        <View style={styles.box}>
          <Text style={styles.label}>SPEED LIMIT</Text>
          <Text style={styles.value}>{speedLimit} <Text style={styles.unit}>KM/H</Text></Text>
        </View>

        <View style={styles.box}>
          <Text style={styles.label}>YOUR SPEED</Text>
          <Text style={[styles.value, isSpeeding && styles.speedingValue]}>
            {currentSpeed} <Text style={styles.unit}>KM/H</Text>
          </Text>
        </View>

        {timeInLaneMS > 0 && (
          <View style={styles.box}>
            <Text style={styles.label}>PIT TIME</Text>
            <Text style={styles.value}>{(timeInLaneMS / 1000).toFixed(1)}s</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0c2340',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#38bdf8',
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    width: '100%'
  },
  title: {
    color: '#38bdf8',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: 2
  },
  subtitle: {
    color: '#bae6fd',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 10
  },
  row: {
    flexDirection: 'row',
    gap: 30
  },
  box: {
    alignItems: 'center'
  },
  label: {
    color: '#7dd3fc',
    fontSize: 10,
    fontWeight: '700'
  },
  value: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '900'
  },
  speedingValue: {
    color: '#ef4444'
  },
  unit: {
    fontSize: 11,
    color: '#94a3b8'
  }
});
