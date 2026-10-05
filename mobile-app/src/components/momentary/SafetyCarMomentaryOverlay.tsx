import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ban, Gauge, ShieldAlert, Siren, Timer } from 'lucide-react-native';
import { SafetyCarStatus } from '@f1-dash/telemetry-core';
import { F1Font } from '../../theme/typography';
import { HazardStripes, PulseRing, useLoop, useOverlayTransition } from './fx';

interface SafetyCarMomentaryOverlayProps {
  onDismiss: () => void;
  status: SafetyCarStatus;
  delta?: number;
  speedLimit?: number;
}

const AMBER = '#facc15';
const AMBER_DEEP = '#a16207';
const DURATION_MS = 7500;
const DELTA_RANGE = 1.5; // segundos representados em cada lado da barra
const DELTA_TRACK = 240;

export const SafetyCarMomentaryOverlay: React.FC<SafetyCarMomentaryOverlayProps> = ({
  onDismiss,
  status,
  delta = 0,
  speedLimit = 80
}) => {
  const isVSC = status === SafetyCarStatus.Virtual;
  const { enter, countdown, close } = useOverlayTransition(DURATION_MS, onDismiss);
  const { width } = Dimensions.get('window');

  const beam = useLoop(1500); // rotação do giroflex
  const glow = useLoop(750, Easing.inOut(Easing.quad), true);
  const sweep = useLoop(3000, Easing.inOut(Easing.quad));

  // marcador de delta animado
  const deltaPos = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const clamped = Math.max(-DELTA_RANGE, Math.min(DELTA_RANGE, delta));
    Animated.timing(deltaPos, {
      toValue: (clamped / DELTA_RANGE) * (DELTA_TRACK / 2),
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true
    }).start();
  }, [delta, deltaPos]);

  const topY = enter.interpolate({ inputRange: [0, 0.5], outputRange: [-60, 0], extrapolate: 'clamp' });
  const botY = enter.interpolate({ inputRange: [0, 0.5], outputRange: [60, 0], extrapolate: 'clamp' });
  const iconScale = enter.interpolate({ inputRange: [0.15, 0.7, 1], outputRange: [0.2, 1.12, 1], extrapolate: 'clamp' });
  const iconOpacity = enter.interpolate({ inputRange: [0.1, 0.4], outputRange: [0, 1], extrapolate: 'clamp' });
  const titleX = enter.interpolate({ inputRange: [0.25, 0.75], outputRange: [-90, 0], extrapolate: 'clamp' });
  const titleOpacity = enter.interpolate({ inputRange: [0.25, 0.6], outputRange: [0, 1], extrapolate: 'clamp' });
  const panelX = enter.interpolate({ inputRange: [0.4, 0.85], outputRange: [120, 0], extrapolate: 'clamp' });
  const panelOpacity = enter.interpolate({ inputRange: [0.4, 0.75], outputRange: [0, 1], extrapolate: 'clamp' });
  const chipOpacity = (i: number) =>
    enter.interpolate({ inputRange: [0.55 + i * 0.1, 0.75 + i * 0.1], outputRange: [0, 1], extrapolate: 'clamp' });
  const chipY = (i: number) =>
    enter.interpolate({ inputRange: [0.55 + i * 0.1, 0.75 + i * 0.1], outputRange: [24, 0], extrapolate: 'clamp' });
  const footerOpacity = enter.interpolate({ inputRange: [0.6, 0.9], outputRange: [0, 1], extrapolate: 'clamp' });

  const beamRotate = beam.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.85] });
  const sweepX = sweep.interpolate({ inputRange: [0, 1], outputRange: [-width * 0.4, width * 1.1] });

  const deltaColor = delta >= 0 ? '#4ade80' : '#f87171';
  const deltaText = `${delta >= 0 ? '+' : ''}${delta.toFixed(3)}`;

  const chips = isVSC
    ? [
        { Icon: Timer, label: 'KEEP DELTA ABOVE ZERO' },
        { Icon: Gauge, label: 'REDUCE PACE' },
        { Icon: Ban, label: 'NO OVERTAKING' }
      ]
    : [
        { Icon: Gauge, label: 'REDUCE PACE' },
        { Icon: Ban, label: 'NO OVERTAKING' },
        { Icon: Siren, label: 'HOLD POSITION · SC LEADS' }
      ];

  return (
    <Pressable style={StyleSheet.absoluteFill} onPress={close}>
      <Animated.View style={[styles.root, { opacity: enter }]}>
        <LinearGradient colors={['#130f02', '#2b2005', '#130f02']} style={StyleSheet.absoluteFill} />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: glowOpacity }]}>
          <LinearGradient colors={['rgba(250,204,21,0)', 'rgba(250,204,21,0.20)', 'rgba(250,204,21,0)']} style={StyleSheet.absoluteFill} />
        </Animated.View>

        <Animated.View pointerEvents="none" style={[styles.sweep, { transform: [{ translateX: sweepX }, { skewX: '-18deg' }] }]}>
          <LinearGradient
            colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.09)', 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        <Animated.View style={[styles.stripesTop, { transform: [{ translateY: topY }] }]}>
          <HazardStripes height={22} colorA="#0c0a02" colorB={AMBER} stripe={22} periodMs={1500} />
        </Animated.View>
        <Animated.View style={[styles.stripesBottom, { transform: [{ translateY: botY }] }]}>
          <HazardStripes height={22} colorA="#0c0a02" colorB={AMBER} stripe={22} periodMs={1500} reverse />
        </Animated.View>

        <Animated.View style={[styles.header, { opacity: footerOpacity }]}>
          <ShieldAlert size={16} color={AMBER} strokeWidth={2.4} />
          <Text style={styles.headerText}>RACE CONTROL</Text>
          <View style={styles.headerDivider} />
          <Text style={styles.headerSub}>{isVSC ? 'VIRTUAL SAFETY CAR DEPLOYED' : 'SAFETY CAR DEPLOYED'}</Text>
        </Animated.View>

        <View style={styles.center}>
          {/* Giroflex */}
          <View style={styles.sirenBlock}>
            <View style={styles.rings}>
              <PulseRing size={104} color={AMBER} periodMs={1700} />
              <PulseRing size={104} color={AMBER} periodMs={1700} delayFraction={0.5} />
            </View>
            <Animated.View style={[styles.beam, { transform: [{ rotate: beamRotate }] }]}>
              <LinearGradient
                colors={['rgba(250,204,21,0.0)', 'rgba(250,204,21,0.75)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.beamGradient}
              />
            </Animated.View>
            <Animated.View style={{ opacity: iconOpacity, transform: [{ scale: iconScale }] }}>
              <View style={styles.sirenDisc}>
                <Siren size={52} color="#1a1300" strokeWidth={2.4} />
              </View>
            </Animated.View>
          </View>

          {/* Título */}
          <Animated.View style={[styles.titleBlock, { opacity: titleOpacity, transform: [{ translateX: titleX }] }]}>
            <View style={styles.codeRow}>
              <View style={styles.codeBadge}>
                <Text style={styles.codeText}>{isVSC ? 'VSC' : 'SC'}</Text>
              </View>
              <Text style={styles.kicker}>{isVSC ? 'VIRTUAL' : 'CAR ON TRACK'}</Text>
            </View>
            <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit>
              {isVSC ? 'VIRTUAL SAFETY CAR' : 'SAFETY CAR'}
            </Text>
            <View style={styles.subRow}>
              <View style={styles.subBar} />
              <Text style={styles.subtitle}>REDUCE PACE · NO OVERTAKING</Text>
            </View>
          </Animated.View>

          {/* Painel: limite + delta */}
          <Animated.View style={[styles.panel, { opacity: panelOpacity, transform: [{ translateX: panelX }] }]}>
            <View style={styles.signWrap}>
              <View style={styles.sign}>
                <Text style={styles.signNumber}>{speedLimit}</Text>
              </View>
              <Text style={styles.panelLabel}>KM/H LIMIT</Text>
            </View>
            <View style={styles.deltaWrap}>
              <Text style={styles.panelLabel}>DELTA</Text>
              <Text style={[styles.deltaValue, { color: deltaColor }]}>{deltaText}</Text>
              <View style={styles.deltaTrack}>
                <View style={styles.deltaZero} />
                <View style={[styles.deltaHalf, { left: 0, backgroundColor: 'rgba(248,113,113,0.18)' }]} />
                <View style={[styles.deltaHalf, { right: 0, backgroundColor: 'rgba(74,222,128,0.18)' }]} />
                <Animated.View style={[styles.deltaMarker, { backgroundColor: deltaColor, transform: [{ translateX: deltaPos }] }]} />
              </View>
            </View>
          </Animated.View>
        </View>

        <View style={styles.chips}>
          {chips.map(({ Icon, label }, i) => (
            <Animated.View key={label} style={[styles.chip, { opacity: chipOpacity(i), transform: [{ translateY: chipY(i) }] }]}>
              <Icon size={16} color={AMBER} strokeWidth={2.4} />
              <Text style={styles.chipText}>{label}</Text>
            </Animated.View>
          ))}
        </View>

        <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
          <View style={styles.countTrack}>
            <Animated.View style={[styles.countFill, { transform: [{ scaleX: countdown }] }]} />
          </View>
          <Text style={styles.hint}>TAP TO RETURN TO DASH</Text>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, overflow: 'hidden', backgroundColor: '#0c0a02' },
  sweep: { position: 'absolute', top: -20, bottom: -20, width: 160 },
  stripesTop: { position: 'absolute', top: 0, left: 0, right: 0 },
  stripesBottom: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  header: { position: 'absolute', top: 34, left: 24, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { color: '#fff', fontFamily: F1Font.black, fontSize: 12, letterSpacing: 2.4 },
  headerDivider: { width: 1, height: 12, backgroundColor: 'rgba(255,255,255,0.3)' },
  headerSub: { color: '#fde68a', fontFamily: F1Font.semi, fontSize: 11, letterSpacing: 2 },
  center: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 22, paddingTop: 10, paddingHorizontal: 24 },
  sirenBlock: { width: 118, height: 118, alignItems: 'center', justifyContent: 'center' },
  rings: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  beam: { position: 'absolute', width: 118, height: 118, alignItems: 'flex-end', justifyContent: 'center' },
  beamGradient: { width: 59, height: 12, borderRadius: 6 },
  sirenDisc: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: AMBER,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: AMBER_DEEP,
    shadowColor: AMBER,
    shadowOpacity: 0.9,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 }
  },
  titleBlock: { flexShrink: 1, alignItems: 'flex-start' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 2 },
  codeBadge: { backgroundColor: AMBER, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 3 },
  codeText: { color: '#1a1300', fontFamily: F1Font.black, fontSize: 18, letterSpacing: 2 },
  kicker: { color: '#fde68a', fontFamily: F1Font.bold, fontSize: 12, letterSpacing: 4 },
  title: {
    color: '#fff',
    fontFamily: F1Font.boldItalic,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: 1.2,
    textShadowColor: 'rgba(250,204,21,0.65)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20
  },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 2 },
  subBar: { width: 34, height: 4, backgroundColor: AMBER, borderRadius: 2 },
  subtitle: { color: '#fef3c7', fontFamily: F1Font.bold, fontSize: 13, letterSpacing: 3 },
  panel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.45)'
  },
  signWrap: { alignItems: 'center', gap: 4 },
  sign: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#fff',
    borderWidth: 7,
    borderColor: '#dc2626',
    alignItems: 'center',
    justifyContent: 'center'
  },
  signNumber: { color: '#111', fontFamily: F1Font.black, fontSize: 25 },
  panelLabel: { color: '#fde68a', fontFamily: F1Font.bold, fontSize: 10, letterSpacing: 2.2 },
  deltaWrap: { alignItems: 'center', gap: 2, width: DELTA_TRACK * 0.78 },
  deltaValue: { fontFamily: F1Font.black, fontSize: 38, lineHeight: 42, letterSpacing: 1 },
  deltaTrack: {
    width: DELTA_TRACK * 0.78,
    height: 12,
    borderRadius: 6,
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center'
  },
  deltaHalf: { position: 'absolute', top: 0, bottom: 0, width: '50%' },
  deltaZero: { position: 'absolute', width: 2, top: 0, bottom: 0, backgroundColor: 'rgba(255,255,255,0.6)' },
  deltaMarker: { width: 10, height: 12, borderRadius: 3 },
  chips: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginBottom: 14 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(161,98,7,0.4)',
    borderWidth: 1,
    borderColor: 'rgba(250,204,21,0.55)'
  },
  chipText: { color: '#fff', fontFamily: F1Font.bold, fontSize: 12, letterSpacing: 1.6 },
  footer: { alignItems: 'center', gap: 5, marginBottom: 34, paddingHorizontal: 60 },
  countTrack: { width: '100%', height: 3, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 2, overflow: 'hidden' },
  countFill: { height: 3, backgroundColor: AMBER, borderRadius: 2, transformOrigin: 'left' },
  hint: { color: '#fde68a', fontFamily: F1Font.semi, fontSize: 9, letterSpacing: 2.4 }
});
