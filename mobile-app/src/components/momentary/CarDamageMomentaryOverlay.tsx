import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle } from 'react-native-svg';
import { MomentaryOverlayContainer } from './MomentaryOverlayContainer';

interface CarDamageMomentaryOverlayProps {
  onDismiss: () => void;
  frontLeftWing: number;
  frontRightWing: number;
  rearWing: number;
  floor: number;
  diffuser: number;
  sidepod: number;
  gearBox: number;
  engine: number;
}

export const CarDamageMomentaryOverlay: React.FC<CarDamageMomentaryOverlayProps> = ({
  onDismiss,
  frontLeftWing = 0,
  frontRightWing = 0,
  rearWing = 0,
  floor = 0,
  diffuser = 0,
  sidepod = 0,
  gearBox = 0,
  engine = 0
}) => {
  const getDamageColor = (percent: number = 0) => {
    const val = Number(percent) || 0;
    if (val <= 0) return '#22c55e'; // Sem dano (Verde)
    if (val < 25) return '#eab308'; // Leve (Amarelo)
    if (val < 50) return '#f97316'; // Moderado (Laranja)
    return '#ef4444'; // Severo (Vermelho)
  };

  const maxDamage = Math.max(
    frontLeftWing || 0,
    frontRightWing || 0,
    rearWing || 0,
    floor || 0,
    engine || 0,
    gearBox || 0
  );

  const statusLabel =
    maxDamage > 50
      ? 'CRITICAL DAMAGE DETECTED'
      : maxDamage > 20
      ? 'MODERATE DAMAGE'
      : maxDamage > 0
      ? 'MINOR COMPONENT WEAR'
      : 'ALL SYSTEMS NOMINAL';

  const badgeColor =
    maxDamage > 50 ? '#ef4444' : maxDamage > 20 ? '#f97316' : '#22c55e';

  return (
    <MomentaryOverlayContainer
      durationSeconds={6}
      onDismiss={onDismiss}
      title="CAR DAMAGE & TELEMETRY DIAGNOSTIC"
      badge="DAMAGE REPORT"
      badgeColor={badgeColor}
    >
      <View style={styles.card}>
        <View style={styles.body}>
          {/* Desenho do Carro em SVG */}
          <View style={styles.carContainer}>
            <Svg width="160" height="240" viewBox="0 0 180 300">
              {/* 4 Rodas */}
              <Rect x="10" y="40" width="24" height="45" rx="4" fill="#334155" />
              <Rect x="146" y="40" width="24" height="45" rx="4" fill="#334155" />
              <Rect x="10" y="215" width="28" height="55" rx="4" fill="#334155" />
              <Rect x="142" y="215" width="28" height="55" rx="4" fill="#334155" />

              {/* Asa Dianteira Esquerda */}
              <Path
                d="M 20 20 L 85 20 L 85 36 L 25 36 Z"
                fill={getDamageColor(frontLeftWing)}
                opacity={0.9}
              />
              {/* Asa Dianteira Direita */}
              <Path
                d="M 95 20 L 160 20 L 155 36 L 95 36 Z"
                fill={getDamageColor(frontRightWing)}
                opacity={0.9}
              />

              {/* Nariz do Carro */}
              <Path d="M 75 30 L 105 30 L 100 80 L 80 80 Z" fill="#1e293b" stroke="#475569" strokeWidth="1" />

              {/* Cockpit */}
              <Path
                d="M 65 80 L 115 80 L 125 150 L 55 150 Z"
                fill="#0f172a"
                stroke="#334155"
                strokeWidth="1"
              />

              {/* Assoalho / Sidepods (Floor) */}
              <Path
                d="M 40 120 L 140 120 L 135 210 L 45 210 Z"
                fill={getDamageColor(Math.max(floor || 0, sidepod || 0))}
                opacity={0.7}
              />

              {/* Motor e Câmbio (Centro) */}
              <Circle
                cx="90"
                cy="175"
                r="20"
                fill={getDamageColor(Math.max(engine || 0, gearBox || 0))}
                opacity={0.9}
              />

              {/* Asa Traseira */}
              <Rect
                x="35"
                y="275"
                width="110"
                height="16"
                rx="3"
                fill={getDamageColor(rearWing)}
                opacity={0.9}
              />
            </Svg>
          </View>

          {/* Lista Detalhada de Danos */}
          <View style={styles.statsContainer}>
            <View style={styles.statusBadgeRow}>
              <Text style={[styles.mainStatusText, { color: badgeColor }]}>{statusLabel}</Text>
            </View>

            <Text style={styles.sectionHeader}>AERODYNAMICS & CHASSIS</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Front Wing (L / R):</Text>
              <Text style={[styles.statValue, { color: getDamageColor(Math.max(frontLeftWing || 0, frontRightWing || 0)) }]}>
                {frontLeftWing || 0}% / {frontRightWing || 0}%
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Rear Wing:</Text>
              <Text style={[styles.statValue, { color: getDamageColor(rearWing || 0) }]}>
                {rearWing || 0}%
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Floor & Diffuser:</Text>
              <Text style={[styles.statValue, { color: getDamageColor(floor || 0) }]}>
                {floor || 0}%
              </Text>
            </View>

            <Text style={[styles.sectionHeader, { marginTop: 10 }]}>ENGINE & POWERTRAIN</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>ICE Engine:</Text>
              <Text style={[styles.statValue, { color: getDamageColor(engine || 0) }]}>
                {engine || 0}%
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Gearbox:</Text>
              <Text style={[styles.statValue, { color: getDamageColor(gearBox || 0) }]}>
                {gearBox || 0}%
              </Text>
            </View>

            {/* Legenda de cores */}
            <View style={styles.legendRow}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                <Text style={styles.legendText}>0% OK</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
                <Text style={styles.legendText}>&lt;25%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                <Text style={styles.legendText}>&lt;50%</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                <Text style={styles.legendText}>&gt;50%</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </MomentaryOverlayContainer>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0c0e17',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#252a3d',
    width: '95%',
    maxWidth: 700,
    padding: 14
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around'
  },
  carContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingRight: 10
  },
  statsContainer: {
    flex: 1,
    paddingLeft: 14
  },
  statusBadgeRow: {
    marginBottom: 8
  },
  mainStatusText: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1
  },
  sectionHeader: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 2,
    borderBottomWidth: 1,
    borderBottomColor: '#161a29'
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600'
  },
  statValue: {
    fontSize: 11,
    fontWeight: '800'
  },
  legendRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  legendText: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '700'
  }
});
