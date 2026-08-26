import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface GearDisplayProps {
  gear: number;            // -1 = R, 0 = N, 1..8
  speed: number;           // km/h
  rpm: number;             // RPM
  drsActive?: boolean;
  drsAllowed?: boolean;
  overtakeActive?: boolean;
  suggestedGear?: number;
}

export const GearDisplay: React.FC<GearDisplayProps> = ({
  gear,
  speed,
  rpm,
  drsActive = false,
  drsAllowed = false,
  overtakeActive = false,
  suggestedGear = 0
}) => {
  const gearText = gear === 0 ? 'N' : gear === -1 ? 'R' : gear.toString();

  return (
    <View style={styles.container}>
      {/* RPM no topo */}
      <View style={styles.rpmRow}>
        <Text style={styles.rpmValue}>{rpm}</Text>
        <Text style={styles.rpmLabel}>RPM</Text>
      </View>

      {/* Marcha Gigante Central */}
      <View style={styles.gearBox}>
        <Text style={styles.gearText}>{gearText}</Text>
        {suggestedGear > 0 && suggestedGear !== gear && (
          <View style={styles.suggestedBadge}>
            <Text style={styles.suggestedText}>▲ {suggestedGear}</Text>
          </View>
        )}
      </View>

      {/* Velocidade em km/h */}
      <View style={styles.speedRow}>
        <Text style={styles.speedValue}>{speed}</Text>
        <Text style={styles.speedLabel}>KM/H</Text>
      </View>

      {/* Badge de DRS / Overtake */}
      <View style={styles.badgeRow}>
        {drsActive ? (
          <View style={[styles.badge, styles.drsOpenBadge]}>
            <Text style={styles.drsOpenText}>DRS OPEN</Text>
          </View>
        ) : drsAllowed ? (
          <View style={[styles.badge, styles.drsAvailBadge]}>
            <Text style={styles.drsAvailText}>DRS</Text>
          </View>
        ) : null}

        {overtakeActive && (
          <View style={[styles.badge, styles.overtakeBadge]}>
            <Text style={styles.overtakeText}>OVERTAKE</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20
  },
  rpmRow: {
    alignItems: 'center'
  },
  rpmValue: {
    color: '#e2e8f0',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1
  },
  rpmLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700'
  },
  gearBox: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -6
  },
  gearText: {
    color: '#ffffff',
    fontSize: 88,
    fontWeight: '900',
    lineHeight: 96,
    textShadowColor: 'rgba(255, 255, 255, 0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  suggestedBadge: {
    position: 'absolute',
    right: -24,
    top: 16,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  suggestedText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold'
  },
  speedRow: {
    alignItems: 'center'
  },
  speedValue: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 1
  },
  speedLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700'
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1
  },
  drsOpenBadge: {
    backgroundColor: '#052e16',
    borderColor: '#22c55e'
  },
  drsOpenText: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  },
  drsAvailBadge: {
    backgroundColor: '#172554',
    borderColor: '#3b82f6'
  },
  drsAvailText: {
    color: '#60a5fa',
    fontSize: 11,
    fontWeight: '800'
  },
  overtakeBadge: {
    backgroundColor: '#422006',
    borderColor: '#eab308'
  },
  overtakeText: {
    color: '#eab308',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1
  }
});
