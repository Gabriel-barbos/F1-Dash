import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PitStatus, Formatters } from '@f1-dash/telemetry-core';

interface PitStatusCardProps {
  pitStatus: PitStatus;
  pitLimiterActive: boolean;
  pitLaneTimeInLaneInMS: number;
  pitStopTimerInMS: number;
  pitSpeedLimit: number;
}

export const PitStatusCard: React.FC<PitStatusCardProps> = ({
  pitStatus,
  pitLimiterActive,
  pitLaneTimeInLaneInMS,
  pitStopTimerInMS,
  pitSpeedLimit
}) => {
  const pitInfo = Formatters.getPitStatusLabel(pitStatus, pitLimiterActive);

  if (!pitInfo.active && !pitLimiterActive && pitStatus === PitStatus.None) {
    return null;
  }

  const pitLaneSec = (pitLaneTimeInLaneInMS / 1000).toFixed(1);
  const pitStopSec = (pitStopTimerInMS / 1000).toFixed(1);

  return (
    <View style={[styles.container, { borderColor: pitInfo.color }]}>
      <View style={[styles.headerBadge, { backgroundColor: pitInfo.color }]}>
        <Text style={styles.badgeText}>{pitInfo.label}</Text>
      </View>
      <View style={styles.detailsRow}>
        <Text style={styles.detailText}>Limite: {pitSpeedLimit} km/h</Text>
        {pitLaneTimeInLaneInMS > 0 && (
          <Text style={styles.detailText}>Pit Lane: {pitLaneSec}s</Text>
        )}
        {pitStopTimerInMS > 0 && (
          <Text style={[styles.detailText, styles.highlightText]}>Parada: {pitStopSec}s</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#18181b',
    borderRadius: 8,
    borderWidth: 2,
    padding: 8,
    marginVertical: 4
  },
  headerBadge: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginBottom: 4
  },
  badgeText: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: 12,
    letterSpacing: 0.8
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  },
  detailText: {
    color: '#a1a1aa',
    fontSize: 12,
    fontWeight: '600'
  },
  highlightText: {
    color: '#f97316',
    fontWeight: '800'
  }
});
