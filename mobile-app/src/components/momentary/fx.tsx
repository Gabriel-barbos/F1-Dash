import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View, ViewStyle } from 'react-native';
import Svg, { Polygon } from 'react-native-svg';

/**
 * Ciclo de vida padrão das telas momentâneas: animação de ENTRADA, permanência, animação de SAÍDA e só então onDismiss.
 * `enter` vai de 0 (fora) a 1 (dentro) e deve ser usado com interpolate p/ compor as transições.
 */
export function useOverlayTransition(durationMs: number, onDismiss: () => void) {
  const enter = useRef(new Animated.Value(0)).current;
  const countdown = useRef(new Animated.Value(1)).current;
  const closing = useRef(false);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    Animated.timing(enter, {
      toValue: 0,
      duration: 420,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true
    }).start(() => onDismissRef.current());
  }, [enter]);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 620,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true
    }).start();
    Animated.timing(countdown, {
      toValue: 0,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: true
    }).start();
    const timer = setTimeout(close, durationMs);
    return () => clearTimeout(timer);
  }, [durationMs, close, enter, countdown]);

  return { enter, countdown, close };
}

/** Loop contínuo 0→1 (útil para pulsos, rotações e varreduras). */
export function useLoop(durationMs: number, easing: (t: number) => number = Easing.linear, pingPong = false) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const seq = pingPong
      ? Animated.sequence([
          Animated.timing(v, { toValue: 1, duration: durationMs, easing, useNativeDriver: true }),
          Animated.timing(v, { toValue: 0, duration: durationMs, easing, useNativeDriver: true })
        ])
      : Animated.timing(v, { toValue: 1, duration: durationMs, easing, useNativeDriver: true });
    const loop = Animated.loop(seq, { resetBeforeIteration: !pingPong });
    loop.start();
    return () => loop.stop();
  }, [v, durationMs, easing, pingPong]);
  return v;
}

interface HazardStripesProps {
  height: number;
  colorA: string;
  colorB: string;
  stripe?: number;
  /** ms para andar um período completo (menor = mais rápido). */
  periodMs?: number;
  reverse?: boolean;
  style?: ViewStyle;
}

/** Faixa de listras diagonais (estilo bandeira/zebra de pista) animada, em loop perfeito. */
export const HazardStripes: React.FC<HazardStripesProps> = ({
  height,
  colorA,
  colorB,
  stripe = 26,
  periodMs = 1400,
  reverse = false,
  style
}) => {
  const screenW = Dimensions.get('window').width;
  const period = stripe * 2;
  const count = Math.ceil((Math.max(screenW, Dimensions.get('window').height) + period * 2) / period) + 1;
  const t = useLoop(periodMs);
  const translateX = t.interpolate({ inputRange: [0, 1], outputRange: reverse ? [-period, 0] : [0, -period] });

  const polys = useMemo(() => {
    const out: React.ReactElement[] = [];
    for (let i = 0; i < count; i++) {
      const x = i * period;
      out.push(
        <Polygon
          key={i}
          points={`${x},${height} ${x + stripe},${height} ${x + stripe + height},0 ${x + height},0`}
          fill={colorB}
        />
      );
    }
    return out;
  }, [count, period, stripe, height, colorB]);

  return (
    <View style={[{ height, overflow: 'hidden', backgroundColor: colorA }, style]}>
      <Animated.View style={{ width: count * period, height, transform: [{ translateX }] }}>
        <Svg width={count * period} height={height}>
          {polys}
        </Svg>
      </Animated.View>
    </View>
  );
};

interface PulseRingProps {
  size: number;
  color: string;
  periodMs?: number;
  delayFraction?: number;
}

/** Anel que expande e some (onda de radar / sinal de rádio). */
export const PulseRing: React.FC<PulseRingProps> = ({ size, color, periodMs = 1800, delayFraction = 0 }) => {
  const t = useLoop(periodMs, Easing.out(Easing.quad));
  const phase = delayFraction;
  const scale = t.interpolate({ inputRange: [0, 1], outputRange: [0.45 + phase * 0.2, 1.45] });
  const opacity = t.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.65, 0] });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 2,
          borderColor: color,
          opacity,
          transform: [{ scale }]
        }
      ]}
    />
  );
};
