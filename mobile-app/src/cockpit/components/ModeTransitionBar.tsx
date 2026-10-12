/**
 * ModeTransitionBar — Banner Superior de Estado de Corrida (estilo F1 TV)
 *
 * Linguagem visual dos gráficos de transmissão da Fórmula 1:
 * - Painel escuro (#15151E) com cantos retos e fio de acento na cor do estado
 * - Tag colorida inclinada (paralelogramo) com ícone de alto contraste
 * - Tipografia Titillium Black Italic (título) + SemiBold (subtítulo)
 * - Indicador vivo à direita: chevrons (Overtake / Reta), gotas (Chuva), pulso (alertas)
 *
 * Coreografia (Reanimated, UI thread):
 * - Entrada: tag desliza → painel faz wipe da esquerda → textos escalonados → shimmer
 * - Troca:   flash na tag + texto sai/entra
 * - Saída:   ordem inversa, retendo o último estado até o fim da animação
 * - Modo Normal: marcador discreto no centro
 */

import React, { useEffect, memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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
import { F1Font } from '../../theme/typography';
import {
  F1_PANEL,
  SlantTag,
  Chevrons,
  RainDrops,
  PulseBlock,
  Shimmer,
  useBannerTransition,
  withAlpha,
} from './f1Banner';

interface ModeTransitionBarProps {
  theme: CockpitTheme;
}

type LiveIndicator = 'chevrons' | 'rain' | 'pulse' | 'none';

interface ModeVisualConfig {
  /** Código curto exibido à direita (estilo F1 TV) */
  code: string;
  title: string;
  subtitle: string;
  IconComponent: React.ComponentType<any>;
  /** Cor do estado (tag, acento, indicador) */
  color: string;
  /** Cor do ícone sobre a tag */
  iconColor: string;
  indicator: LiveIndicator;
  critical: boolean;
}

const getModeVisualConfig = (theme: CockpitTheme): ModeVisualConfig => {
  switch (theme.key) {
    case CockpitStateKey.RED_FLAG:
      return {
        code: 'RED FLAG',
        title: 'BANDEIRA VERMELHA · SESSÃO SUSPENSA',
        subtitle: 'REDUZA VELOCIDADE · RETORNO OBRIGATÓRIO AOS BOXES',
        IconComponent: Flag,
        color: '#E10600',
        iconColor: '#ffffff',
        indicator: 'pulse',
        critical: true,
      };
    case CockpitStateKey.SAFETY_CAR:
      return {
        code: 'SC',
        title: 'SAFETY CAR NA PISTA',
        subtitle: 'VELOCIDADE CONTROLADA · MANTENHA DELTA POSITIVO',
        IconComponent: ShieldAlert,
        color: '#FFD12E',
        iconColor: '#15151E',
        indicator: 'pulse',
        critical: true,
      };
    case CockpitStateKey.VSC:
      return {
        code: 'VSC',
        title: 'VIRTUAL SAFETY CAR',
        subtitle: 'PROIBIDO ULTRAPASSAR · RESPEITE TEMPO DELTA',
        IconComponent: ShieldAlert,
        color: '#FF8700',
        iconColor: '#15151E',
        indicator: 'pulse',
        critical: true,
      };
    case CockpitStateKey.OVERTAKE:
      return {
        code: 'OVTK',
        title: 'OVERTAKE ATIVADO',
        subtitle: 'POTÊNCIA MÁXIMA ERS · ULTRAPASSAGEM LIBERADA',
        IconComponent: Zap,
        color: '#2F80FF',
        iconColor: '#ffffff',
        indicator: 'chevrons',
        critical: false,
      };
    case CockpitStateKey.STRAIGHT_MODE:
      return {
        code: 'X-MODE',
        title: 'MODO RETA · ACTIVE AERO',
        subtitle: 'CONFIGURAÇÃO DE BAIXO ARRASTO · ASA ABERTA',
        IconComponent: Wind,
        color: '#9D5CFF',
        iconColor: '#ffffff',
        indicator: 'chevrons',
        critical: false,
      };
    case CockpitStateKey.PIT_LANE:
      return {
        code: 'PIT',
        title: 'PIT LANE · LIMITADOR 80 KM/H',
        subtitle: 'CONTROLE AUTOMÁTICO DE VELOCIDADE LIGADO',
        IconComponent: Wrench,
        color: '#FF2E93',
        iconColor: '#ffffff',
        indicator: 'none',
        critical: false,
      };
    case CockpitStateKey.FASTEST_LAP:
      return {
        code: 'FL',
        title: 'VOLTA MAIS RÁPIDA',
        subtitle: 'NOVO RECORDE DA SESSÃO CONQUISTADO',
        IconComponent: Timer,
        color: '#C13BFF',
        iconColor: '#ffffff',
        indicator: 'none',
        critical: false,
      };
    case CockpitStateKey.WET_TRACK:
      return {
        code: 'WET',
        title: 'PISTA MOLHADA',
        subtitle: 'ADERÊNCIA REDUZIDA · CUIDADO NAS FRENAGENS',
        IconComponent: CloudRain,
        color: '#1FA3FF',
        iconColor: '#ffffff',
        indicator: 'rain',
        critical: false,
      };
    case CockpitStateKey.FORMATION_LAP:
      return {
        code: 'START',
        title: 'PROCEDIMENTO DE LARGADA',
        subtitle: 'VOLTA DE APRESENTAÇÃO · ALINHAMENTO NO GRID',
        IconComponent: FlagTriangleRight,
        color: '#F1F5F9',
        iconColor: '#15151E',
        indicator: 'none',
        critical: false,
      };
    default:
      return {
        code: '',
        title: theme.label || 'SISTEMA ATIVO',
        subtitle: 'TELEMETRIA EM PISTA',
        IconComponent: Zap,
        color: theme.accent || '#3b82f6',
        iconColor: theme.badgeTextColor || '#ffffff',
        indicator: 'none',
        critical: false,
      };
  }
};

/** Acento inferior com pulso opcional para estados críticos */
const AccentLine: React.FC<{ color: string; critical: boolean }> = ({ color, critical }) => {
  const o = useSharedValue(1);
  useEffect(() => {
    cancelAnimation(o);
    if (critical) {
      o.value = withRepeat(
        withSequence(
          withTiming(0.35, { duration: 420, easing: Easing.inOut(Easing.quad) }),
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) })
        ),
        -1,
        false
      );
    } else {
      o.value = withTiming(1, { duration: 150 });
    }
    return () => cancelAnimation(o);
  }, [critical, o]);
  const style = useAnimatedStyle(() => ({ opacity: o.value }));
  return <Animated.View style={[styles.accentLine, { backgroundColor: color }, style]} />;
};

