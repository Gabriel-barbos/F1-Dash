/**
 * f1Banner — Primitivas visuais compartilhadas dos banners de estado (estilo F1 TV)
 *
 * - withAlpha:            utilitário de cor (#rrggbb → rgba)
 * - SlantTag:             tag colorida em paralelogramo (skewX) com conteúdo "des-inclinado"
 * - Chevrons:             ››› animados em onda (Overtake / DRS / Modo Reta)
 * - RainDrops:            gotas caindo discretamente (Pista Molhada)
 * - PulseBlock:           bloco piscante para alertas críticos (SC / VSC / Red Flag)
 * - Shimmer:              brilho diagonal que varre o painel
 * - useBannerTransition:  orquestra entrada / troca / saída retendo o último estado
 *                         até a animação de saída terminar.
 */

import React, { memo, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, LayoutChangeEvent } from 'react-native';
import Animated, {
  SharedValue,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  cancelAnimation,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { ChevronRight } from 'lucide-react-native';

/** Fundo escuro oficial dos gráficos de transmissão da F1 */
export const F1_PANEL = 'rgba(21, 21, 30, 0.94)';
export const F1_PANEL_SOLID = '#15151E';
export const F1_SKEW = '-14deg';

export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return hex;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// ─────────────────────────────────────────────────────────────
// SlantTag
// ─────────────────────────────────────────────────────────────

interface SlantTagProps {
  color: string;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

export const SlantTag: React.FC<SlantTagProps> = memo(({ color, width, height, style, children }) => (
  <View style={[{ width, height, alignItems: 'center', justifyContent: 'center' }, style]}>
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: color, borderRadius: 2, transform: [{ skewX: F1_SKEW }] },
      ]}
    >
      {/* Reflexo superior sutil */}
      <View style={styles.tagHighlight} />
    </View>
    {children}
  </View>
));
SlantTag.displayName = 'SlantTag';

// ─────────────────────────────────────────────────────────────
// Chevrons
// ─────────────────────────────────────────────────────────────

interface ChevronsProps {
  color: string;
  size?: number;
  count?: number;
  /** Duração de um ciclo completo da onda em ms */
  period?: number;
}

const ChevronItem: React.FC<{ index: number; count: number; t: SharedValue<number>; color: string; size: number }> =
  ({ index, count, t, color, size }) => {
    const style = useAnimatedStyle(() => {
      const offset = index / (count + 1);
      const phase = (((t.value - offset) % 1) + 1) % 1;
      const opacity = phase < 0.45 ? 1 - (phase / 0.45) * 0.8 : 0.2;
      return { opacity };
    });
    return (
      <Animated.View style={[{ marginLeft: index === 0 ? 0 : -size * 0.45 }, style]}>
        <ChevronRight size={size} color={color} strokeWidth={3.2} />
      </Animated.View>
    );
  };

export const Chevrons: React.FC<ChevronsProps> = memo(({ color, size = 16, count = 3, period = 900 }) => {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = 0;
    t.value = withRepeat(withTiming(1, { duration: period, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(t);
  }, [t, period]);

  return (
    <View style={styles.row}>
      {Array.from({ length: count }).map((_, i) => (
        <ChevronItem key={i} index={i} count={count} t={t} color={color} size={size} />
      ))}
    </View>
  );
});
Chevrons.displayName = 'Chevrons';

// ─────────────────────────────────────────────────────────────
// RainDrops
// ─────────────────────────────────────────────────────────────

const Drop: React.FC<{ index: number; color: string; height: number }> = ({ index, color, height }) => {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(
      index * 210,
      withRepeat(withTiming(1, { duration: 720, easing: Easing.in(Easing.quad) }), -1, false)
    );
    return () => cancelAnimation(p);
  }, [p, index]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.15, 0.8, 1], [0, 1, 0.9, 0]),
    transform: [{ translateY: interpolate(p.value, [0, 1], [-8, height]) }, { rotate: '14deg' }],
  }));

  return (
    <Animated.View
      style={[styles.drop, { backgroundColor: color, left: 3 + index * 6 }, style]}
    />
  );
};

