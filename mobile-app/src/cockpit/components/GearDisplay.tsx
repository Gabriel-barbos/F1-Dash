/**
 * GearDisplay — Display Dominante da Marcha com Animação Mecânica Rápida
 *
 * Utiliza React Native Reanimated para criar uma resposta mecânica precisa (~160ms)
 * na troca de marcha:
 * - Leve impacto mecânico (scale punch)
 * - Micro-deslocamento vertical baseado no upshift / downshift
 * - Flash sutil de opacidade e nitidez
 */

import React, { useEffect, useRef, memo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

interface GearDisplayProps {
  gear: number;
}

export const GearDisplay: React.FC<GearDisplayProps> = memo(({ gear }) => {
  const gearText = gear === 0 ? 'N' : gear === -1 ? 'R' : gear.toString();
  const prevGear = useRef(gear);

  // Reanimated values
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    if (prevGear.current !== gear) {
      const isUpshift = gear > prevGear.current;
      prevGear.current = gear;

      // Micro-deslocamento vertical mecânico (upshift sobe levemente, downshift desce)
      translateY.value = isUpshift ? 5 : -5;
      translateY.value = withTiming(0, {
        duration: 150,
        easing: Easing.out(Easing.cubic),
      });

      // Impacto elástico de troca mecânica
      scale.value = withSequence(
        withTiming(0.93, { duration: 40, easing: Easing.in(Easing.quad) }),
        withTiming(1.06, { duration: 60, easing: Easing.out(Easing.quad) }),
        withTiming(1.0, { duration: 60, easing: Easing.out(Easing.cubic) })
      );

      // Flash sutil de brilho/opacidade
      opacity.value = withSequence(
        withTiming(0.85, { duration: 40 }),
        withTiming(1.0, { duration: 120 })
      );
    }
  }, [gear, scale, translateY, opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.gearText, animatedStyle]}>
        {gearText}
      </Animated.Text>
    </View>
  );
});

GearDisplay.displayName = 'GearDisplay';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 108,
  },
  gearText: {
    color: '#ffffff',
    fontSize: 120,
    fontWeight: '900',
    lineHeight: 110,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(255, 255, 255, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
});
