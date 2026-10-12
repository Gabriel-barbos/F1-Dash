/**
 * GearDisplay — Display Dominante da Marcha (HUD F1)
 *
 * - Tipografia Titillium Black com dígitos tabulares
 * - Moldura HUD com 4 cantos em "bracket" e rótulo GEAR
 * - Troca "rolante" (~150ms): a marcha antiga sai e a nova entra no sentido
 *   da troca (upshift sobe, downshift desce) com leve motion blur simulado
 * - Cor por estado: N verde, R âmbar, shift point acende na cor `peak` com glow
 *   e os brackets pulsam ("TROQUE AGORA")
 * - Chevron ▲/▼ que pisca ao lado durante a troca
 */

import React, { useEffect, useLayoutEffect, useRef, memo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  cancelAnimation,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { ChevronUp, ChevronDown } from 'lucide-react-native';
import { F1Font } from '../../theme/typography';

interface GearDisplayProps {
  gear: number;
  /** Percentual das luzes de giro (0-100) para destacar o shift point */
  revPercent?: number;
  /** Cor de destaque do shift point */
  shiftColor?: string;
}

const BOX_H = 102;
const ROLL = 54;

const gearLabel = (g: number) => (g === 0 ? 'N' : g === -1 ? 'R' : String(g));

export const GearDisplay: React.FC<GearDisplayProps> = memo(({
  gear,
  revPercent = 0,
  shiftColor = '#ffffff',
}) => {
  // Detecção da troca durante o render (evita um frame com a marcha errada)
  const currentRef = useRef(gear);
  const outgoingRef = useRef<number | null>(null);
  const dirRef = useRef<1 | -1>(1);
  if (currentRef.current !== gear) {
    outgoingRef.current = currentRef.current;
    dirRef.current = gear > currentRef.current ? 1 : -1;
    currentRef.current = gear;
  }

  const progress = useSharedValue(1);
  const dir = useSharedValue(1);
  const punch = useSharedValue(1);
  const chevron = useSharedValue(0);

  useLayoutEffect(() => {
    if (outgoingRef.current === null) return;
    dir.value = dirRef.current;
    progress.value = 0;
    progress.value = withTiming(1, { duration: 150, easing: Easing.out(Easing.cubic) });
    punch.value = withSequence(
      withTiming(1.07, { duration: 70, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 110, easing: Easing.out(Easing.cubic) })
    );
    chevron.value = withSequence(
      withTiming(1, { duration: 40 }),
      withTiming(0, { duration: 420, easing: Easing.in(Easing.quad) })
    );
  }, [gear, dir, progress, punch, chevron]);

  // ── Shift point ──
  const isShift = revPercent >= 96 && gear > 0;
  const bracketPulse = useSharedValue(0);
  useEffect(() => {
    cancelAnimation(bracketPulse);
    if (isShift) {
      bracketPulse.value = withRepeat(
        withSequence(withTiming(1, { duration: 90 }), withTiming(0.25, { duration: 90 })),
        -1,
        false
      );
    } else {
      bracketPulse.value = withTiming(0, { duration: 150 });
    }
  }, [isShift, bracketPulse]);

  const incomingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6, 1], [0, 0.9, 1]),
    transform: [
      { translateY: (1 - progress.value) * ROLL * dir.value },
      { scaleY: interpolate(progress.value, [0, 1], [1.18, 1]) },
      { scale: punch.value },
    ],
  }));

  const outgoingStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.7], [1, 0], 'clamp'),
    transform: [
      { translateY: -progress.value * ROLL * dir.value },
      { scaleY: interpolate(progress.value, [0, 1], [1, 1.18]) },
    ],
  }));

  const bracketActiveStyle = useAnimatedStyle(() => ({ opacity: bracketPulse.value }));
  const chevronStyle = useAnimatedStyle(() => ({
    opacity: chevron.value,
    transform: [{ translateY: (1 - chevron.value) * -6 * dir.value }],
  }));

  const color =
    gear === 0 ? '#22c55e' : gear === -1 ? '#f59e0b' : isShift ? shiftColor : '#ffffff';
  const glow =
    gear === 0
      ? 'rgba(34, 197, 94, 0.55)'
      : gear === -1
      ? 'rgba(245, 158, 11, 0.55)'
      : isShift
      ? shiftColor
      : 'rgba(255, 255, 255, 0.32)';

  const outgoing = outgoingRef.current;
  const ChevronIcon = dirRef.current === 1 ? ChevronUp : ChevronDown;

  return (
    <View style={styles.container}>
      <Text style={styles.caption}>GEAR</Text>

      <View style={styles.frame}>
        {/* Brackets base */}
        <View style={[styles.corner, styles.tl]} />
        <View style={[styles.corner, styles.tr]} />
        <View style={[styles.corner, styles.bl]} />
        <View style={[styles.corner, styles.br]} />
        {/* Brackets ativos (shift point) */}
        <Animated.View style={[StyleSheet.absoluteFill, bracketActiveStyle]} pointerEvents="none">
          <View style={[styles.corner, styles.tl, { borderColor: shiftColor }]} />
          <View style={[styles.corner, styles.tr, { borderColor: shiftColor }]} />
          <View style={[styles.corner, styles.bl, { borderColor: shiftColor }]} />
          <View style={[styles.corner, styles.br, { borderColor: shiftColor }]} />
        </Animated.View>

        <View style={styles.clip}>
          {outgoing !== null && (
            <Animated.Text style={[styles.gearText, styles.layer, outgoingStyle]}>
              {gearLabel(outgoing)}
            </Animated.Text>
          )}
          <Animated.Text
            style={[styles.gearText, styles.layer, { color, textShadowColor: glow }, incomingStyle]}
          >
            {gearLabel(gear)}
          </Animated.Text>
        </View>

        <Animated.View style={[styles.chevron, chevronStyle]} pointerEvents="none">
          <ChevronIcon size={16} color={dirRef.current === 1 ? '#22c55e' : '#f59e0b'} strokeWidth={3.2} />
        </Animated.View>
      </View>
    </View>
  );
});

GearDisplay.displayName = 'GearDisplay';

const CORNER = 14;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  caption: {
    color: '#566079',
    fontFamily: F1Font.bold,
    fontSize: 8,
    letterSpacing: 3,
    marginBottom: -1,
    includeFontPadding: false,
  },
  frame: {
    width: 112,
    height: BOX_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clip: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
  },
  gearText: {
    color: '#ffffff',
    fontFamily: F1Font.black,
    fontSize: 100,
    lineHeight: 112,
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
    includeFontPadding: false,
    textShadowColor: 'rgba(255, 255, 255, 0.32)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: '#2a3247',
  },
  tl: { top: 0, left: 0, borderTopWidth: 2, borderLeftWidth: 2 },
  tr: { top: 0, right: 0, borderTopWidth: 2, borderRightWidth: 2 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 2, borderLeftWidth: 2 },
  br: { bottom: 0, right: 0, borderBottomWidth: 2, borderRightWidth: 2 },
  chevron: {
    position: 'absolute',
    right: -18,
    top: BOX_H / 2 - 8,
  },
});
