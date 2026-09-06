/**
 * DynamicStatusIndicator — Sistema Dinâmico de Indicadores de Estado do Carro
 *
 * Exibe o estado operacional prioritário do carro com transição animada:
 * - DRS OPEN / DRS AVAILABLE (Regulamento 2025)
 * - ACTIVE AERO / MODO RETA (Regulamento 2026)
 * - OVERTAKE ACTIVE / OVERTAKE DISPONÍVEL
 * - BOOST MANUAL
 *
 * Estilo visual de HUD de motorsport (sem aspecto de botões clicáveis).
 */

import React, { useEffect, useRef, memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Zap, Wind, Gauge } from 'lucide-react-native';
import { ERSDeployMode } from '@f1-dash/telemetry-core';

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
  bg: string;
  icon?: 'zap' | 'wind' | 'gauge';
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
        color: '#a855f7',
        bg: 'rgba(168, 85, 247, 0.16)',
        icon: 'wind',
      };
    } else if (overtakeActive) {
      currentStatus = {
        id: 'OVTK_ACTIVE',
        label: 'OVERTAKE ATIVO',
        color: '#f97316',
        bg: 'rgba(249, 115, 22, 0.16)',
        icon: 'zap',
      };
    } else if (activeAeroAvailable) {
      currentStatus = {
        id: 'AERO_AVAIL',
        label: activeAeroActivationDistance > 0 ? `RETA A ${activeAeroActivationDistance}M` : 'RETA DISPONÍVEL',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.12)',
        icon: 'wind',
      };
    } else if (overtakeAvailable) {
      currentStatus = {
        id: 'OVTK_AVAIL',
        label: overtakeActivationDistance > 0 ? `OVTK A ${overtakeActivationDistance}M` : 'OVERTAKE LIBERADO',
        color: '#eab308',
        bg: 'rgba(234, 179, 8, 0.12)',
        icon: 'zap',
      };
    }
  } else {
    // Regulamento 2025
    if (drsActive) {
      currentStatus = {
        id: 'DRS_ACTIVE',
        label: 'DRS ATIVO',
        color: '#22c55e',
        bg: 'rgba(34, 197, 94, 0.16)',
        icon: 'wind',
      };
    } else if (drsAllowed) {
      currentStatus = {
        id: 'DRS_AVAIL',
        label: 'DRS DISPONÍVEL',
        color: '#38bdf8',
        bg: 'rgba(56, 189, 248, 0.12)',
        icon: 'wind',
      };
    }
  }

  // Boost manual se nenhum outro estado operacional de asa estiver ativo
  if (!currentStatus && ersDeployMode === ERSDeployMode.Overtake) {
    currentStatus = {
      id: 'BOOST_ACTIVE',
      label: 'BOOST ERS',
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.16)',
      icon: 'zap',
    };
  }

  // Animação Reanimated na mudança de status
  const prevIdRef = useRef(currentStatus?.id);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    const currentId = currentStatus?.id;
    if (prevIdRef.current !== currentId) {
      prevIdRef.current = currentId;

      opacity.value = withSequence(
        withTiming(0.2, { duration: 80 }),
        withTiming(1, { duration: 180, easing: Easing.out(Easing.cubic) })
      );

      scale.value = withSequence(
        withTiming(0.95, { duration: 80 }),
        withTiming(1, { duration: 180, easing: Easing.out(Easing.back(1.5)) })
      );
    }
  }, [currentStatus?.id, opacity, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  if (!currentStatus) {
    // Espaço reservado com altura fixa para não provocar saltos de layout
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.idleDot} />
      </View>
    );
  }

  const renderIcon = () => {
    switch (currentStatus?.icon) {
      case 'wind':
        return <Wind size={11} color={currentStatus.color} strokeWidth={2.5} />;
      case 'zap':
        return <Zap size={11} color={currentStatus.color} strokeWidth={2.5} />;
      default:
        return <Gauge size={11} color={currentStatus?.color} strokeWidth={2.5} />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.badgeContainer,
        {
          borderColor: currentStatus.color,
          backgroundColor: currentStatus.bg,
          shadowColor: currentStatus.color,
        },
        animatedStyle,
      ]}
    >
      {renderIcon()}
      <Text style={[styles.badgeText, { color: currentStatus.color }]}>
        {currentStatus.label}
      </Text>
    </Animated.View>
  );
});

DynamicStatusIndicator.displayName = 'DynamicStatusIndicator';

const styles = StyleSheet.create({
  emptyContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  idleDot: {
    width: 20,
    height: 2,
    backgroundColor: '#151926',
    borderRadius: 1,
  },
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 4,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
});
