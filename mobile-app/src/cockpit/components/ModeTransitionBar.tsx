/**
 * ModeTransitionBar — Barra Superior de Transição de Modo e Estado de Corrida
 *
 * Barra de estado proeminente, grande e visível para motorsport:
 * - Ocupa destaque na parte superior da tela para leitura instantânea durante a corrida
 * - Ícones vetoriais de alta visibilidade (sem emojis)
 * - Versões completas para Bandeira Vermelha, Safety Car, VSC, Overtake, Modo Reta, Boxes, etc.
 * - Modo Normal: Marcador discreto e silencioso no centro
 * - Animações Reanimated 100% nativas
 */

import React, { useEffect, useRef, memo } from 'react';
import { StyleSheet, Text, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  cancelAnimation,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Flag,
  ShieldAlert,
  Zap,
  Wind,
  Wrench,
  Timer,
  FlagTriangleRight,
  CloudRain,
} from 'lucide-react-native';
import { CockpitTheme, CockpitStateKey } from '../theme/types';

interface ModeTransitionBarProps {
  theme: CockpitTheme;
}

interface ModeVisualConfig {
  title: string;
  subtitle: string;
  IconComponent: React.ComponentType<any>;
  background: [string, string];
  textColor: string;
  subTextColor: string;
  iconBg: string;
  iconColor: string;
  borderColor: string;
  shadowColor: string;
}

const getModeVisualConfig = (theme: CockpitTheme): ModeVisualConfig => {
  switch (theme.key) {
    case CockpitStateKey.RED_FLAG:
      return {
        title: 'BANDEIRA VERMELHA · SESSÃO SUSPENSA',
        subtitle: 'REDUZA VELOCIDADE · RETORNO OBRIGATÓRIO AOS BOXES',
        IconComponent: Flag,
        background: ['#ef4444', '#dc2626'],
        textColor: '#ffffff',
        subTextColor: '#fee2e2',
        iconBg: '#ffffff',
        iconColor: '#dc2626',
        borderColor: '#fca5a5',
        shadowColor: '#ef4444',
      };
    case CockpitStateKey.SAFETY_CAR:
      return {
        title: 'SAFETY CAR (SC) NA PISTA',
        subtitle: 'VELOCIDADE CONTROLADA · MANTENHA DELTA POSITIVO',
        IconComponent: ShieldAlert,
        background: ['#facc15', '#eab308'],
        textColor: '#000000',
        subTextColor: '#261b00',
        iconBg: '#000000',
        iconColor: '#facc15',
        borderColor: '#fef08a',
        shadowColor: '#eab308',
      };
    case CockpitStateKey.VSC:
      return {
        title: 'VIRTUAL SAFETY CAR (VSC)',
        subtitle: 'PROIBIDO ULTRAPASSAR · RESPEITE TEMPO DELTA',
        IconComponent: ShieldAlert,
        background: ['#fb923c', '#ea580c'],
        textColor: '#000000',
        subTextColor: '#2b1100',
        iconBg: '#000000',
        iconColor: '#fb923c',
        borderColor: '#fed7aa',
        shadowColor: '#ea580c',
      };
    case CockpitStateKey.OVERTAKE:
      return {
        title: 'MODO OVERTAKE ATIVADO',
        subtitle: 'POTÊNCIA MÁXIMA ERS · ULTRAPASSAGEM LIBERADA',
        IconComponent: Zap,
        background: ['#3b82f6', '#1d4ed8'],
        textColor: '#ffffff',
        subTextColor: '#dbeafe',
        iconBg: '#ffffff',
        iconColor: '#1d4ed8',
        borderColor: '#93c5fd',
        shadowColor: '#3b82f6',
      };
    case CockpitStateKey.STRAIGHT_MODE:
      return {
        title: 'MODO RETA · ACTIVE AERO (X-MODE)',
        subtitle: 'CONFIGURAÇÃO DE BAIXO ARRASTO · ASA ABERTA',
        IconComponent: Wind,
        background: ['#a855f7', '#7e22ce'],
        textColor: '#ffffff',
        subTextColor: '#f3e8ff',
        iconBg: '#ffffff',
        iconColor: '#7e22ce',
        borderColor: '#d8b4fe',
        shadowColor: '#a855f7',
      };
    case CockpitStateKey.PIT_LANE:
      return {
        title: 'PIT LANE · LIMITADOR 80 KM/H ATIVO',
        subtitle: 'CONTROLE AUTOMÁTICO DE VELOCIDADE LIGADO',
        IconComponent: Wrench,
        background: ['#ec4899', '#be185d'],
        textColor: '#ffffff',
        subTextColor: '#fce7f3',
        iconBg: '#ffffff',
        iconColor: '#be185d',
        borderColor: '#f9a8d4',
        shadowColor: '#ec4899',
      };
    case CockpitStateKey.FASTEST_LAP:
      return {
        title: 'VOLTA MAIS RÁPIDA DA CORRIDA',
        subtitle: 'NOVO RECORDE DA SESSÃO CONQUISTADO',
        IconComponent: Timer,
        background: ['#06b6d4', '#0891b2'],
        textColor: '#000000',
        subTextColor: '#042f2e',
        iconBg: '#000000',
        iconColor: '#06b6d4',
        borderColor: '#a5f3fc',
        shadowColor: '#06b6d4',
      };
    case CockpitStateKey.WET_TRACK:
      return {
        title: 'PISTA MOLHADA · CONDIÇÃO DE CHUVA',
        subtitle: 'ADERÊNCIA REDUZIDA · CUIDADO NAS FRENAGENS',
        IconComponent: CloudRain,
        background: ['#0284c7', '#0369a1'],
        textColor: '#ffffff',
        subTextColor: '#e0f2fe',
        iconBg: '#ffffff',
        iconColor: '#0284c7',
        borderColor: '#7dd3fc',
        shadowColor: '#0284c7',
      };
    case CockpitStateKey.FORMATION_LAP:
      return {
        title: 'PROCEDIMENTO DE LARGADA',
        subtitle: 'VOLTA DE APRESENTAÇÃO · ALINHAMENTO NO GRID',
        IconComponent: FlagTriangleRight,
        background: ['#f8fafc', '#cbd5e1'],
        textColor: '#000000',
        subTextColor: '#334155',
        iconBg: '#000000',
        iconColor: '#ffffff',
        borderColor: '#e2e8f0',
        shadowColor: '#94a3b8',
      };
    default:
      return {
        title: theme.label || 'SISTEMA ATIVO',
        subtitle: 'TELEMETRIA EM PISTA',
        IconComponent: Zap,
        background: [theme.accent || '#3b82f6', theme.cardBorder || '#1d4ed8'],
        textColor: theme.badgeTextColor || '#ffffff',
        subTextColor: theme.badgeTextColor === '#000000' ? '#1f2937' : '#e2e8f0',
        iconBg: theme.badgeTextColor === '#000000' ? '#000000' : '#ffffff',
        iconColor: theme.accent || '#3b82f6',
        borderColor: theme.accent || '#3b82f6',
        shadowColor: theme.accent || '#3b82f6',
      };
  }
};

