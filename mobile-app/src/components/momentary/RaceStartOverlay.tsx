import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MomentaryOverlayContainer } from './MomentaryOverlayContainer';

interface RaceStartOverlayProps {
  onDismiss: () => void;
}

export const RaceStartOverlay: React.FC<RaceStartOverlayProps> = ({ onDismiss }) => {
  const [stage, setStage] = useState<number>(0); // 0: off, 1-5: red lights on, 6: lights out (GO!)
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    // 5 Red Lights Sequence
    const timers = [
      setTimeout(() => setStage(1), 600),
      setTimeout(() => setStage(2), 1200),
      setTimeout(() => setStage(3), 1800),
      setTimeout(() => setStage(4), 2400),
      setTimeout(() => setStage(5), 3000),
      // Random hold between 1.2s to 2s, then Lights Out!
      setTimeout(() => {
        setStage(6);
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 150, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1.0, duration: 150, useNativeDriver: true })
        ]).start();
      }, 4300),
      // Auto-dismiss shortly after start
      setTimeout(() => {
        onDismiss();
      }, 6800)
    ];

    return () => timers.forEach(t => clearTimeout(t));
  }, [onDismiss]);

  const isLightsOut = stage === 6;

  return (
    <MomentaryOverlayContainer
      durationSeconds={7}
      onDismiss={onDismiss}
      title="RACE START PROCEDURE"
      badge="FIA START"
      badgeColor={isLightsOut ? '#22c55e' : '#ef4444'}
    >
      <View style={styles.content}>
        {/* Lights Gantry */}
        <View style={styles.gantryContainer}>
          <View style={styles.gantryFrame}>
            {[1, 2, 3, 4, 5].map((lightIdx) => {
              const isLit = stage >= lightIdx && stage < 6;
              return (
                <View key={lightIdx} style={styles.lightColumn}>
                  <View
                    style={[
                      styles.lightBulb,
                      isLit && styles.lightBulbRedActive,
                      isLightsOut && styles.lightBulbGreenActive
                    ]}
                  />
                  <View
                    style={[
                      styles.lightBulb,
                      isLit && styles.lightBulbRedActive,
                      isLightsOut && styles.lightBulbGreenActive
                    ]}
                  />
                </View>
              );
            })}
          </View>
        </View>

        {/* Message Banner */}
        <Animated.View style={[styles.statusBox, { transform: [{ scale: pulseAnim }] }]}>
          {stage === 0 && (
            <Text style={styles.standbyText}>GRID FORMING • PREPARE FOR START</Text>
          )}
          {stage >= 1 && stage <= 5 && (
            <Text style={styles.holdingText}>
              LIGHT {stage} / 5 • HOLD REVS
            </Text>
          )}
          {isLightsOut && (
            <View style={styles.goContainer}>
              <Text style={styles.goTitle}>LIGHTS OUT!</Text>
              <Text style={styles.goSubtitle}>AND AWAY WE GO!</Text>
            </View>
          )}
        </Animated.View>
      </View>
    </MomentaryOverlayContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%'
  },
  gantryContainer: {
    backgroundColor: '#0f131d',
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
    marginBottom: 20
  },
  gantryFrame: {
    flexDirection: 'row',
    gap: 20,
    backgroundColor: '#090b10',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e2436'
  },
  lightColumn: {
    gap: 8,
    alignItems: 'center'
  },
  lightBulb: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#171c28',
    borderWidth: 2,
    borderColor: '#262f45'
  },
  lightBulbRedActive: {
    backgroundColor: '#ef4444',
    borderColor: '#fca5a5',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10
  },
  lightBulbGreenActive: {
    backgroundColor: '#22c55e',
    borderColor: '#86efac',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10
  },
  statusBox: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60
  },
  standbyText: {
    color: '#94a3b8',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2
  },
  holdingText: {
    color: '#ef4444',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2
  },
  goContainer: {
    alignItems: 'center'
  },
  goTitle: {
    color: '#22c55e',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 3,
    textShadowColor: 'rgba(34, 197, 94, 0.6)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  goSubtitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 4
  }
});
