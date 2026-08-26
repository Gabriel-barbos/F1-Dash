import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import Svg, { Rect, Path, Circle, G } from 'react-native-svg';

interface DamageHeatmapProps {
  visible: boolean;
  onClose: () => void;
  frontLeftWing: number;
  frontRightWing: number;
  rearWing: number;
  floor: number;
  diffuser: number;
  sidepod: number;
  gearBox: number;
  engine: number;
}

export const DamageHeatmap: React.FC<DamageHeatmapProps> = ({
  visible,
  onClose,
  frontLeftWing,
  frontRightWing,
  rearWing,
  floor,
  diffuser,
  sidepod,
  gearBox,
  engine
}) => {
  const getDamageColor = (percent: number) => {
    if (percent <= 0) return '#22c55e'; // Sem dano (Verde)
    if (percent < 25) return '#eab308'; // Leve (Amarelo)
    if (percent < 50) return '#f97316'; // Moderado (Laranja)
    return '#ef4444'; // Severo (Vermelho)
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>CAR DAMAGE & HEATMAP</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            {/* Desenho do Carro em SVG */}
            <View style={styles.carContainer}>
              <Svg width="180" height="300" viewBox="0 0 180 300">
                {/* 4 Rodas */}
                <Rect x="10" y="40" width="24" height="45" rx="4" fill="#334155" />
                <Rect x="146" y="40" width="24" height="45" rx="4" fill="#334155" />
                <Rect x="10" y="215" width="28" height="55" rx="4" fill="#334155" />
                <Rect x="142" y="215" width="28" height="55" rx="4" fill="#334155" />

                {/* Asa Dianteira Esquerda */}
                <Path
                  d="M 20 20 L 85 20 L 85 36 L 25 36 Z"
                  fill={getDamageColor(frontLeftWing)}
                  opacity={0.85}
                />
                {/* Asa Dianteira Direita */}
                <Path
                  d="M 95 20 L 160 20 L 155 36 L 95 36 Z"
                  fill={getDamageColor(frontRightWing)}
                  opacity={0.85}
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
                  fill={getDamageColor(Math.max(floor, sidepod))}
                  opacity={0.65}
                />

                {/* Motor e Câmbio (Centro) */}
                <Circle cx="90" cy="175" r="20" fill={getDamageColor(Math.max(engine, gearBox))} opacity={0.9} />

                {/* Asa Traseira */}
                <Rect
                  x="35"
                  y="275"
                  width="110"
                  height="16"
                  rx="3"
                  fill={getDamageColor(rearWing)}
                  opacity={0.85}
                />
              </Svg>
            </View>

            {/* Lista Detalhada de Danos */}
            <View style={styles.statsContainer}>
              <Text style={styles.sectionHeader}>AERODYNAMICS & CHASSIS</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Front Wing (L / R):</Text>
                <Text style={[styles.statValue, { color: getDamageColor(Math.max(frontLeftWing, frontRightWing)) }]}>
                  {frontLeftWing}% / {frontRightWing}%
                </Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Rear Wing:</Text>
                <Text style={[styles.statValue, { color: getDamageColor(rearWing) }]}>{rearWing}%</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Floor & Diffuser:</Text>
                <Text style={[styles.statValue, { color: getDamageColor(floor) }]}>{floor}%</Text>
              </View>

              <Text style={[styles.sectionHeader, { marginTop: 14 }]}>ENGINE & TRANSMISSION</Text>
              <View style={styles.statRow}>
                <Text style={styles.statLabel}>ICE Engine:</Text>
                <Text style={[styles.statValue, { color: getDamageColor(engine) }]}>{engine}%</Text>
              </View>

              <View style={styles.statRow}>
                <Text style={styles.statLabel}>Gearbox:</Text>
                <Text style={[styles.statValue, { color: getDamageColor(gearBox) }]}>{gearBox}%</Text>
              </View>

              {/* Legenda de cores */}
              <View style={styles.legendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                  <Text style={styles.legendText}>0% OK</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#eab308' }]} />
                  <Text style={styles.legendText}>Light</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#f97316' }]} />
                  <Text style={styles.legendText}>Moderate</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                  <Text style={styles.legendText}>Severe</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalCard: {
    backgroundColor: '#0c0e17',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#252a3d',
    width: '90%',
    maxWidth: 680,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1e2436',
    paddingBottom: 10
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1
  },
  closeBtn: {
    backgroundColor: '#1e2436',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center'
  },
  closeText: {
    color: '#cbd5e1',
    fontWeight: 'bold',
    fontSize: 14
  },
  body: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12
  },
  carContainer: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  statsContainer: {
    flex: 1,
    paddingLeft: 24
  },
  sectionHeader: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#161a29'
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600'
  },
  statValue: {
    fontSize: 12,
    fontWeight: '800'
  },
  legendRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  legendText: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '700'
  }
});
