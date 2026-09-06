/**
 * CockpitAtmosphere — Iluminação radial de fundo com React Native Skia & Reanimated
 *
 * Design elegante:
 * - Modo NORMAL: Preto absoluto (#050608) limpo e focado, sem gradiente
 * - Modos ATIVOS: Efeito de atmosfera radial luminosa emanando do centro
 * - Transição suave (500ms) entre estados
 */

import React, { useEffect, useRef, useState, memo } from 'react';
import { View, StyleSheet, Dimensions, ScaledSize } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Canvas, Rect, RadialGradient, vec } from '@shopify/react-native-skia';
import { CockpitTheme, CockpitStateKey } from '../theme/types';

interface CockpitAtmosphereProps {
  theme: CockpitTheme;
  children: React.ReactNode;
}

interface AtmosphereColors {
  center: string;
  mid: string;
  edge: string;
  isNormal: boolean;
}

const getAtmosphereColors = (theme: CockpitTheme): AtmosphereColors => {
  switch (theme.key) {
    case CockpitStateKey.OVERTAKE:
      return {
        center: 'rgba(24, 125, 255, 0.48)',
        mid: '#08204d',
        edge: '#030a1c',
        isNormal: false,
      };
    case CockpitStateKey.STRAIGHT_MODE:
      return {
        center: 'rgba(168, 85, 247, 0.38)',
        mid: '#200938',
        edge: '#070212',
        isNormal: false,
      };
    case CockpitStateKey.SAFETY_CAR:
      return {
        center: 'rgba(245, 190, 11, 0.46)',
        mid: '#362304',
        edge: '#0e0902',
        isNormal: false,
      };
    case CockpitStateKey.VSC:
      return {
        center: 'rgba(249, 140, 10, 0.44)',
        mid: '#331804',
        edge: '#0c0602',
        isNormal: false,
      };
    case CockpitStateKey.RED_FLAG:
      return {
        center: 'rgba(239, 68, 68, 0.46)',
        mid: '#380909',
        edge: '#100202',
        isNormal: false,
      };
    case CockpitStateKey.PIT_LANE:
      return {
        center: 'rgba(236, 72, 153, 0.36)',
        mid: '#2d091f',
        edge: '#0c0208',
        isNormal: false,
      };
    case CockpitStateKey.FASTEST_LAP:
      return {
        center: 'rgba(6, 182, 212, 0.38)',
        mid: '#032a35',
        edge: '#010b10',
        isNormal: false,
      };
    case CockpitStateKey.WET_TRACK:
      return {
        center: 'rgba(56, 189, 248, 0.34)',
        mid: '#052542',
        edge: '#010a14',
        isNormal: false,
      };
    case CockpitStateKey.FORMATION_LAP:
      return {
        center: 'rgba(226, 232, 240, 0.28)',
        mid: '#1c2032',
        edge: '#080910',
        isNormal: false,
      };
    case CockpitStateKey.NORMAL:
    default:
      // Modo normal: preto absoluto e focado, sem gradiente
      return {
        center: '#050608',
        mid: '#050608',
        edge: '#050608',
        isNormal: true,
      };
  }
};

const RadialAtmosphereCanvas: React.FC<{
  colors: AtmosphereColors;
  width: number;
  height: number;
}> = memo(({ colors, width, height }) => {
  if (colors.isNormal) {
    return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#050608' }]} />;
  }

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.max(width, height) * 0.72;

  try {
    return (
      <Canvas style={StyleSheet.absoluteFill}>
        <Rect x={0} y={0} width={width} height={height}>
          <RadialGradient
            c={vec(cx, cy)}
            r={radius}
            colors={[colors.center, colors.mid, colors.edge]}
          />
        </Rect>
      </Canvas>
    );
  } catch {
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: colors.edge },
        ]}
      />
    );
  }
});

RadialAtmosphereCanvas.displayName = 'RadialAtmosphereCanvas';

export const CockpitAtmosphere: React.FC<CockpitAtmosphereProps> = memo(({
  theme,
  children,
}) => {
  const [dimensions, setDimensions] = useState<ScaledSize>(Dimensions.get('window'));

  const [currentColors, setCurrentColors] = useState<AtmosphereColors>(() =>
    getAtmosphereColors(theme)
  );
  const [prevColors, setPrevColors] = useState<AtmosphereColors>(() =>
    getAtmosphereColors(theme)
  );

  const prevThemeKey = useRef(theme.key);
  const fadeAnim = useSharedValue(1);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => {
      setDimensions(window);
    });
    return () => sub?.remove();
  }, []);

  useEffect(() => {
    if (prevThemeKey.current !== theme.key) {
      setPrevColors(currentColors);
      setCurrentColors(getAtmosphereColors(theme));
      prevThemeKey.current = theme.key;

      fadeAnim.value = 0;
      fadeAnim.value = withTiming(1, {
        duration: 450,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [theme.key, currentColors, fadeAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
  }));

  const { width, height } = dimensions;

  return (
    <View style={styles.container}>
      {/* Camada base durante o crossfade */}
      <View style={StyleSheet.absoluteFill}>
        <RadialAtmosphereCanvas colors={prevColors} width={width} height={height} />
      </View>

      {/* Camada atual com animação Reanimated de fade in */}
      <Animated.View style={[StyleSheet.absoluteFill, animatedStyle]}>
        <RadialAtmosphereCanvas colors={currentColors} width={width} height={height} />
      </Animated.View>

      {/* Conteúdo principal */}
      <View style={styles.content}>{children}</View>
    </View>
  );
});

CockpitAtmosphere.displayName = 'CockpitAtmosphere';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050608',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flex: 1,
  },
});
