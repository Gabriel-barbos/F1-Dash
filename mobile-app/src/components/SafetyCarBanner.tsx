import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafetyCarStatus } from '../core/models/session';

interface SafetyCarBannerProps {
  status: SafetyCarStatus;
  delta: number;
  speedLimit?: number;
}

export const SafetyCarBanner: React.FC<SafetyCarBannerProps> = ({
  status,
  delta,
  speedLimit = 80
}) => {
  const isVSC = status === SafetyCarStatus.VirtualSafetyCar;
  const title = isVSC ? 'VSC' : 'SAFETY CAR';
  const subtitle = isVSC ? 'VIRTUAL SAFETY CAR' : 'SC';

  return (
    <View style={styles.container}>
      {/* Faixas de alerta no topo */}
      <View style={styles.hazardBar}>
        <Text style={styles.hazardStripes}>/// /// /// /// /// /// /// /// /// /// /// /// /// /// ///</Text>
      </View>

      <View style={styles.content}>
        {/* Título Central */}
        <Text style={styles.titleText}>{title}</Text>
        <Text style={styles.subTitleText}>{subtitle}</Text>
        <Text style={styles.instructionText}>REDUCE PACE • NO OVERTAKING</Text>

        {/* Informações de Velocidade e Delta */}
        <View style={styles.infoRow}>
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>SPEED LIMIT</Text>
            <Text style={styles.infoValue}>{speedLimit} <Text style={styles.unitText}>KM/H</Text></Text>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>DELTA</Text>
            <Text style={[styles.infoValue, { color: delta >= 0 ? '#22c55e' : '#ef4444' }]}>
              {delta >= 0 ? + : delta.toFixed(3)}
            </Text>
          </View>
        </View>
      </View>

      {/* Faixas de alerta no rodapé */}
      <View style={styles.hazardBar}>
        <Text style={styles.hazardStripes}>/// /// /// /// /// /// /// /// /// /// /// /// /// /// ///</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#382503',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#eab308',
    overflow: 'hidden',
    width: '100%',
    alignItems: 'center'
  },
  hazardBar: {
    width: '100%',
    backgroundColor: '#854d0e',
    paddingVertical: 2,
    alignItems: 'center'
  },
  hazardStripes: {
    color: '#facc15',
    fontWeight: '900',
    fontSize: 10,
    letterSpacing: 2
  },
  content: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center'
  },
  titleText: {
    color: '#facc15',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 2,
    textShadowColor: 'rgba(250, 204, 21, 0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10
  },
  subTitleText: {
    color: '#fef08a',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4
  },
  instructionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12
  },
  infoRow: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 4
  },
  infoBox: {
    alignItems: 'center'
  },
  infoLabel: {
    color: '#fde047',
    fontSize: 10,
    fontWeight: '700'
  },
  infoValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900'
  },
  unitText: {
    fontSize: 12,
    color: '#e2e8f0',
    fontWeight: '700'
  }
});
