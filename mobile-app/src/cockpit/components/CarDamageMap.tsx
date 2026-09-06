/**
 * CarDamageMap.tsx — Mapa Visual de Danos e Calor do Carro F1 (React Native / Mobile)
 *
 * Renderiza o chassi do carro de F1 em camadas de alta fidelidade pixel-perfect
 * com base na engenharia reversa do SimHub (327 x 605px).
 *
 * Camadas (Z-Index):
 *  0: Chassi Base (car2.png)
 *  1: Assoalho / Fundo (Fondo1-5.png)
 *  2: Câmbio (Cambio1-3.png)
 *  3: Motor (Engine1-3.png)
 *  4: Sidepod Esquerdo (SidepodL1-5.png)
 *  5: Sidepod Direito (SidepodR1-5.png)
 *  6: Difusor (Diffusore1-5.png)
 *  7: Asa Traseira (Dietro1-5.png)
 *  8: Asa Dianteira Esquerda (Sinistra1-5.png)
 *  9: Asa Dianteira Direita (Destra1-5.png)
 * 10: 4 Pneus com cores térmicas de desgaste
 * 11: 4 Discos de Freio com gradiente de temperatura
 *
 * Ajustes solicitados:
 * - A % de desgaste fica na box lateral onde antes era a temperatura
 * - A temperatura fica no lugar da pressão dos pneus
 * - Limiares de dano das asas dianteiras e componentes ajustados para trocar de cor
 *   imediatamente ao colidir (verde -> amarelo -> laranja -> vermelho)
 */

import React, { memo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  Animated,
} from 'react-native';
import { VisualTyreCompound } from '@f1-dash/telemetry-core';
import { CockpitTheme } from '../theme/types';
import { CAR_ASSETS } from './carDamageAssets';

// Dimensões do canvas base de referência
const REF_W = 327;
const REF_H = 605;

// Altura padrão do carro no card mobile e largura proporcional uniforme
const CAR_HEIGHT = 222;
const CAR_WIDTH = Math.round(CAR_HEIGHT * (REF_W / REF_H)); // ~120px

export interface CarDamageMapProps {
  // Danos mecânicos/aerodinâmicos (0 a 100%)
  frontLeftWingDamage?: number;
  frontLeftWing?: number;
  frontRightWingDamage?: number;
  frontRightWing?: number;
  rearWingDamage?: number;
  rearWing?: number;
  floorDamage?: number;
  floor?: number;
  diffuserDamage?: number;
  diffuser?: number;
  sidepodDamage?: number;
  sidepod?: number;
  gearBoxDamage?: number;
  gearBox?: number;
  engineDamage?: number;
  engine?: number;

  // Pneus [RL, RR, FL, FR]
  tyresWear: [number, number, number, number];
  tyresSurfaceTemp: [number, number, number, number];
  tyresPressure: [number, number, number, number];
  brakesTemperature?: [number, number, number, number];

  // Composto e voltas
  compound: VisualTyreCompound;
  tyresAgeLaps: number;

  // Falhas mecânicas
  drsFault?: boolean;
  engineBlown?: boolean;

  // Tema
  theme: CockpitTheme;
}

// ─── Helpers de Estágio de Dano ───────────────────────────────────────────────

/**
 * Asas dianteiras: estágios reativos e visíveis para qualquer impacto
 * 0: Sinistra1/Destra1 (Verde - intacto)
 * 1: Sinistra2/Destra2 (Verde-claro - 1 a 9% dano)
 * 2: Sinistra3/Destra3 (Amarelo - 10 a 29% dano)
 * 3: Sinistra4/Destra4 (Laranja - 30 a 59% dano)
 * 4: Sinistra5/Destra5 (Vermelho - >= 60% dano)
 */
function getFrontWingStage(damage: number): number {
  const d = Math.max(0, Number(damage) || 0);
  if (d < 1) return 0;  // Estágio 1: Verde (0%)
  if (d < 10) return 1; // Estágio 2: Verde-claro (1-9%)
  if (d < 30) return 2; // Estágio 3: Amarelo (10-29%)
  if (d < 60) return 3; // Estágio 4: Laranja (30-59%)
  return 4;             // Estágio 5: Vermelho (>= 60%)
}

