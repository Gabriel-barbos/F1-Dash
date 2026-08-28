import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import {
  ChevronsRight, Flag, ShieldAlert, Zap, Wrench, Timer, FlagTriangleRight, CloudRain,
} from 'lucide-react-native';
import { CockpitTheme, CockpitStateKey } from '../theme/types';

interface Props {
  theme: CockpitTheme;
}

const ICONS: Partial<Record<CockpitStateKey, React.ComponentType<any>>> = {
  [CockpitStateKey.OVERTAKE]: ChevronsRight,
  [CockpitStateKey.RED_FLAG]: Flag,
  [CockpitStateKey.SAFETY_CAR]: ShieldAlert,
  [CockpitStateKey.VSC]: ShieldAlert,
  [CockpitStateKey.STRAIGHT_MODE]: Zap,
  [CockpitStateKey.PIT_LANE]: Wrench,
  [CockpitStateKey.FASTEST_LAP]: Timer,
  [CockpitStateKey.FORMATION_LAP]: FlagTriangleRight,
  [CockpitStateKey.WET_TRACK]: CloudRain,
};

export const TelemetryInfoBar: React.FC<Props> = ({ theme }) => {
  const isNormal = theme.key === CockpitStateKey.NORMAL;
  const fade = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;
  const pulseLoop = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.timing(fade, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      Animated.timing(fade, { toValue: 1, duration: 300, useNativeDriver: true }).start();
    });
  }, [theme.key]);

  useEffect(() => {
    pulseLoop.current?.stop();
    if (theme.badgePulsing && !isNormal) {
      pulseLoop.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.015, duration: 550, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 550, useNativeDriver: true }),
        ])
      );
      pulseLoop.current.start();
    } else {
      Animated.timing(pulse, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    }
    return () => pulseLoop.current?.stop();
  }, [theme.badgePulsing, theme.key]);

  if (isNormal) {
    return (
      <View style={styles.idleWrap}>
        <View style={styles.idleLine} />
      </View>
    );
  }

  const Icon = ICONS[theme.key];

  return (
    <Animated.View
      style={[
        styles.bar,
        {
          backgroundColor: theme.accent,
          opacity: fade,
          transform: [{ scale: pulse }],
          shadowColor: theme.accent,
        },
      ]}
    >
      {Icon && (
        <Icon size={20} color={theme.badgeTextColor} strokeWidth={3} style={styles.icon} />
      )}
      <Text style={[styles.label, { color: theme.badgeTextColor }]}>{theme.label}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  idleWrap: { height: 34, justifyContent: 'center', alignItems: 'center' },
  idleLine: { width: 60, height: 3, backgroundColor: '#1e2436', borderRadius: 2 },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 24,
    marginHorizontal: 60, // deixa espaço pros pills de menu/conexão nas pontas
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  icon: { marginRight: 8 },
  label: { fontSize: 16, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase' },
});
