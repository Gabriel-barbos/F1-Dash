import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafetyCarStatus } from '../core/models/session';
import { Formatters } from '../core/utils/formatters';

interface SafetyCarBannerProps {
  status: SafetyCarStatus;
  isRedFlagActive: boolean;
  delta?: number;
}

export const SafetyCarBanner: React.FC<SafetyCarBannerProps> = ({
  status,
  isRedFlagActive,
  delta = 0
}) => {
  if (isRedFlagActive) {
    return (
      <View style={[styles.banner, { backgroundColor: '#ef4444' }]}>
        <Text style={styles.bannerText}>🛑 BANDEIRA VERMELHA / RED FLAG - SESSÃO SUSPENSA</Text>
      </View>
    );
  }

  const scInfo = Formatters.getSafetyCarInfo(status);
  if (!scInfo.active) {
    return null;
  }

  const deltaText = delta !== 0 ? ` | DELTA: ${Formatters.formatDelta(delta * 1000)}` : '';

  return (
    <View style={[styles.banner, { backgroundColor: scInfo.color }]}>
      <Text style={styles.bannerText}>
        ⚠️ {scInfo.label} {deltaText}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 6
  },
  bannerText: {
    color: '#000000',
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.2
  }
});