export const ModeTransitionBar: React.FC<ModeTransitionBarProps> = memo(({ theme }) => {
  const isNormal = theme.key === CockpitStateKey.NORMAL;
  const prevKeyRef = useRef(theme.key);

  // Reanimated shared values
  const scaleX = useSharedValue(isNormal ? 0.05 : 1);
  const opacity = useSharedValue(isNormal ? 0 : 1);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const prevKey = prevKeyRef.current;
    prevKeyRef.current = theme.key;

    if (isNormal) {
      // Retração suave para modo normal
      scaleX.value = withTiming(0.05, {
        duration: 220,
        easing: Easing.in(Easing.cubic),
      });
      opacity.value = withTiming(0, {
        duration: 180,
        easing: Easing.in(Easing.linear),
      });
    } else {
      if (prevKey === CockpitStateKey.NORMAL) {
        // Entrada do modo a partir do normal: expande do centro
        scaleX.value = 0.05;
        opacity.value = 0;

        scaleX.value = withTiming(1, {
          duration: 320,
          easing: Easing.out(Easing.cubic),
        });
        opacity.value = withTiming(1, {
          duration: 260,
          easing: Easing.out(Easing.quad),
        });
      } else if (prevKey !== theme.key) {
        // Transição entre dois modos ativos: transição elástica rápida
        scaleX.value = withSequence(
          withTiming(0.75, { duration: 90, easing: Easing.in(Easing.quad) }),
          withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) })
        );
        opacity.value = withSequence(
          withTiming(0.4, { duration: 90 }),
          withTiming(1, { duration: 180 })
        );
      }
    }
  }, [theme.key, isNormal, scaleX, opacity]);

  // Efeito de pulso para estados de alerta crítico
  useEffect(() => {
    cancelAnimation(pulseScale);
    const isCritical =
      theme.key === CockpitStateKey.RED_FLAG ||
      theme.key === CockpitStateKey.SAFETY_CAR ||
      theme.key === CockpitStateKey.VSC;

    if (isCritical) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.025, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          withTiming(1.0, { duration: 420, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 150 });
    }
  }, [theme.key, isNormal, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scaleX: scaleX.value },
      { scaleY: pulseScale.value },
    ],
  }));

  const {
    title,
    subtitle,
    IconComponent,
    background,
    textColor,
    subTextColor,
    iconBg,
    iconColor,
    borderColor,
    shadowColor,
  } = getModeVisualConfig(theme);

  return (
    <View style={styles.outerContainer}>
      {/* Marcador discreto no modo normal */}
      {isNormal && (
        <View style={styles.idleMarker}>
          <View style={styles.idleLine} />
        </View>
      )}

      {/* Barra de Estado Proeminente estilo Fórmula 1 */}
      <Animated.View style={[styles.barWrapper, animatedStyle]}>
        <LinearGradient
          colors={background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.barGradient,
            {
              borderColor,
              shadowColor,
            },
          ]}
        >
          {/* Caixa de Ícone em Alto Contraste */}
          <View style={[styles.iconBox, { backgroundColor: iconBg }]}>
            <IconComponent size={22} color={iconColor} strokeWidth={3} />
          </View>

          {/* Textos com Tipografia e Contraste Fórmula 1 */}
          <View style={styles.textContainer}>
            <Text
              style={[styles.titleText, { color: textColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
            <Text
              style={[styles.subtitleText, { color: subTextColor }]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
});

ModeTransitionBar.displayName = 'ModeTransitionBar';

const styles = StyleSheet.create({
  outerContainer: {
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  idleMarker: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  idleLine: {
    width: 64,
    height: 3,
    backgroundColor: '#1b2234',
    borderRadius: 2,
  },
  barWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '92%',
    maxWidth: 660,
  },
  barGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 16,
    elevation: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    fontFamily: Platform.select({
      ios: 'HelveticaNeue-CondensedBlack',
      android: 'sans-serif-condensed',
      default: 'sans-serif',
    }),
    fontSize: 14,
    fontWeight: '900',
    fontStyle: 'italic',
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
  subtitleText: {
    fontFamily: Platform.select({
      ios: 'HelveticaNeue-CondensedBold',
      android: 'sans-serif-condensed',
      default: 'sans-serif',
    }),
    fontSize: 9.5,
    fontWeight: '800',
    fontStyle: 'italic',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: 1,
  },
});
