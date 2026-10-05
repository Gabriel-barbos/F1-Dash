import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MomentaryOverlayContainer } from './MomentaryOverlayContainer';

export interface TeamRadioMomentaryOverlayProps {
  onDismiss: () => void;
  message: string;
  category?: string;
  tone?: string;
  priority?: string;
  engineerName?: string;
  driverName?: string;
}

export const TeamRadioMomentaryOverlay: React.FC<TeamRadioMomentaryOverlayProps> = ({
  onDismiss,
  message,
  category = 'RADIO',
  tone = 'calm',
  priority = 'HIGH',
  engineerName = 'CLAUDINHO RONALDO',
  driverName = 'GABRIEL'
}) => {
  const [waveHeights, setWaveHeights] = useState<number[]>([10, 22, 35, 18, 28, 40, 25, 14]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 26) + 8));
    }, 140);
    return () => clearInterval(interval);
  }, []);

  const isUrgent = priority === 'CRITICAL' || tone === 'urgent';
  const terracottaPrimary = '#E05A36';
  const badgeColor = isUrgent ? '#ef4444' : terracottaPrimary;

  return (
    <MomentaryOverlayContainer
      durationSeconds={6}
      onDismiss={onDismiss}
      title="TEAM RADIO TRANSMISSION"
      badge="RADIO"
      badgeColor={badgeColor}
    >
      <View style={styles.cardContainer}>
        {/* Header do Rádio */}
        <View style={styles.radioHeader}>
          <View style={styles.liveIndicator}>
            <View style={[styles.pulsingDot, { backgroundColor: badgeColor }]} />
            <Text style={[styles.liveText, { color: badgeColor }]}>● LIVE TRANSMISSION</Text>
          </View>
          <View style={styles.namesRow}>
            <View style={styles.engineerBadge}>
              <Text style={styles.engineerText}>{engineerName}</Text>
            </View>
            <Text style={styles.arrowText}>➔</Text>
            <View style={styles.driverBadge}>
              <Text style={styles.driverText}>{driverName}</Text>
            </View>
          </View>
        </View>

        {/* Mensagem da Fala */}
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>"{message}"</Text>
        </View>

        {/* Rodapé com Waveform Animado */}
        <View style={styles.footerRow}>
          <View style={styles.waveformContainer}>
            {waveHeights.map((h, i) => (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { height: h, backgroundColor: badgeColor }
                ]}
              />
            ))}
          </View>

          <View style={styles.tagGroup}>
            <Text style={styles.categoryTag}>{category.toUpperCase()}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: badgeColor }]}>
              <Text style={styles.priorityText}>{priority}</Text>
            </View>
          </View>
        </View>
      </View>
    </MomentaryOverlayContainer>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: '92%',
    maxWidth: 620,
    backgroundColor: 'rgba(20, 16, 14, 0.95)',
    borderWidth: 2,
    borderColor: '#E05A36',
    borderRadius: 12,
    padding: 18,
    shadowColor: '#E05A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8
  },
  radioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  pulsingDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  liveText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2
  },
  namesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  engineerBadge: {
    backgroundColor: 'rgba(224, 90, 54, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(224, 90, 54, 0.5)'
  },
  engineerText: {
    color: '#FFAB91',
    fontSize: 10,
    fontWeight: '800'
  },
  arrowText: {
    color: '#888',
    fontSize: 10
  },
  driverBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  driverText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '800'
  },
  messageBox: {
    marginVertical: 10
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: 0.3
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)'
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 28
  },
  waveBar: {
    width: 3.5,
    borderRadius: 2
  },
  tagGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  categoryTag: {
    color: '#9CA3AF',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.8
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3
  },
  priorityText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900'
  }
});
