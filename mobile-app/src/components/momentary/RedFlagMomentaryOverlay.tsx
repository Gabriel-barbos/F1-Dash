import React from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CornerDownLeft, Flag, Gauge, OctagonX, ShieldAlert } from 'lucide-react-native';
import { F1Font } from '../../theme/typography';
import { HazardStripes, PulseRing, useLoop, useOverlayTransition } from './fx';

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

        {/* conteúdo central */}
        <View style={styles.center}>
          <View style={styles.flagBlock}>
            <View style={styles.rings}>
              <PulseRing size={104} color={RED} periodMs={2000} />
              <PulseRing size={104} color={RED} periodMs={2000} delayFraction={0.5} />
            </View>
            <Animated.View
              style={{
                opacity: flagOpacity,
                transform: [{ scale: flagScale }, { translateY: flagLift }, { rotate: flagRotate }]
              }}
            >
              <Flag size={72} color={RED} fill={RED} strokeWidth={1.8} />
            </Animated.View>
          </View>

          <View style={styles.textBlock}>
            <Animated.Text
              style={[styles.title, { opacity: titleOpacity, transform: [{ scale: titleScale }] }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              RED FLAG
            </Animated.Text>
            <Animated.View style={{ opacity: subOpacity, transform: [{ translateY: subY }] }}>
              <View style={styles.subRow}>
                <View style={styles.subBar} />
                <Text style={styles.subtitle}>SESSION SUSPENDED</Text>
              </View>
            </Animated.View>
          </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 26,
    paddingTop: 10
  },
  flagBlock: { width: 110, height: 110, alignItems: 'center', justifyContent: 'center' },
  rings: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  textBlock: { alignItems: 'flex-start' },
  title: {
    color: '#fff',
    fontFamily: F1Font.boldItalic,
    fontSize: 78,
    lineHeight: 80,
    letterSpacing: 2,
    textShadowColor: 'rgba(239,68,68,0.75)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 22
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  subBar: { width: 38, height: 4, backgroundColor: RED, borderRadius: 2 },
  subtitle: { color: '#fecaca', fontFamily: F1Font.bold, fontSize: 20, letterSpacing: 5 },
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