function getBodyStage(damage: number, fault?: boolean): number {
  const d = Math.max(0, Number(damage) || 0);
  if (d >= 60 || fault) return 4; // Estágio 5: Vermelho
  if (d >= 30) return 3;          // Estágio 4: Laranja
  if (d >= 10) return 2;          // Estágio 3: Amarelo
  if (d >= 1) return 1;           // Estágio 2: Verde-claro
  return 0;                       // Estágio 1: Verde
}

function getEngineStage(damage: number, engineBlown?: boolean): number {
  const d = Math.max(0, Number(damage) || 0);
  if (d >= 50 || engineBlown) return 2; // Estágio 3: Vermelho
  if (d >= 20) return 1;                // Estágio 2: Amarelo
  return 0;                             // Estágio 1: Verde
}

function getGearboxStage(damage: number): number {
  const d = Math.max(0, Number(damage) || 0);
  if (d >= 50) return 2; // Estágio 3: Vermelho
  if (d >= 20) return 1; // Estágio 2: Amarelo
  return 0;              // Estágio 1: Verde
}

// ─── Cores Térmicas ──────────────────────────────────────────────────────────

function getTyreWearColor(wear: number): string {
  if (wear > 80) return '#e74c3c'; // Crítico (Vermelho)
  if (wear > 60) return '#e67e22'; // Alto (Laranja)
  if (wear > 30) return '#f1c40f'; // Médio (Amarelo)
  return '#2ecc71';                // Ótimo (Verde)
}

function getTyreTempColor(temp: number): string {
  if (temp <= 0) return '#64748b';
  if (temp < 80) return '#38bdf8';   // Frio (Azul)
  if (temp <= 105) return '#22c55e'; // Ideal (Verde)
  if (temp <= 118) return '#eab308'; // Quente (Amarelo)
  return '#ef4444';                  // Superaquecido (Vermelho)
}

function getBrakeColor(temp: number): string {
  if (temp > 1000) return '#e74c3c'; // Glazing (Vermelho)
  if (temp > 750) return '#f39c12';  // Quente (Laranja/Amarelo)
  if (temp >= 300) return '#2ecc71'; // Ideal (Verde)
  return '#3498db';                  // Frio (Azul)
}

function getCompoundConfig(compound: VisualTyreCompound) {
  switch (compound) {
    case VisualTyreCompound.F1_Soft:
      return { letter: 'S', name: 'SOFT', color: '#ef4444' };
    case VisualTyreCompound.F1_Medium:
      return { letter: 'M', name: 'MED', color: '#eab308' };
    case VisualTyreCompound.F1_Hard:
      return { letter: 'H', name: 'HARD', color: '#ffffff' };
    case VisualTyreCompound.F1_Intermediate:
      return { letter: 'I', name: 'INTER', color: '#22c55e' };
    case VisualTyreCompound.F1_Wet:
      return { letter: 'W', name: 'WET', color: '#3b82f6' };
    default:
      return { letter: '?', name: 'PNEU', color: '#6b7280' };
  }
}

// ─── Coordenadas Exatas Proporcionais ─────────────────────────────────────────

const scaleRect = (x: number, y: number, w: number, h: number) => ({
  position: 'absolute' as const,
  left: (x / REF_W) * CAR_WIDTH,
  top: (y / REF_H) * CAR_HEIGHT,
  width: (w / REF_W) * CAR_WIDTH,
  height: (h / REF_H) * CAR_HEIGHT,
});

