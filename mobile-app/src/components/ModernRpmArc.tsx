import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

interface ModernRpmArcProps {
  rpm: number;
  maxRpm?: number;
  revPercent: number;
}

export const ModernRpmArc: React.FC<ModernRpmArcProps> = ({
  rpm,
  maxRpm = 13500,
  revPercent
}) => {
  // Arco SVG semi-circular no topo
  const percent = Math.max(0, Math.min(100, (rpm / maxRpm) * 100));

  return (
    <View style={styles.container}>
      <Svg width="420" height="95" viewBox="0 0 420 95">
        {/* Arco de fundo */}
        <Path
          d="M 30 85 Q 210 10 390 85"
          fill="none"
          stroke="#1e2436"
          strokeWidth="8"
          strokeLinecap="round"
        />
        {/* Arco ativo com gradiente/cor */}
        <Path
          d="M 30 85 Q 210 10 390 85"
          fill="none"
          stroke={percent > 90 ? '#ef4444' : percent > 75 ? '#eab308' : '#38bdf8'}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray="400"
          strokeDashoffset={400 - (400 * (percent / 100))}
        />
      </Svg>

      {/* Marcadores de RPM 0, 3, 6, 9, 12, 15 */}
      <View style={styles.markersRow}>
        <Text style={styles.markerText}>0</Text>
        <Text style={styles.markerText}>3</Text>
        <Text style={styles.markerText}>6</Text>
        <Text style={styles.markerText}>9</Text>
        <Text style={styles.markerText}>12</Text>
        <Text style={[styles.markerText, { color: '#ef4444' }]}>15</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: -20
  },
  markersRow: {
    position: 'absolute',
    bottom: 24,
    width: 360,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20
  },
  markerText: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800'
  }
});
