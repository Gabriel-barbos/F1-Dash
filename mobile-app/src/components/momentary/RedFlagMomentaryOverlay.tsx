import React from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CornerDownLeft, Flag, Gauge, OctagonX, ShieldAlert } from 'lucide-react-native';
import { F1Font } from '../../theme/typography';
import { HazardStripes, useLoop, useOverlayTransition } from './fx';

interface RedFlagMomentaryOverlayProps {
  onDismiss: () => void;
}

const RED = '#ef4444';
const RED_DEEP = '#991b1b';
const DURATION_MS = 7000;

const CHIPS = [
  { Icon: CornerDownLeft, label: 'RETURN TO PIT LANE' },
  { Icon: OctagonX, label: 'PIT EXIT CLOSED' },
  { Icon: Gauge, label: 'OBEY PIT LIMITER' }
];

export const RedFlagMomentaryOverlay: React.FC<RedFlagMomentaryOverlayProps> = ({ onDismiss }) => {
  const { enter, countdown, close } = useOverlayTransition(DURATION_MS, onDismiss);
  const { width } = Dimensions.get('window');

  const wave = useLoop(1300, Easing.inOut(Easing.sin), true);
  const sweep = useLoop(2600, Easing.inOut(Easing.quad));
  const flicker = useLoop(900, Easing.inOut(Easing.quad), true);

  // composição de entrada (tudo derivado de `enter` p/ a saída ser o espelho exato)
  const topY = enter.interpolate({ inputRange: [0, 0.5], outputRange: [-60, 0], extrapolate: 'clamp' });
  const botY = enter.interpolate({ inputRange: [0, 0.5], outputRange: [60, 0], extrapolate: 'clamp' });
  const flagScale = enter.interpolate({ inputRange: [0.15, 0.7, 1], outputRange: [0.2, 1.12, 1], extrapolate: 'clamp' });
  const flagOpacity = enter.interpolate({ inputRange: [0.1, 0.4], outputRange: [0, 1], extrapolate: 'clamp' });
  const titleScale = enter.interpolate({ inputRange: [0.25, 0.75, 1], outputRange: [1.6, 0.97, 1], extrapolate: 'clamp' });
  const titleOpacity = enter.interpolate({ inputRange: [0.25, 0.6], outputRange: [0, 1], extrapolate: 'clamp' });
  const subOpacity = enter.interpolate({ inputRange: [0.5, 0.85], outputRange: [0, 1], extrapolate: 'clamp' });
  const subY = enter.interpolate({ inputRange: [0.5, 0.85], outputRange: [14, 0], extrapolate: 'clamp' });
  const chipOpacity = (i: number) =>
    enter.interpolate({ inputRange: [0.55 + i * 0.1, 0.75 + i * 0.1], outputRange: [0, 1], extrapolate: 'clamp' });
  const chipY = (i: number) =>
    enter.interpolate({ inputRange: [0.55 + i * 0.1, 0.75 + i * 0.1], outputRange: [24, 0], extrapolate: 'clamp' });

  const flagRotate = wave.interpolate({ inputRange: [0, 1], outputRange: ['-7deg', '7deg'] });
  const flagLift = wave.interpolate({ inputRange: [0, 1], outputRange: [3, -4] });
  const glow = flicker.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });
  const sweepX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.4, width * 1.1] });
  const countScale = countdown;

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={close}>
      <Animated.View style={[styles.root, { opacity: enter }]}>
        <LinearGradient colors={['#120404', '#3a0b0b', '#120404']} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: glow }]}>
          <LinearGradient colors={['rgba(239,68,68,0)', 'rgba(239,68,68,0.28)', 'rgba(239,68,68,0)']} style={StyleSheet.absoluteFill} />
        </Animated.View>

        {/* feixe de luz varrendo a tela */}
        <Animated.View pointerEvents="none" style={[styles.sweep, { transform: [{ translateX: sweepX }, { skewX: '-18deg' }] }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.10)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* listras de pista no topo e na base, em sentidos opostos */}
        <Animated.View style={[styles.stripesTop, { transform: [{ translateY: topY }] }]}>
          <HazardStripes height={22} colorA="#0b0303" colorB={RED} stripe={22} periodMs={1500} />
        </Animated.View>
        <Animated.View style={[styles.stripesBottom, { transform: [{ translateY: botY }] }]}>
          <HazardStripes height={22} colorA="#0b0303" colorB={RED} stripe={22} periodMs={1500} reverse />
        </Animated.View>

        {/* cabeçalho Race Control */}
        <Animated.View style={[styles.header, { opacity: subOpacity }]}>
          <ShieldAlert size={16} color={RED} strokeWidth={2.4} />
          <Text style={styles.headerText}>RACE CONTROL</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.headerSub}>FIA MESSAGE</Text>
        </Animated.View>

        {/* conteúdo central — Gráfico oficial F1 Broadcast Red Flag */}
        <View style={styles.center}>
          <Animated.View
            style={[
              styles.broadcastCard,
              {
                opacity: titleOpacity,
                transform: [{ scale: titleScale }]
              }
            ]}
          >
            {/* Faixa superior vermelha com linhas finas escuras no topo + "RED FLAG" */}
            <View style={styles.broadcastTop}>
              <View style={styles.broadcastTopLines}>
                <View style={styles.broadcastThinLine} />
                <View style={styles.broadcastThinLine} />
              </View>
              <View style={styles.broadcastTitleRow}>
                <Animated.View
                  style={{
                    opacity: flagOpacity,
                    transform: [{ scale: flagScale }, { translateY: flagLift }, { rotate: flagRotate }]
                  }}
                >
                  <Flag size={36} color="#ffffff" fill="#ffffff" strokeWidth={2} />
                </Animated.View>
                <Text style={styles.broadcastTitle} numberOfLines={1} adjustsFontSizeToFit>
                  RED FLAG
                </Text>
              </View>
            </View>

            {/* Faixa inferior escura (#15151e) com "SESSION STOPPED" em vermelho */}
            <Animated.View style={[styles.broadcastBottom, { opacity: subOpacity, transform: [{ translateY: subY }] }]}>
              <Text style={styles.broadcastSubtitle} numberOfLines={1} adjustsFontSizeToFit>
                SESSION STOPPED
              </Text>
            </Animated.View>
          </Animated.View>
        </View>

        {/* instruções */}
        <View style={styles.chips}>
          {CHIPS.map(({ Icon, label }, i) => (
            <Animated.View
              key={label}
              style={[styles.chip, { opacity: chipOpacity(i), transform: [{ translateY: chipY(i) }] }]}
            >
              <Icon size={16} color="#fff" strokeWidth={2.4} />
              <Text style={styles.chipText}>{label}</Text>
            </Animated.View>
          ))}
        </View>

        {/* contagem regressiva + dica */}
        <Animated.View style={[styles.footer, { opacity: subOpacity }]}>
          <View style={styles.countTrack}>
            <Animated.View style={[styles.countFill, { transform: [{ scaleX: countScale }] }]} />
          </View>
          <Text style={styles.hint}>TAP TO RETURN TO DASH</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    overflow: 'hidden',
    backgroundColor: '#0b0303'
  },
  sweep: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 160
  },
  stripesTop: { position: 'absolute', top: 0, left: 0, right: 0 },
  stripesBottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  header: {
    position: 'absolute',
    top: 34,
    left: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  headerText: { color: '#fff', fontFamily: F1Font.black, fontSize: 12, letterSpacing: 2.4 },
  headerDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' },
  headerSub: { color: '#fca5a5', fontFamily: F1Font.semi, fontSize: 11, letterSpacing: 2 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 10
  },
  broadcastCard: {
    width: '100%',
    maxWidth: 520,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.16)',
    shadowColor: '#e10600',
    shadowOpacity: 0.55,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16
  },
  broadcastTop: {
    backgroundColor: '#e10600',
    paddingTop: 6,
    paddingBottom: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  broadcastTopLines: {
    width: '100%',
    gap: 3,
    marginBottom: 8
  },
  broadcastThinLine: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(21,21,30,0.45)'
  },
  broadcastTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14
  },
  broadcastTitle: {
    color: '#ffffff',
    fontFamily: F1Font.black,
    fontSize: 58,
    lineHeight: 62,
    letterSpacing: 3
  },
  broadcastBottom: {
    backgroundColor: '#15151e',
    paddingVertical: 11,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 2,
    borderTopColor: '#0b0b10'
  },
  broadcastSubtitle: {
    color: '#e10600',
    fontFamily: F1Font.bold,
    fontSize: 22,
    letterSpacing: 6.5
  },
  chips: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 14
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(153,27,27,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.6)'
  },
  chipText: { color: '#fff', fontFamily: F1Font.bold, fontSize: 12, letterSpacing: 1.6 },
  footer: { alignItems: 'center', gap: 5, marginBottom: 34, paddingHorizontal: 60 },
  countTrack: {
    width: '100%',
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 2,
    overflow: 'hidden'
  },
  countFill: { height: 3, backgroundColor: RED, borderRadius: 2, transformOrigin: 'left' },
  hint: { color: '#fca5a5', fontFamily: F1Font.semi, fontSize: 9, letterSpacing: 2.4 }
});