export const RainDrops: React.FC<{ color: string; size?: number }> = memo(({ color, size = 20 }) => (
  <View style={{ width: size + 4, height: size, overflow: 'hidden' }}>
    {[0, 1, 2, 3].map((i) => (
      <Drop key={i} index={i} color={color} height={size} />
    ))}
  </View>
));
RainDrops.displayName = 'RainDrops';

// ─────────────────────────────────────────────────────────────
// PulseBlock
// ─────────────────────────────────────────────────────────────

export const PulseBlock: React.FC<{ color: string; size?: number }> = memo(({ color, size = 10 }) => {
  const o = useSharedValue(1);
  useEffect(() => {
    o.value = withRepeat(
      withSequence(withTiming(0.15, { duration: 380 }), withTiming(1, { duration: 380 })),
      -1,
      false
    );
    return () => cancelAnimation(o);
  }, [o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return (
    <View style={styles.row}>
      {[0, 1].map((i) => (
        <Animated.View
          key={i}
          style={[
            {
              width: size,
              height: size,
              marginLeft: i === 0 ? 0 : 4,
              backgroundColor: color,
              transform: [{ skewX: F1_SKEW }],
            },
            i === 0 ? style : null,
          ]}
        />
      ))}
    </View>
  );
});
PulseBlock.displayName = 'PulseBlock';

// ─────────────────────────────────────────────────────────────
// Shimmer
// ─────────────────────────────────────────────────────────────

export const Shimmer: React.FC<{ progress: SharedValue<number>; width?: number }> = memo(
  ({ progress, width = 70 }) => {
    const containerW = useSharedValue(400);
    const onLayout = (e: LayoutChangeEvent) => {
      containerW.value = e.nativeEvent.layout.width;
    };
    const style = useAnimatedStyle(() => ({
      opacity: progress.value > 0.001 && progress.value < 0.999 ? 1 : 0,
      transform: [
        { translateX: -width + progress.value * (containerW.value + width * 2) },
        { skewX: F1_SKEW },
      ],
    }));
    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none" onLayout={onLayout}>
        <Animated.View style={[{ position: 'absolute', top: -4, bottom: -4, width }, style]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.22)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    );
  }
);
Shimmer.displayName = 'Shimmer';

// ─────────────────────────────────────────────────────────────
// useBannerTransition
// ─────────────────────────────────────────────────────────────

interface BannerTransitionOptions {
  /** Multiplicador de duração (versões compactas podem ser mais rápidas) */
  speed?: number;
}

/**
 * Orquestra a coreografia do banner:
 *  Entrada → tag desliza · painel faz wipe · título/subtítulo escalonados · shimmer
 *  Troca   → texto sai/entra · flash na tag · shimmer
 *  Saída   → texto some · painel recolhe · tag sai por último
 *
 * O payload do último estado é retido até a saída terminar (evita mostrar
 * conteúdo errado durante a animação de saída).
 */
export function useBannerTransition<T>(
  key: string | number | null,
  payload: T | null,
  { speed = 1 }: BannerTransitionOptions = {}
) {
  const d = (ms: number) => Math.round(ms * speed);

  // Cache do último payload conhecido por chave (sempre atualizado no render)
  const payloadByKey = useRef(new Map<string | number, T>());
  if (key !== null && payload !== null) payloadByKey.current.set(key, payload);

  const [shownKey, setShownKey] = useState<string | number | null>(key);
  const shownKeyRef = useRef(shownKey);
  shownKeyRef.current = shownKey;
  const exitingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstRunRef = useRef(true);

  const initial = 0;
  const tag = useSharedValue(initial);
  const panel = useSharedValue(initial);
  const title = useSharedValue(initial);
  const sub = useSharedValue(initial);
  const shimmer = useSharedValue(0);
  const flash = useSharedValue(0);
  const textDir = useSharedValue(1);

  const runEnter = () => {
    const out = Easing.out(Easing.cubic);
    tag.value = withTiming(1, { duration: d(200), easing: out });
    panel.value = withDelay(d(70), withTiming(1, { duration: d(260), easing: out }));
    textDir.value = 1;
    title.value = withDelay(d(230), withTiming(1, { duration: d(220), easing: out }));
    sub.value = withDelay(d(300), withTiming(1, { duration: d(220), easing: out }));
    shimmer.value = 0;
    shimmer.value = withDelay(d(380), withTiming(1, { duration: d(750), easing: Easing.inOut(Easing.quad) }));
  };

  useLayoutEffect(() => {
    if (firstRunRef.current) {
      firstRunRef.current = false;
      if (key !== null) runEnter();
      return;
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    const inEase = Easing.in(Easing.cubic);

    if (key === null) {
      if (shownKeyRef.current === null) return;
      // ── SAÍDA ──
      exitingRef.current = true;
      textDir.value = -1;
      sub.value = withTiming(0, { duration: d(110) });
      title.value = withTiming(0, { duration: d(130) });
      panel.value = withDelay(d(90), withTiming(0, { duration: d(220), easing: inEase }));
      tag.value = withDelay(d(220), withTiming(0, { duration: d(170), easing: inEase }));
      timerRef.current = setTimeout(() => {
        exitingRef.current = false;
        setShownKey(null);
      }, d(420));
      return;
    }

    if (shownKeyRef.current === null || exitingRef.current) {
      // ── ENTRADA (ou reentrada durante a saída) ──
      exitingRef.current = false;
      if (shownKeyRef.current === null) {
        tag.value = 0;
        panel.value = 0;
        title.value = 0;
        sub.value = 0;
      }
      setShownKey(key);
      runEnter();
      return;
    }

    if (shownKeyRef.current !== key) {
      // ── TROCA entre dois estados ativos ──
      textDir.value = -1;
      title.value = withTiming(0, { duration: d(90) });
      sub.value = withTiming(0, { duration: d(90) });
      flash.value = withSequence(
        withTiming(1, { duration: d(70) }),
        withTiming(0, { duration: d(260) })
      );
      timerRef.current = setTimeout(() => {
        setShownKey(key);
        textDir.value = 1;
        const out = Easing.out(Easing.cubic);
        title.value = withTiming(1, { duration: d(200), easing: out });
        sub.value = withDelay(d(60), withTiming(1, { duration: d(200), easing: out }));
        shimmer.value = 0;
        shimmer.value = withTiming(1, { duration: d(700), easing: Easing.inOut(Easing.quad) });
      }, d(95));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    []
  );

  const tagStyle = useAnimatedStyle(() => ({
    opacity: interpolate(tag.value, [0, 0.4], [0, 1], Extrapolation.CLAMP),
    transform: [{ translateX: (1 - tag.value) * -28 }],
  }));

  const panelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(panel.value, [0, 0.12], [0, 1], Extrapolation.CLAMP),
    transform: [{ scaleX: Math.max(0.001, panel.value) }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: title.value,
    transform: [{ translateY: (1 - title.value) * 9 * textDir.value }],
  }));

  const subStyle = useAnimatedStyle(() => ({
    opacity: sub.value,
    transform: [{ translateY: (1 - sub.value) * 7 * textDir.value }],
  }));

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  const shown = shownKey !== null ? payloadByKey.current.get(shownKey) ?? null : null;

  return {
    shown,
    shownKey,
    tagStyle,
    panelStyle,
    titleStyle,
    subStyle,
    flashStyle,
    shimmer,
  };
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '42%',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  drop: {
    position: 'absolute',
    top: 0,
    width: 1.6,
    height: 7,
    borderRadius: 1,
  },
});
