/**
 * DynamicStatusIndicator — Indicador Compacto de Estado Operacional (estilo F1 TV)
 *
 * Exibe o estado operacional prioritário do carro:
 * - DRS ATIVO / DRS DISPONÍVEL (Regulamento 2025)
 * - ACTIVE AERO / MODO RETA (Regulamento 2026)
 * - OVERTAKE ATIVO / OVERTAKE DISPONÍVEL
 * - BOOST ERS
 *
 * Versão compacta do banner F1 TV: tag inclinada + painel escuro + fio de acento.
 * Possui entrada, troca e saída animadas (o último estado é retido durante a saída)
 * e altura reservada fixa para não provocar saltos de layout.
 */

import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Wind, Gauge } from 'lucide-react-native';
import { ERSDeployMode } from '@f1-dash/telemetry-core';
import { F1Font } from '../../theme/typography';
import {
  F1_PANEL,
  SlantTag,
  Chevrons,
  Shimmer,
  useBannerTransition,
  withAlpha,
} from './f1Banner';

interface DynamicStatusIndicatorProps {
  drsActive?: boolean;
  drsAllowed?: boolean;
  is2026Regulations?: boolean;
  activeAeroMode?: number;
  activeAeroAvailable?: boolean;
  activeAeroActivationDistance?: number;
  overtakeActive?: boolean;
  overtakeAvailable?: boolean;
  overtakeActivationDistance?: number;
  ersDeployMode?: ERSDeployMode;
}

interface StatusItem {
  id: string;
  label: string;
  color: string;
  iconColor: string;
  icon: 'zap' | 'wind' | 'gauge';
  /** Estado efetivamente ativo (mostra chevrons animados) */
  live: boolean;
}

export const DynamicStatusIndicator: React.FC<DynamicStatusIndicatorProps> = memo(({
  drsActive = false,
  drsAllowed = false,
  is2026Regulations = false,
  activeAeroMode = 0,
  activeAeroAvailable = false,
  activeAeroActivationDistance = 0,
  overtakeActive = false,
  overtakeAvailable = false,
  overtakeActivationDistance = 0,
  ersDeployMode = ERSDeployMode.Medium,
}) => {
  // Determina o estado ativo de maior prioridade operacional
  let currentStatus: StatusItem | null = null;

  if (is2026Regulations) {
    if (activeAeroMode === 1) {
      currentStatus = {
        id: 'AERO_ACTIVE',
        label: 'ACTIVE AERO · X-MODE',
        color: '#9D5CFF',
        iconColor: '#ffffff',
        icon: 'wind',
        live: true,
      };
    } else if (overtakeActive) {
      currentStatus = {
        id: 'OVTK_ACTIVE',
        label: 'OVERTAKE ATIVO',
        color: '#2F80FF',
        iconColor: '#ffffff',
        icon: 'zap',
        live: true,
      };
    } else if (activeAeroAvailable) {
      currentStatus = {
        id: 'AERO_AVAIL',
        label: activeAeroActivationDistance > 0 ? `RETA A ${activeAeroActivationDistance}M` : 'RETA DISPONÍVEL',
        color: '#38bdf8',
        iconColor: '#15151E',
        icon: 'wind',
        live: false,
      };
    } else if (overtakeAvailable) {
      currentStatus = {
        id: 'OVTK_AVAIL',
        label: overtakeActivationDistance > 0 ? `OVTK A ${overtakeActivationDistance}M` : 'OVERTAKE LIBERADO',
        color: '#FFD12E',
        iconColor: '#15151E',
        icon: 'zap',
        live: false,
      };
    }
  } else {
    // Regulamento 2025
    if (drsActive) {
      currentStatus = {
        id: 'DRS_ACTIVE',
        label: 'DRS ATIVO',
        color: '#00D45E',
        iconColor: '#06210f',
        icon: 'wind',
        live: true,
      };
    } else if (drsAllowed) {
      currentStatus = {
        id: 'DRS_AVAIL',
        label: 'DRS DISPONÍVEL',
        color: '#38bdf8',
        iconColor: '#15151E',
        icon: 'wind',
        live: false,
      };
    }
  }

  // Boost manual se nenhum outro estado operacional de asa estiver ativo
  if (!currentStatus && ersDeployMode === ERSDeployMode.Overtake) {
    currentStatus = {
      id: 'BOOST_ACTIVE',
      label: 'BOOST ERS',
      color: '#3b82f6',
      iconColor: '#ffffff',
      icon: 'zap',
      live: true,
    };
  }

  const { shown, tagStyle, panelStyle, titleStyle, flashStyle, shimmer } =
    useBannerTransition<StatusItem>(currentStatus?.id ?? null, currentStatus, { speed: 0.8 });

  const renderIcon = (item: StatusItem) => {
    const props = { size: 12, color: item.iconColor, strokeWidth: 2.8 };
    switch (item.icon) {
      case 'wind':
        return <Wind {...props} />;
      case 'zap':
        return <Zap {...props} />;
      default:
        return <Gauge {...props} />;
    }
  };

  return (
    <View style={styles.reserve}>
      {!shown && <View style={styles.idleDot} />}

      {shown && (
        <View style={styles.wrapper}>
          <Animated.View style={[styles.panel, panelStyle]}>
            <LinearGradient
              colors={[withAlpha(shown.color, 0.28), 'rgba(0,0,0,0)']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.tagSpacer} />
            <Animated.Text style={[styles.label, titleStyle]} numberOfLines={1}>
              {shown.label}
            </Animated.Text>
            {shown.live && (
              <Animated.View style={[styles.chevrons, titleStyle]}>
                <Chevrons color={shown.color} size={12} period={700} />
              </Animated.View>
            )}
            <View style={[styles.accent, { backgroundColor: shown.color }]} />
            <Shimmer progress={shimmer} width={40} />
          </Animated.View>

          <Animated.View style={[styles.tag, tagStyle]}>
            <SlantTag color={shown.color} width={28} height={22}>
              {renderIcon(shown)}
              <Animated.View style={[styles.tagFlash, flashStyle]} pointerEvents="none" />
            </SlantTag>
          </Animated.View>
        </View>
      )}
    </View>
  );
});

DynamicStatusIndicator.displayName = 'DynamicStatusIndicator';

const styles = StyleSheet.create({
  reserve: {
    height: 26,
    minWidth: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleDot: {
    width: 20,
    height: 2,
    backgroundColor: '#151926',
    borderRadius: 1,
  },
  wrapper: {
    height: 26,
    justifyContent: 'center',
  },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 22,
    paddingRight: 10,
    backgroundColor: F1_PANEL,
    borderRadius: 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    transformOrigin: 'left center',
  },
  tagSpacer: {
    width: 34,
  },
  label: {
    color: '#ffffff',
    fontFamily: F1Font.black,
    fontStyle: 'italic',
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 1.3,
    includeFontPadding: false,
  },
  chevrons: {
    marginLeft: 6,
  },
  accent: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
  },
  tag: {
    position: 'absolute',
    left: 2,
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
