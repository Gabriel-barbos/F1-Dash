/**
 * EventBadge — Badge superior do cockpit
 *
 * Renderiza um badge em cápsula neon de alta fidelidade
 * correspondente ao design de motorsport das referências.
 * Utiliza ícones vetoriais do lucide-react-native e glow intenso.
 */

import React, { useEffect, useRef, memo } from 'react';
import {
  Animated,
  Text,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import {
  ChevronsRight,
  Flag,
  ShieldAlert,
  Zap,
  Wrench,
  Timer,
  FlagTriangleRight,
  CloudRain,
} from 'lucide-react-native';
import { CockpitTheme, CockpitStateKey } from '../theme/types';

interface EventBadgeProps {
  theme: CockpitTheme;
  style?: ViewStyle;
}

export const EventBadge: React.FC<EventBadgeProps> = memo(({ theme, style }) => {
  const isNormal = theme.key === CockpitStateKey.NORMAL;

  const fadeAnim = useRef(new Animated.Value(isNormal ? 0 : 1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: isNormal ? 0 : 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isNormal, fadeAnim]);

  useEffect(() => {
    if (pulseRef.current) {
      pulseRef.current.stop();
      pulseRef.current = null;
    }

    if (theme.badgePulsing && !isNormal) {
      pulseRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulseRef.current.start();
    } else {
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      pulseRef.current?.stop();
    };
  }, [theme.badgePulsing, theme.key, isNormal, pulseAnim]);

  if (isNormal) {
    return (
      <View style={[styles.placeholder, style]}>
        <View style={styles.idleLine} />
      </View>
    );
  }

  const renderIcon = () => {
    const iconProps = { size: 16, color: theme.accent, strokeWidth: 2.8 };

    switch (theme.key) {
      case CockpitStateKey.OVERTAKE:
        return <ChevronsRight {...iconProps} />;
      case CockpitStateKey.RED_FLAG:
        return <Flag {...iconProps} />;
      case CockpitStateKey.SAFETY_CAR:
      case CockpitStateKey.VSC:
        return <ShieldAlert {...iconProps} />;
      case CockpitStateKey.STRAIGHT_MODE:
        return <Zap {...iconProps} />;
      case CockpitStateKey.PIT_LANE:
        return <Wrench {...iconProps} />;
      case CockpitStateKey.FASTEST_LAP:
        return <Timer {...iconProps} />;
      case CockpitStateKey.FORMATION_LAP:
        return <FlagTriangleRight {...iconProps} />;
      case CockpitStateKey.WET_TRACK:
        return <CloudRain {...iconProps} />;
      default:
        return null;
    }
  };

  return (
    <Animated.View
      style={[
        styles.wrapper,
        style,
        {
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
          borderColor: theme.accent,
          shadowColor: theme.accent,
        },
      ]}
    >
      <View style={[styles.innerGlow, { backgroundColor: theme.background.secondary }]}>
        <View style={styles.iconWrapper}>{renderIcon()}</View>
        <Text style={[styles.label, { color: '#ffffff' }]}>
          {theme.label}
        </Text>
      </View>
    </Animated.View>
  );
});

EventBadge.displayName = 'EventBadge';

const styles = StyleSheet.create({
  placeholder: {
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleLine: {
    width: 60,
    height: 3,
    backgroundColor: '#1e2436',
    borderRadius: 2,
  },
  wrapper: {
    borderRadius: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.95,
    shadowRadius: 16,
    elevation: 12,
    overflow: 'hidden',
    alignSelf: 'center',
  },
  innerGlow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 7,
    gap: 8,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
});