export const ModeTransitionBar: React.FC<ModeTransitionBarProps> = memo(({ theme }) => {
  const isNormal = theme.key === CockpitStateKey.NORMAL;
  const config = isNormal ? null : getModeVisualConfig(theme);

  const { shown, tagStyle, panelStyle, titleStyle, subStyle, flashStyle, shimmer } =
    useBannerTransition<ModeVisualConfig>(isNormal ? null : theme.key, config);

  return (
    <View style={styles.outerContainer}>
      {/* Marcador discreto no modo normal */}
      {isNormal && (
        <View style={styles.idleMarker} pointerEvents="none">
          <View style={styles.idleLine} />
        </View>
      )}

      {shown && (
        <View style={styles.barWrapper}>
          {/* Painel principal com wipe da esquerda */}
          <Animated.View style={[styles.panel, panelStyle]}>
            <LinearGradient
              colors={[withAlpha(shown.color, 0.32), withAlpha(shown.color, 0.06), 'rgba(0,0,0,0)']}
              locations={[0, 0.45, 1]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.tagSpacer} />

            <View style={styles.textContainer}>
              <Animated.Text style={[styles.titleText, titleStyle]} numberOfLines={1}>
                {shown.title}
              </Animated.Text>
              <Animated.Text style={[styles.subtitleText, subStyle]} numberOfLines={1}>
                {shown.subtitle}
              </Animated.Text>
            </View>

            {/* Indicador vivo + código curto */}
            <Animated.View style={[styles.rightBlock, titleStyle]}>
              {shown.indicator === 'chevrons' && <Chevrons color={shown.color} size={17} />}
              {shown.indicator === 'rain' && <RainDrops color={shown.color} size={20} />}
              {shown.indicator === 'pulse' && <PulseBlock color={shown.color} size={9} />}
              {!!shown.code && (
                <View style={[styles.codeBox, { borderColor: withAlpha(shown.color, 0.55) }]}>
                  <Text style={[styles.codeText, { color: shown.color }]}>{shown.code}</Text>
                </View>
              )}
            </Animated.View>

            <AccentLine color={shown.color} critical={shown.critical} />
            <Shimmer progress={shimmer} />
          </Animated.View>

          {/* Tag inclinada com ícone (entra antes e sai por último) */}
          <Animated.View style={[styles.tagContainer, tagStyle]}>
            <SlantTag color={shown.color} width={50} height={40}>
              <shown.IconComponent size={21} color={shown.iconColor} strokeWidth={2.8} />
              <Animated.View style={[styles.tagFlash, flashStyle]} pointerEvents="none" />
            </SlantTag>
          </Animated.View>
        </View>
      )}
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
    width: '92%',
    maxWidth: 660,
    height: 44,
    justifyContent: 'center',
  },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
    width: '100%',
    backgroundColor: F1_PANEL,
    borderRadius: 3,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    paddingRight: 12,
    transformOrigin: 'left center',
  },
  tagSpacer: {
    width: 62,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  titleText: {
    color: '#ffffff',
    fontFamily: F1Font.black,
    fontSize: 15,
    lineHeight: 18,
    letterSpacing: 1.6,
    fontStyle: 'italic',
    includeFontPadding: false,
  },
  subtitleText: {
    color: '#9aa3b5',
    fontFamily: F1Font.semi,
    fontSize: 9.5,
    lineHeight: 12,
    letterSpacing: 1.4,
    includeFontPadding: false,
  },
  rightBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginLeft: 10,
  },
  codeBox: {
    borderWidth: 1,
    borderRadius: 2,
    paddingHorizontal: 6,
    paddingVertical: 1,
    transform: [{ skewX: '-10deg' }],
  },
  codeText: {
    fontFamily: F1Font.black,
    fontSize: 11,
    letterSpacing: 1.4,
    includeFontPadding: false,
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 2,
  },
  tagContainer: {
    position: 'absolute',
    left: 4,
    top: 2,
  },
  tagFlash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    transform: [{ skewX: '-14deg' }],
    borderRadius: 2,
  },
});
