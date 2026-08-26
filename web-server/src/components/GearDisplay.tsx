import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GearDisplayProps {
  gear: number; // -1 = R, 0 = N, 1..8
  speed: number; // km/h
  drsActive: boolean;
  drsAllowed: boolean;
}

export const GearDisplay: React.FC<GearDisplayProps> = ({
  gear,
  speed,
  drsActive,
  drsAllowed
}) => {
  const renderGearText = () => {
    if (gear === 0) return 'N';
    if (gear === -1) return 'R';
    return gear.toString();
  };

  return (
    <View style={styles.container}>
      {/* Indicador de DRS */}
      <View
        style={[
          styles.drsBadge,
          drsActive
            ? styles.drsActive
            : drsAllowed
            ? styles.drsAllowed
            : styles.drsOff
        ]}
      >
        <Text
          style={[
            styles.drsText,
            drsActive || drsAllowed ? styles.drsTextActive : styles.drsTextOff
          ]}
        >
          DRS
        </Text>
      </View>

      {/* Marcha Principal */}
      <Text style={styles.gearText}>{renderGearText()}</Text>

      {/* Velocímetro */}
      <View style={styles.speedRow}>
        <Text style={styles.speedNumber}>{speed}</Text>
        <Text style={styles.speedUnit}>KM/H</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#09090b',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#27272a',
    paddingVertical: 14,
    paddingHorizontal: 24,
    minWidth: 160
  },
  drsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 4
  },
  drsActive: {
    backgroundColor: '#22c55e'
  },
  drsAllowed: {
    backgroundColor: '#3b82f6'
  },
  drsOff: {
    backgroundColor: '#27272a'
  },
  drsText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  drsTextActive: {
    color: '#000000'
  },
  drsTextOff: {
    color: '#71717a'
  },
  gearText: {
    fontSize: 72,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 80
  },
  speedRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4
  },
  speedNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#38bdf8'
  },
  speedUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#71717a'
  }
});
