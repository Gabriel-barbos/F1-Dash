/**
 * InputBars — Instrumentos Periféricos de Aceleração (ACC) e Frenagem (BRAKE)
 *
 * Barras verticais finas integradas à periferia do Center HUD:
 * - Preenchimento interpolado na UI thread (~50ms) para resposta fluida
 * - Marcações de escala a cada 25%
 * - Quando não acionadas (0%): traço sutil escuro, sem poluição
 * - ACC em verde (#22c55e), BRAKE em vermelho (#ef4444)
 */

import React, { memo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { F1Font } from '../../theme/typography';

interface InputBarProps {
  value: number; // 0.0 a 1.0
  type: 'throttle' | 'brake';
  height?: number;
}

export const InputBar: React.FC<InputBarProps> = memo(({
  value,
  type,
  height = 110,
}) => {
  const ratio = Math.max(0, Math.min(1, value || 0));
  const percent = Math.round(ratio * 100);
  const isThrottle = type === 'throttle';
  const color = isThrottle ? '#22c55e' : '#ef4444';
  const label = isThrottle ? 'ACC' : 'BRK';
  const isActive = percent > 1;

  const fill = useSharedValue(ratio);
  useEffect(() => {
    fill.value = withTiming(ratio, { duration: 50, easing: Easing.out(Easing.quad) });
  }, [ratio, fill]);
  const fillStyle = useAnimatedStyle(() => ({ height: `${fill.value * 100}%` }));

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: isActive ? color : '#475569' }]}>
        {label}
      </Text>

      <View style={[styles.track, { height, borderColor: isActive ? '#243048' : '#141824' }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              backgroundColor: color,
              shadowColor: color,
              shadowOpacity: isActive ? 0.9 : 0,
              shadowRadius: isActive ? 6 : 0,
              elevation: isActive ? 4 : 0,
            },
            fillStyle,
          ]}
        />
        {[25, 50, 75].map((t) => (
          <View key={t} style={[styles.tick, { bottom: `${t}%` }]} pointerEvents="none" />
        ))}
      </View>

      <Text style={[styles.percent, { color: isActive ? '#cbd5e1' : '#334155' }]}>
        {percent}
      </Text>
    </View>
  );
});

InputBar.displayName = 'InputBar';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 3,
    width: 24,
  },
  label: {
    fontFamily: F1Font.bold,
    fontSize: 8,
    letterSpacing: 1,
    includeFontPadding: false,
  },
  track: {
    width: 8,
    backgroundColor: '#090b12',
    borderRadius: 2,
    borderWidth: 1,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 0.5,
  },
  fill: {
    width: '100%',
    borderRadius: 1.5,
    shadowOffset: { width: 0, height: 0 },
  },
  tick: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(9, 11, 18, 0.9)',
  },
  percent: {
    fontFamily: F1Font.bold,
    fontSize: 8,
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
  },
});