export const CarDamageMap: React.FC<CarDamageMapProps> = memo((props) => {
  const {
    frontLeftWingDamage,
    frontLeftWing,
    frontRightWingDamage,
    frontRightWing,
    rearWingDamage,
    rearWing,
    floorDamage,
    floor,
    diffuserDamage,
    diffuser,
    sidepodDamage,
    sidepod,
    gearBoxDamage,
    gearBox,
    engineDamage,
    engine,
    tyresWear = [0, 0, 0, 0],
    tyresSurfaceTemp = [0, 0, 0, 0],
    brakesTemperature = [0, 0, 0, 0],
    compound = VisualTyreCompound.F1_Soft,
    tyresAgeLaps = 0,
    drsFault = false,
    engineBlown = false,
    theme,
  } = props;

  // Resolução segura de danos com suporte aos dois padrões de nome de prop
  const flDmg = frontLeftWingDamage ?? frontLeftWing ?? 0;
  const frDmg = frontRightWingDamage ?? frontRightWing ?? 0;
  const rwDmg = rearWingDamage ?? rearWing ?? 0;
  const flrDmg = floorDamage ?? floor ?? 0;
  const diffDmg = diffuserDamage ?? diffuser ?? 0;
  const spdDmg = sidepodDamage ?? sidepod ?? 0;
  const gbDmg = gearBoxDamage ?? gearBox ?? 0;
  const engDmg = engineDamage ?? engine ?? 0;

  // Estágios calculados para cada subsistema
  const stageFloor = getBodyStage(flrDmg);
  const stageGearbox = getGearboxStage(gbDmg);
  const stageEngine = getEngineStage(engDmg, engineBlown);
  const stageSidepodL = getBodyStage(spdDmg);
  const stageSidepodR = getBodyStage(spdDmg);
  const stageDiffuser = getBodyStage(diffDmg);
  const stageRearWing = getBodyStage(rwDmg, drsFault);
  const stageFLWing = getFrontWingStage(flDmg);
  const stageFRWing = getFrontWingStage(frDmg);

  // Animação de piscar para danos recentes
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const prevDamageSum = useRef(0);

  const totalDamage =
    flDmg +
    frDmg +
    rwDmg +
    flrDmg +
    diffDmg +
    spdDmg +
    gbDmg +
    engDmg;

  useEffect(() => {
    if (totalDamage > prevDamageSum.current) {
      Animated.sequence([
        Animated.loop(
          Animated.sequence([
            Animated.timing(blinkAnim, { toValue: 0.25, duration: 250, useNativeDriver: true }),
            Animated.timing(blinkAnim, { toValue: 1.0, duration: 250, useNativeDriver: true }),
          ]),
          { iterations: 4 }
        ),
      ]).start();
    }
    prevDamageSum.current = totalDamage;
  }, [totalDamage, blinkAnim]);

  const compoundCfg = getCompoundConfig(compound);
  const hasDamage = totalDamage >= 1;

  // Dados dos 4 pneus: index no array [RL, RR, FL, FR] -> RL=0, RR=1, FL=2, FR=3
  const flWear = tyresWear[2] ?? 0;
  const frWear = tyresWear[3] ?? 0;
  const rlWear = tyresWear[0] ?? 0;
  const rrWear = tyresWear[1] ?? 0;

  const flTemp = tyresSurfaceTemp[2] ?? 0;
  const frTemp = tyresSurfaceTemp[3] ?? 0;
  const rlTemp = tyresSurfaceTemp[0] ?? 0;
  const rrTemp = tyresSurfaceTemp[1] ?? 0;

  const flBrake = brakesTemperature[2] ?? 0;
  const frBrake = brakesTemperature[3] ?? 0;
  const rlBrake = brakesTemperature[0] ?? 0;
  const rrBrake = brakesTemperature[1] ?? 0;

  return (
    <View style={[styles.container, { borderColor: theme.cardBorder }]}>
      {/* ── Header do Card ── */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Text style={styles.sectionTitle}>STATUS DO CARRO</Text>
          {hasDamage && (
            <View style={styles.damageBadge}>
              <Text style={styles.damageBadgeText}>⚠️ DANO</Text>
            </View>
          )}
        </View>

        {/* Composto de Pneu e Voltas */}
        <View style={[styles.compoundPill, { borderColor: compoundCfg.color }]}>
          <Text style={[styles.compoundLetter, { color: compoundCfg.color }]}>{compoundCfg.letter}</Text>
          <Text style={[styles.compoundName, { color: compoundCfg.color }]}>{compoundCfg.name}</Text>
          <Text style={styles.ageLaps}>({tyresAgeLaps}V)</Text>
        </View>
      </View>

      {/* ── Área Principal: Carro Central + Telemetria Lateral dos Pneus ── */}
      <View style={styles.mainLayout}>
        {/* Coluna Esquerda: Dados dos Pneus Esquerdos (FL & RL) */}
        <View style={styles.sideTelemetryColumn}>
          {/* Tag Pneu Dianteiro Esquerdo (FL) */}
          <View style={[styles.tyreDataTag, { borderColor: getTyreWearColor(flWear) }]}>
            <Text style={styles.tyreCornerLabel}>DE (FL)</Text>
            {/* 1. % de Desgaste (onde antes era a temperatura) */}
            <Text style={[styles.tyreWearText, { color: getTyreWearColor(flWear) }]}>
              {Math.round(flWear)}%
            </Text>
            {/* 2. Temperatura (no lugar da pressão dos pneus) */}
            <Text style={[styles.tyreTempText, { color: getTyreTempColor(flTemp) }]}>
              {flTemp > 0 ? `${Math.round(flTemp)}°C` : '--'}
            </Text>
          </View>

          {/* Espaçador entre dianteiro e traseiro */}
          <View style={{ flex: 1 }} />

          {/* Tag Pneu Traseiro Esquerdo (RL) */}
          <View style={[styles.tyreDataTag, { borderColor: getTyreWearColor(rlWear) }]}>
            <Text style={styles.tyreCornerLabel}>TE (RL)</Text>
            <Text style={[styles.tyreWearText, { color: getTyreWearColor(rlWear) }]}>
              {Math.round(rlWear)}%
            </Text>
            <Text style={[styles.tyreTempText, { color: getTyreTempColor(rlTemp) }]}>
              {rlTemp > 0 ? `${Math.round(rlTemp)}°C` : '--'}
            </Text>
          </View>
        </View>

        {/* ── Carro em Camadas com Dimensões Proporcionais Fixas ── */}
        <View style={styles.carWrapper}>
          {/* Z-0: Chassi Base (car2.png) */}
          <Image
            source={CAR_ASSETS.carBase}
            style={styles.carBaseImage}
            resizeMode="stretch"
          />

          {/* Z-1: Assoalho / Fundo (71, 244, 183, 282) */}
          <Animated.Image
            key={`floor-${stageFloor}`}
            source={CAR_ASSETS.floor[stageFloor]}
            style={[scaleRect(71, 244, 183, 282), { zIndex: 1, opacity: blinkAnim }]}
            resizeMode="stretch"
          />

          {/* Z-2: Câmbio (150, 452, 25, 74) */}
          <Animated.Image
            key={`gearbox-${stageGearbox}`}
            source={CAR_ASSETS.gearbox[stageGearbox]}
            style={[scaleRect(150, 452, 25, 74), { zIndex: 2, opacity: blinkAnim }]}
            resizeMode="stretch"
          />

          {/* Z-3: Motor (124, 356, 77, 93) */}
          <Animated.Image
            key={`engine-${stageEngine}`}
            source={CAR_ASSETS.engine[stageEngine]}
            style={[scaleRect(124, 356, 77, 93), { zIndex: 3, opacity: blinkAnim }]}
            resizeMode="stretch"
          />

          {/* Z-4: Sidepod L (83, 329, 63, 197) */}
          <Animated.Image
            key={`sidepodL-${stageSidepodL}`}
            source={CAR_ASSETS.sidepodL[stageSidepodL]}
            style={[scaleRect(83, 329, 63, 197), { zIndex: 4, opacity: blinkAnim }]}
            resizeMode="stretch"
          />

          {/* Z-5: Sidepod R (180, 329, 62, 196) */}
          <Animated.Image
            key={`sidepodR-${stageSidepodR}`}
            source={CAR_ASSETS.sidepodR[stageSidepodR]}
            style={[scaleRect(180, 329, 62, 196), { zIndex: 5, opacity: blinkAnim }]}
            resizeMode="stretch"
          />

          {/* Z-6: Difusor (121, 529, 81, 28) */}
          <Animated.Image
            key={`diffuser-${stageDiffuser}`}
            source={CAR_ASSETS.diffuser[stageDiffuser]}
            style={[scaleRect(121, 529, 81, 28), { zIndex: 6, opacity: blinkAnim }]}
            resizeMode="stretch"
          />

          {/* Z-7: Asa Traseira (94, 567, 136, 56) */}
          <Animated.Image
            key={`rearWing-${stageRearWing}`}
            source={CAR_ASSETS.rearWing[stageRearWing]}
            style={[scaleRect(94, 567, 136, 56), { zIndex: 7, opacity: blinkAnim }]}
            resizeMode="stretch"
          />

          {/* Z-8: Asa Dianteira Esquerda (48, 17, 109, 95) */}
          <Animated.Image
            key={`flWing-${stageFLWing}`}
            source={CAR_ASSETS.flWing[stageFLWing]}
            style={[scaleRect(48, 17, 109, 95), { zIndex: 8, opacity: blinkAnim }]}
            resizeMode="stretch"
          />

          {/* Z-9: Asa Dianteira Direita (165, 16, 109, 96) */}
          <Animated.Image
            key={`frWing-${stageFRWing}`}
            source={CAR_ASSETS.frWing[stageFRWing]}
            style={[scaleRect(165, 16, 109, 96), { zIndex: 9, opacity: blinkAnim }]}
            resizeMode="stretch"
          />

          {/* ── Z-10: Pneus Térmicos ── */}
          {/* FL (39, 124, 56, 85) */}
          <View
            style={[
              scaleRect(39, 124, 56, 85),
              styles.tyreBox,
              { backgroundColor: getTyreWearColor(flWear), zIndex: 10 },
            ]}
          />

          {/* FR (230, 124, 56, 85) */}
          <View
            style={[
              scaleRect(230, 124, 56, 85),
              styles.tyreBox,
              { backgroundColor: getTyreWearColor(frWear), zIndex: 10 },
            ]}
          />

          {/* RL (35, 506, 60, 86) */}
          <View
            style={[
              scaleRect(35, 506, 60, 86),
              styles.tyreBox,
              { backgroundColor: getTyreWearColor(rlWear), zIndex: 10 },
            ]}
          />

          {/* RR (229, 506, 60, 86) */}
          <View
            style={[
              scaleRect(229, 506, 60, 86),
              styles.tyreBox,
              { backgroundColor: getTyreWearColor(rrWear), zIndex: 10 },
            ]}
          />

          {/* ── Z-11: Discos de Freio (Barras Térmicas) ── */}
          {/* FL (97, 145, 14, 40) */}
          <View
            style={[
              scaleRect(97, 145, 14, 40),
              styles.brakeBar,
              { backgroundColor: getBrakeColor(flBrake), zIndex: 11 },
            ]}
          />

          {/* FR (214, 145, 14, 40) */}
          <View
            style={[
              scaleRect(214, 145, 14, 40),
              styles.brakeBar,
              { backgroundColor: getBrakeColor(frBrake), zIndex: 11 },
            ]}
          />

          {/* RL (98, 532, 14, 31) */}
          <View
            style={[
              scaleRect(98, 532, 14, 31),
              styles.brakeBar,
              { backgroundColor: getBrakeColor(rlBrake), zIndex: 11 },
            ]}
          />

          {/* RR (211, 532, 14, 31) */}
          <View
            style={[
              scaleRect(211, 532, 14, 31),
              styles.brakeBar,
              { backgroundColor: getBrakeColor(rrBrake), zIndex: 11 },
            ]}
          />
        </View>

        {/* Coluna Direita: Dados dos Pneus Direitos (FR & RR) */}
        <View style={styles.sideTelemetryColumn}>
          {/* Tag Pneu Dianteiro Direito (FR) */}
          <View style={[styles.tyreDataTag, { borderColor: getTyreWearColor(frWear) }]}>
            <Text style={styles.tyreCornerLabel}>DD (FR)</Text>
            {/* 1. % de Desgaste */}
            <Text style={[styles.tyreWearText, { color: getTyreWearColor(frWear) }]}>
              {Math.round(frWear)}%
            </Text>
            {/* 2. Temperatura */}
            <Text style={[styles.tyreTempText, { color: getTyreTempColor(frTemp) }]}>
              {frTemp > 0 ? `${Math.round(frTemp)}°C` : '--'}
            </Text>
          </View>

          {/* Espaçador entre dianteiro e traseiro */}
          <View style={{ flex: 1 }} />

          {/* Tag Pneu Traseiro Direito (RR) */}
          <View style={[styles.tyreDataTag, { borderColor: getTyreWearColor(rrWear) }]}>
            <Text style={styles.tyreCornerLabel}>TD (RR)</Text>
            <Text style={[styles.tyreWearText, { color: getTyreWearColor(rrWear) }]}>
              {Math.round(rrWear)}%
            </Text>
            <Text style={[styles.tyreTempText, { color: getTyreTempColor(rrTemp) }]}>
              {rrTemp > 0 ? `${Math.round(rrTemp)}°C` : '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Footer com Danos Críticos (se houver) ── */}
      {hasDamage && (
        <View style={styles.damageFooter}>
          {flDmg >= 1 && (
            <Text style={styles.damagePillText}>Asa E: {Math.round(flDmg)}%</Text>
          )}
          {frDmg >= 1 && (
            <Text style={styles.damagePillText}>Asa D: {Math.round(frDmg)}%</Text>
          )}
          {flrDmg >= 1 && (
            <Text style={styles.damagePillText}>Assoalho: {Math.round(flrDmg)}%</Text>
          )}
          {rwDmg >= 1 && (
            <Text style={styles.damagePillText}>Asa T: {Math.round(rwDmg)}%</Text>
          )}
          {engDmg >= 1 && (
            <Text style={styles.damagePillText}>Motor: {Math.round(engDmg)}%</Text>
          )}
        </View>
      )}
    </View>
  );
});

CarDamageMap.displayName = 'CarDamageMap';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0a0c14',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 7,
    width: 240,
    gap: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#1a1e2e',
    paddingBottom: 5,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sectionTitle: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  damageBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderColor: '#ef4444',
    borderWidth: 1,
    borderRadius: 3,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  damageBadgeText: {
    color: '#f87171',
    fontSize: 7.5,
    fontWeight: '800',
  },
  compoundPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: '#101422',
  },
  compoundLetter: {
    fontSize: 9,
    fontWeight: '900',
  },
  compoundName: {
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  ageLaps: {
    color: '#64748b',
    fontSize: 7,
    fontWeight: '700',
  },
  mainLayout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: CAR_HEIGHT,
  },
  sideTelemetryColumn: {
    width: 48,
    height: CAR_HEIGHT,
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  tyreDataTag: {
    backgroundColor: '#0d111e',
    borderWidth: 1,
    borderRadius: 5,
    paddingVertical: 2.5,
    paddingHorizontal: 3,
    alignItems: 'center',
    minWidth: 46,
  },
  tyreCornerLabel: {
    color: '#94a3b8',
    fontSize: 7,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  tyreWearText: {
    fontSize: 11,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginVertical: 0.5,
  },
  tyreTempText: {
    fontSize: 8,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  carWrapper: {
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    position: 'relative',
  },
  carBaseImage: {
    width: CAR_WIDTH,
    height: CAR_HEIGHT,
    position: 'absolute',
    left: 0,
    top: 0,
    zIndex: 0,
  },
  tyreBox: {
    borderRadius: 3,
    opacity: 0.85,
  },
  brakeBar: {
    borderRadius: 1,
    opacity: 0.95,
  },
  damageFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1a1e2e',
    paddingTop: 3,
  },
  damagePillText: {
    color: '#f87171',
    fontSize: 7.5,
    fontWeight: '700',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
});
