import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Radio } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { F1Font } from '../../theme/typography';
import { PulseRing, useLoop } from './fx';

const ENGINEER_PHOTO = require('../../../assets/claudinho2.jpeg');

const TERRACOTTA = '#E05A36';
const TERRACOTTA_DEEP = '#B84A28';
const BAR_COUNT = 24;
const BAR_STEP_MS = 60;

export interface TeamRadioBannerProps {
  /** true enquanto o rádio está aberto (do bipe até o fim da fala). */
  visible: boolean;
  /** 'connecting' = bipe tocou, aguardando a voz; 'live' = engenheiro falando. */
  phase: 'connecting' | 'live';
  /** Envelope de amplitude (0..1 a cada 40ms) da voz que está tocando. */
  envelope?: number[];
  /** Timestamp (Date.now) do início da reprodução da voz. */
  voiceStartedAt?: number;
  engineerName?: string;
  driverName?: string;
}

/**
 * Faixa de Team Radio estilo transmissão de F1: surge de baixo, deixa o dash visível por cima,
 * ondinhas sincronizadas com a voz real e saída suave quando o engenheiro termina.
 */
export const TeamRadioBanner: React.FC<TeamRadioBannerProps> = ({
  visible,
  phase,
  envelope,
  voiceStartedAt,
  engineerName = 'CLAUDINHO RONALDO',
  driverName = 'GABRIEL'
}) => {
  const insets = useSafeAreaInsets();
  const [mounted, setMounted] = useState(visible);

  // valores de animação (todos nativos)
  const stripIn = useRef(new Animated.Value(0)).current; // 0..1 — corpo da faixa
  const accentIn = useRef(new Animated.Value(0)).current; // linha terracota varrendo
  const photoIn = useRef(new Animated.Value(0)).current; // foto "pulando" pra dentro
  const textIn = useRef(new Animated.Value(0)).current; // nome/cargo
  const barsIn = useRef(new Animated.Value(0)).current; // ondas abrindo do centro
  const liveMix = useRef(new Animated.Value(0)).current; // 0 = conectando, 1 = ao vivo

  const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(0.1))).current;
  const blink = useLoop(650, Easing.inOut(Easing.quad), true);

  useEffect(() => {
    if (visible) {
      setMounted(true);
      stripIn.setValue(0);
      accentIn.setValue(0);
      photoIn.setValue(0);
      textIn.setValue(0);
      barsIn.setValue(0);
      Animated.parallel([
        Animated.timing(stripIn, { toValue: 1, duration: 520, easing: Easing.out(Easing.exp), useNativeDriver: true }),
        Animated.timing(accentIn, { toValue: 1, duration: 700, delay: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(photoIn, { toValue: 1, duration: 620, delay: 200, easing: Easing.out(Easing.back(1.8)), useNativeDriver: true }),
        Animated.timing(textIn, { toValue: 1, duration: 480, delay: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(barsIn, { toValue: 1, duration: 650, delay: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true })
      ]).start();
    } else if (mounted) {
      Animated.parallel([
        Animated.timing(barsIn, { toValue: 0, duration: 200, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(textIn, { toValue: 0, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(photoIn, { toValue: 0, duration: 300, easing: Easing.in(Easing.back(1.4)), useNativeDriver: true }),
        Animated.timing(stripIn, { toValue: 0, duration: 420, delay: 120, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      ]).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useEffect(() => {
    Animated.timing(liveMix, {
      toValue: phase === 'live' ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true
    }).start();
  }, [phase, liveMix]);

  // Motor das ondinhas: voz real (envelope) quando "live"; ondulação de portadora quando "connecting"
  useEffect(() => {
    if (!mounted) return;
    const center = (BAR_COUNT - 1) / 2;
    const timer = setInterval(() => {
      const now = Date.now();
      const env = envelope && voiceStartedAt && phase === 'live' ? envelope : null;
      const idx = env && voiceStartedAt ? Math.floor((now - voiceStartedAt) / BAR_STEP_MS) : 0;

      for (let i = 0; i < BAR_COUNT; i++) {
        const dist = Math.abs(i - center);
        let target: number;
        if (env) {
          // a fala "escorre" do centro para as bordas
          const e = env[idx - Math.floor(dist * 0.9)] ?? 0;
          const jitter = 0.78 + Math.random() * 0.34;
          const edgeFalloff = 1 - (dist / center) * 0.35;
          target = 0.07 + Math.min(1, e * 1.15) * 0.93 * jitter * edgeFalloff;
        } else {
          const wave = 0.5 + 0.5 * Math.sin(now / 260 - dist * 0.55);
          target = 0.07 + wave * 0.16 * (1 - dist / (center * 1.6));
        }
        Animated.timing(bars[i], {
          toValue: Math.max(0.06, Math.min(1, target)),
          duration: BAR_STEP_MS + 20,
          easing: Easing.linear,
          useNativeDriver: true
        }).start();
      }
    }, BAR_STEP_MS);
    return () => clearInterval(timer);
  }, [mounted, envelope, voiceStartedAt, phase, bars]);

  const width = useMemo(() => Math.min(Dimensions.get('window').width * 0.86, 780), []);

  if (!mounted) return null;

  const stripTranslate = stripIn.interpolate({ inputRange: [0, 1], outputRange: [140, 0] });
  const stripScale = stripIn.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] });
  const photoTranslate = photoIn.interpolate({ inputRange: [0, 1], outputRange: [70, 0] });
  const photoScale = photoIn.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const textTranslate = textIn.interpolate({ inputRange: [0, 1], outputRange: [-34, 0] });
  const barsScaleX = barsIn.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1] });
  const blinkOpacity = blink.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const liveOpacity = liveMix;
  const connectingOpacity = liveMix.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <View pointerEvents="none" style={[styles.root, { bottom: Math.max(insets.bottom, 10) + 6 }]}>
      <Animated.View
        style={[
          styles.strip,
          { width, opacity: stripIn, transform: [{ translateY: stripTranslate }, { scale: stripScale }] }
        ]}
      >
        {/* Corpo da faixa */}
        <View style={styles.body}>
          <LinearGradient
            colors={['rgba(26,14,10,0.97)', 'rgba(14,10,9,0.94)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={['rgba(224,90,54,0.55)', 'rgba(224,90,54,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 0.55, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
          {/* linha de acento varrendo da esquerda para a direita */}
          <Animated.View style={[styles.accentLine, { transform: [{ scaleX: accentIn }] }]} />
        </View>

        {/* Foto: ultrapassa o topo da faixa (efeito "pop-out" de gráfico de TV) */}
        <View style={styles.photoSlot}>
          <LinearGradient colors={[TERRACOTTA, TERRACOTTA_DEEP]} style={styles.photoPlate} />
          <Animated.Image
            source={ENGINEER_PHOTO}
            resizeMode="contain"
            style={[styles.photo, { transform: [{ translateY: photoTranslate }, { scale: photoScale }] }]}
          />
        </View>

        {/* Identificação */}
        <Animated.View style={[styles.nameBlock, { opacity: textIn, transform: [{ translateX: textTranslate }] }]}>
          <View style={styles.tagRow}>
            <View style={styles.radioIconWrap}>
              <PulseRing size={20} color={TERRACOTTA} periodMs={1600} />
              <PulseRing size={20} color={TERRACOTTA} periodMs={1600} delayFraction={0.5} />
              <Radio size={14} color={TERRACOTTA} strokeWidth={2.6} />
            </View>
            <Text style={styles.tagText}>TEAM RADIO</Text>
          </View>
          <Text style={styles.nameText} numberOfLines={1}>
            {engineerName}
          </Text>
          <Text style={styles.roleText} numberOfLines={1}>
            RACE ENGINEER <Text style={styles.roleArrow}>▸</Text> {driverName}
          </Text>
        </Animated.View>

        {/* Ondinhas */}
        <Animated.View style={[styles.waveWrap, { transform: [{ scaleX: barsScaleX }], opacity: barsIn }]}>
          <View style={styles.waveRow}>
            {bars.map((b, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.bar,
                  {
                    transform: [{ scaleY: b }],
                    backgroundColor: i % 2 === 0 ? TERRACOTTA : '#F08A63'
                  }
                ]}
              />
            ))}
          </View>
        </Animated.View>

        {/* Estado: conectando / ao vivo */}
        <View style={styles.statusBlock}>
          <Animated.View style={[styles.statusRow, { opacity: connectingOpacity }]}>
            <Text style={styles.statusText}>OPENING CHANNEL</Text>
          </Animated.View>
          <Animated.View style={[styles.statusRow, StyleSheet.absoluteFill, { opacity: liveOpacity }]}>
            <Animated.View style={[styles.liveDot, { opacity: blinkOpacity }]} />
            <Text style={[styles.statusText, { color: '#fff' }]}>LIVE</Text>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
};

const STRIP_H = 74;

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9000
  },
  strip: {
    height: STRIP_H,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 16,
    overflow: 'visible'
  },
  body: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(224,90,54,0.45)',
    shadowColor: '#000'
  },
  accentLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 3,
    backgroundColor: TERRACOTTA,
    transformOrigin: 'left'
  },
  photoSlot: {
    width: 96,
    height: STRIP_H,
    marginRight: 6
  },
  photoPlate: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    width: 96,
    height: STRIP_H,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 28,
    opacity: 0.92
  },
  photo: {
    position: 'absolute',
    left: -4,
    bottom: 0,
    width: 112,
    height: 112
  },
  nameBlock: {
    minWidth: 150,
    maxWidth: 230,
    justifyContent: 'center',
    marginRight: 14
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 1
  },
  radioIconWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center'
  },
  tagText: {
    color: TERRACOTTA,
    fontFamily: F1Font.black,
    fontSize: 11,
    letterSpacing: 2.4
  },
  nameText: {
    color: '#FFFFFF',
    fontFamily: F1Font.boldItalic,
    fontSize: 21,
    letterSpacing: 0.4,
    lineHeight: 24
  },
  roleText: {
    color: '#C9B8AE',
    fontFamily: F1Font.semi,
    fontSize: 10,
    letterSpacing: 1.6
  },
  roleArrow: {
    color: TERRACOTTA
  },
  waveWrap: {
    flex: 1,
    height: 46,
    justifyContent: 'center',
    marginRight: 12
  },
  waveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 46
  },
  bar: {
    width: 3.2,
    height: 46,
    borderRadius: 2
  },
  statusBlock: {
    width: 104,
    height: 22,
    justifyContent: 'center',
    alignItems: 'flex-end'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6
  },
  statusText: {
    color: '#C9B8AE',
    fontFamily: F1Font.bold,
    fontSize: 10,
    letterSpacing: 1.8
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30'
  }
});
