import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable
} from 'react-native';

interface MomentaryOverlayContainerProps {
  durationSeconds?: number;
  onDismiss: () => void;
  title?: string;
  badge?: string;
  badgeColor?: string;
  children: React.ReactNode;
}

export const MomentaryOverlayContainer: React.FC<MomentaryOverlayContainerProps> = ({
  durationSeconds = 5,
  onDismiss,
  title,
  badge,
  badgeColor = '#ef4444',
  children
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState(durationSeconds);

  useEffect(() => {
    setSecondsRemaining(durationSeconds);
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onDismiss();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [durationSeconds, onDismiss]);

  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / durationSeconds) * 100));

  return (
    <View style={styles.overlayRoot}>
      {/* Top Countdown Bar */}
      <View style={styles.topCountdownBar}>
        <View
          style={[
            styles.progressBar,
            { width: `${progressPercent}%`, backgroundColor: badgeColor }
          ]}
        />
      </View>

      {/* Header with Title, Badge and Close */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          {badge && (
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          {title && <Text style={styles.titleText}>{title}</Text>}
        </View>

        <TouchableOpacity
          onPress={onDismiss}
          style={styles.dismissBtn}
          activeOpacity={0.7}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={styles.dismissText}>✕ RETORNAR ({secondsRemaining}s)</Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      <View style={styles.contentContainer}>
        {children}
      </View>

      {/* Footer hint */}
      <Pressable onPress={onDismiss} style={styles.footerHint}>
        <Text style={styles.footerText}>TOQUE EM QUALQUER LUGAR OU AGUARDE O RETORNO AO DISPLAY</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(5, 7, 12, 0.96)',
    zIndex: 9999,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10
  },
  topCountdownBar: {
    height: 4,
    width: '100%',
    backgroundColor: '#1e2436',
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8
  },
  progressBar: {
    height: '100%',
    borderRadius: 2
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)'
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1
  },
  titleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  dismissBtn: {
    backgroundColor: '#1e2436',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  dismissText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  footerHint: {
    alignItems: 'center',
    paddingVertical: 4
  },
  footerText: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 1
  }
});
