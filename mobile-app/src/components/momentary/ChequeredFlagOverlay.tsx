import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { MomentaryOverlayContainer } from './MomentaryOverlayContainer';

interface ChequeredFlagOverlayProps {
  onDismiss: () => void;
  position?: number;
}

export const ChequeredFlagOverlay: React.FC<ChequeredFlagOverlayProps> = ({
  onDismiss,
  position = 1
}) => {
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 400, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0, duration: 400, useNativeDriver: true })
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <MomentaryOverlayContainer
      durationSeconds={6}
      onDismiss={onDismiss}
      title="SESSION COMPLETE"
      badge="CHEQUERED FLAG"
      badgeColor="#ffffff"
    >
      <View style={styles.content}>
        {/* Animated Checkered Pattern Bar */}
        <View style={styles.flagBanner}>
          <Text style={styles.flagPattern}>🏁 🏁 🏁 🏁 🏁 🏁 🏁 🏁 🏁</Text>
        </View>

        <Animated.View style={[styles.mainCard, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.title}>CHEQUERED FLAG</Text>
          <Text style={styles.subtitle}>RACE FINISH • P{position}</Text>
          <Text style={styles.p1Highlight}>
            {position === 1 ? '🏆 VICTORY! P1 FINISH 🏆' : `FINISHING POSITION: P${position}`}
          </Text>
        </Animated.View>

        <View style={styles.flagBanner}>
          <Text style={styles.flagPattern}>🏁 🏁 🏁 🏁 🏁 🏁 🏁 🏁 🏁</Text>
        </View>
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
  flagBanner: {
    paddingVertical: 6
  },
  flagPattern: {
    fontSize: 20,
    letterSpacing: 4
  },
  mainCard: {
    backgroundColor: '#0f131f',
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    marginVertical: 10,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 3
  },
  subtitle: {
    color: '#38bdf8',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 4
  },
  p1Highlight: {
    color: '#facc15',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 8
  }
});
