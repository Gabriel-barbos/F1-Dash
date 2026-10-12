/**
 * RpmIndicator — Shift Lights estilo volante de F1 + barra linear de RPM
 *
 * - 15 LEDs retangulares em 3 grupos (low · mid · high), como no volante real
 * - Carcaça escura (bezel) com reflexo de vidro em cada LED
 * - Cada LED acende/apaga com fade curto (~60ms) e glow na cor do grupo
 * - Shift point (revPercent >= 96%): a barra inteira pisca rápido (~8 Hz) na cor `peak`
 * - Barra linear fina de RPM com marcações a cada 1 000 rpm e zona vermelha final
 */

import React, { memo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { ShiftLightsPalette } from '../theme/types';

interface RpmIndicatorProps {
  revPercent: number;
  palette: ShiftLightsPalette;
  totalLeds?: number;
  rpm?: number;
  maxRpm?: number;
  /** Exibe a barra linear de RPM abaixo dos LEDs */
  showRpmBar?: boolean;
}

const LED_W = 14;
const LED_H = 13;
const LED_GAP = 4;
const GROUP_GAP = 10;

const LedCell: React.FC<{ active: boolean; color: string; peak: boolean; groupStart: boolean }> = memo(
  ({ active, color, peak, groupStart }) => {
    const lit = useSharedValue(active ? 1 : 0);

    useEffect(() => {
      lit.value = withTiming(active ? 1 : 0, {
        duration: active ? 45 : 110,
        easing: Easing.out(Easing.quad),
      });
    }, [active, lit]);

    const litStyle = useAnimatedStyle(() => ({ opacity: lit.value }));

    return (
      <View style={[styles.led, { marginLeft: groupStart ? GROUP_GAP : LED_GAP }]}>
        <Animated.View
          style={[
            styles.ledLit,
            {
              backgroundColor: color,
              shadowColor: color,
              shadowOpacity: peak ? 1 : 0.85,
              shadowRadius: peak ? 9 : 6,
              elevation: active ? 4 : 0,
            },
            litStyle,
          ]}
        >
          <View style={styles.ledGlass} />
        </Animated.View>
      </View>
    );
  }
);
LedCell.displayName = 'LedCell';

export const RpmIndicator: React.FC<RpmIndicatorProps> = memo(({
  revPercent,
  palette,
  totalLeds = 15,
  rpm = 0,
  maxRpm = 13500,
  showRpmBar = true,
}) => {
  const clamped = Math.max(0, Math.min(100, revPercent || 0));
  const activeCount = Math.round((clamped / 100) * totalLeds);
  const isPeakShift = clamped >= 96;

  const groupSize = Math.ceil(totalLeds / 3);

  // ── Flash do shift point ──
  const blink = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(blink);
    if (isPeakShift) {
      blink.value = withRepeat(
        withSequence(withTiming(0.12, { duration: 55 }), withTiming(1, { duration: 55 })),
        -1,
        false
      );
    } else {
      blink.value = withTiming(1, { duration: 80 });
    }
  }, [isPeakShift, blink]);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.value }));

  // ── Barra linear de RPM ──
  const safeMax = Math.max(1000, maxRpm || 13500);
  const rpmRatio = Math.max(0, Math.min(1, (rpm || 0) / safeMax));
  const rpmProgress = useSharedValue(rpmRatio);
  useEffect(() => {
    rpmProgress.value = withTiming(rpmRatio, { duration: 90, easing: Easing.out(Easing.quad) });
  }, [rpmRatio, rpmProgress]);
  const rpmFillStyle = useAnimatedStyle(() => ({ width: `${rpmProgress.value * 100}%` }));

  const tickCount = Math.floor(safeMax / 1000);
  const redlineStart = 0.9;
  const fillColor = isPeakShift
    ? palette.peak || '#ffffff'
    : rpmRatio >= redlineStart
    ? palette.high || '#a855f7'
    : rpmRatio >= 0.6
    ? palette.mid || '#f59e0b'
    : palette.low || '#22c55e';

  return (
    <View style={styles.wrapper}>
      <View style={styles.bezel}>
        <View style={styles.bezelInner} />
        <Animated.View style={[styles.ledRow, blinkStyle]}>
          {Array.from({ length: totalLeds }).map((_, idx) => {
            const group = Math.min(2, Math.floor(idx / groupSize));
            const color = isPeakShift
              ? palette.peak || '#ffffff'
              : group === 0
              ? palette.low || '#22c55e'
              : group === 1
              ? palette.mid || '#ef4444'
              : palette.high || '#a855f7';
            return (
              <LedCell
                key={idx}
                active={idx < activeCount}
                color={color}
                peak={isPeakShift}
                groupStart={idx > 0 && idx % groupSize === 0}
              />
            );
          })}
        </Animated.View>
      </View>

      {showRpmBar && (
        <View style={styles.rpmTrack}>
          <View style={[styles.redline, { left: `${redlineStart * 100}%` }]} />
          <Animated.View
            style={[styles.rpmFill, { backgroundColor: fillColor, shadowColor: fillColor }, rpmFillStyle]}
          />
          {Array.from({ length: tickCount }).map((_, k) => (
            <View
              key={k}
              style={[
                styles.tick,
                { left: `${(((k + 1) * 1000) / safeMax) * 100}%` },
                (k + 1) % 5 === 0 && styles.tickMajor,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
});

RpmIndicator.displayName = 'RpmIndicator';

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'stretch',
  },
  bezel: {
    paddingVertical: 5,
    paddingLeft: 6 - LED_GAP,
    paddingRight: 6,
    backgroundColor: '#06070b',
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#1c2130',
  },
  bezelInner: {
    position: 'absolute',
    top: 1,
    left: 1,
    right: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 6,
  },
  ledRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  led: {
    width: LED_W,
    height: LED_H,
    borderRadius: 2.5,
    backgroundColor: '#10131d',
    borderWidth: 1,
    borderColor: '#1b2030',
  },
  ledLit: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 2.5,
    shadowOffset: { width: 0, height: 0 },
  },
  ledGlass: {
    position: 'absolute',
    top: 1,
    left: 2,
    right: 2,
    height: '40%',
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderRadius: 1.5,
  },
  rpmTrack: {
    height: 4,
    marginTop: 5,
    marginHorizontal: 2,
    backgroundColor: '#0c0f18',
    borderRadius: 2,
    overflow: 'hidden',
  },
  redline: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(225, 6, 0, 0.28)',
  },
  rpmFill: {
    height: '100%',
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  tick: {
    position: 'absolute',
    top: 0,
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(6, 7, 11, 0.85)',
  },
  tickMajor: {
    width: 1.5,
    backgroundColor: '#06070b',
  },
});
