/**
 * GearSpeedDisplay — Display central de RPM, Marcha e Velocidade
 *
 * Design limpo e nítido:
 * - 7600 RPM no topo
 * - Marcha gigante branca no centro
 * - 375 Km/h na base
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Zap } from 'lucide-react-native';
import { ERSDeployMode } from '@f1-dash/telemetry-core';
import { CockpitTheme } from '../theme/types';

interface GearSpeedDisplayProps {
  gear: number;
  speed: number;
  rpm: number;
  drsActive?: boolean;
  drsAllowed?: boolean;
  is2026Regulations?: boolean;
  activeAeroMode?: number;
  activeAeroAvailable?: boolean;
  activeAeroActivationDistance?: number;
  overtakeActive?: boolean;
  overtakeAvailable?: boolean;
  overtakeActivationDistance?: number;
  ersDeployMode?: ERSDeployMode;
  theme: CockpitTheme;
}

export const GearSpeedDisplay: React.FC<GearSpeedDisplayProps> = memo(({
  gear,
  speed,
  rpm,
  drsActive = false,
  drsAllowed = false,
  is2026Regulations = false,
  activeAeroMode = 0,
  activeAeroAvailable = false,
  activeAeroActivationDistance = 0,
  overtakeActive = false,
  overtakeAvailable = false,
  overtakeActivationDistance = 0,
  ersDeployMode = ERSDeployMode.Medium,
}) => {
  const gearText = gear === 0 ? 'N' : gear === -1 ? 'R' : gear.toString();

  // 1. MODO RETA (Exclusivo F1 2026) vs DRS (Modo Clássico 2025)
  let aeroLabel: string | null = null;
  let aeroColor = '#22c55e';
  let aeroBg = 'rgba(34, 197, 94, 0.18)';

  if (is2026Regulations) {
    if (activeAeroMode === 1) {
      aeroLabel = 'MODO RETA (X)';
      aeroColor = '#22c55e';
      aeroBg = 'rgba(34, 197, 94, 0.25)';
    } else if (activeAeroAvailable) {
      aeroLabel = activeAeroActivationDistance > 0 ? `RETA ${activeAeroActivationDistance}m` : 'RETA DISPONÍVEL';
      aeroColor = '#38bdf8';
      aeroBg = 'rgba(56, 189, 248, 0.2)';
    }
  } else {
    // Modo 2025 / DRS tradicional
    if (drsActive) {
      aeroLabel = 'DRS OPEN';
      aeroColor = '#22c55e';
      aeroBg = 'rgba(34, 197, 94, 0.25)';
    } else if (drsAllowed) {
      aeroLabel = 'DRS AVAIL';
      aeroColor = '#38bdf8';
      aeroBg = 'rgba(56, 189, 248, 0.2)';
    }
  }

  // 2. MODO OVERTAKE (<1s do rival, Exclusivo F1 2026)
  let ovtkLabel: string | null = null;
  let ovtkColor = '#f97316';
  let ovtkBg = 'rgba(249, 115, 22, 0.22)';

  if (is2026Regulations) {
    if (overtakeActive) {
      ovtkLabel = 'OVERTAKE ATIVO';
      ovtkColor = '#f97316';
      ovtkBg = 'rgba(249, 115, 22, 0.28)';
    } else if (overtakeAvailable) {
      ovtkLabel = overtakeActivationDistance > 0 ? `OVTK ${overtakeActivationDistance}m` : 'OVERTAKE LIBERADO';
      ovtkColor = '#eab308';
      ovtkBg = 'rgba(234, 179, 8, 0.2)';
    }
  }

  // 3. MODO BOOST (Acionamento manual da bateria no controle)
  let boostLabel: string | null = null;
  let boostColor = '#3b82f6';
  let boostBg = 'rgba(59, 130, 246, 0.25)';

  if (ersDeployMode === ERSDeployMode.Overtake) {
    boostLabel = is2026Regulations ? 'BOOST MANUAL' : 'BOOST';
    boostColor = '#3b82f6';
    boostBg = 'rgba(59, 130, 246, 0.25)';
  }

  return (
    <View style={styles.container}>
      {/* Topo: RPM */}
      <View style={styles.rpmRow}>
        <Text style={styles.rpmValue}>{rpm ?? 0}</Text>
        <Text style={styles.rpmLabel}>RPM</Text>
      </View>

      {/* Centro: Marcha Gigante */}
      <Text style={styles.gearText}>{gearText || 'N'}</Text>

      {/* Base: Velocidade */}
      <View style={styles.speedRow}>
        <Text style={styles.speedValue}>{speed ?? 0}</Text>
        <Text style={styles.speedLabel}>Km/h</Text>
      </View>

      {/* Badges Dinâmicos: Reta, Overtake 1s e Boost Manual */}
      {(aeroLabel || ovtkLabel || boostLabel) && (
        <View style={styles.badgesRow}>
          {aeroLabel && (
            <View style={[styles.badgePill, { borderColor: aeroColor, backgroundColor: aeroBg }]}>
              <Text style={[styles.badgeText, { color: aeroColor }]}>{aeroLabel}</Text>
            </View>
          )}
          {ovtkLabel && (
            <View style={[styles.badgePill, { borderColor: ovtkColor, backgroundColor: ovtkBg }]}>
              <Zap size={9} color={ovtkColor} strokeWidth={3} />
              <Text style={[styles.badgeText, { color: ovtkColor }]}>{ovtkLabel}</Text>
            </View>
          )}
          {boostLabel && (
            <View style={[styles.badgePill, { borderColor: boostColor, backgroundColor: boostBg }]}>
              <Zap size={9} color={boostColor} strokeWidth={3} />
              <Text style={[styles.badgeText, { color: boostColor }]}>{boostLabel}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
});

GearSpeedDisplay.displayName = 'GearSpeedDisplay';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 170,
    height: 240,
  },
  rpmRow: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rpmValue: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
    fontVariant: ['tabular-nums'],
  },
  rpmLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1,
  },
  gearText: {
    color: '#ffffff',
    fontSize: 128,
    fontWeight: '900',
    lineHeight: 104,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  speedRow: {
    alignItems: 'center',
    marginTop: 20,
  },
  speedValue: {
    color: '#ffffff',
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: 0.8,
    lineHeight: 34,
    fontVariant: ['tabular-nums'],
  },
  speedLabel: {
    color: '#64748b',
    fontSize: 15,
    fontWeight: '800',
    marginTop: -2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
    flexWrap: 'wrap',
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
});
