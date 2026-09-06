/**
 * CentralCockpit — Redesign Completo do Center HUD
 *
 * Transforma o centro em um autêntico Instrument Cluster moderno de Fórmula 1:
 *
 *               [ RpmIndicator ]
 *                  11 560 RPM
 *         [ ACC ]     [ 7 ]     [ BRAKE ]
 *                   283 KM/H
 *           [ DynamicStatusIndicator ]
 *              [ WeatherIndicator ]
 *
 * - Marcha gigante e dominante com resposta mecânica instantânea
 * - Espaço negativo generoso e respirável
 * - Sem excesso de botões ou poluição RGB
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ERSDeployMode, Weather } from '@f1-dash/telemetry-core';
import { CockpitTheme } from '../theme/types';
import { RpmIndicator } from './RpmIndicator';
import { GearDisplay } from './GearDisplay';
import { SpeedDisplay } from './SpeedDisplay';
import { InputBar } from './InputBars';
import { DynamicStatusIndicator } from './DynamicStatusIndicator';
import { WeatherIndicator } from './WeatherIndicator';

interface CentralCockpitProps {
  gear: number;
  speed: number;
  rpm: number;
  maxRpm?: number;
  revPercent: number;
  throttle: number;
  brake: number;
  drsActive: boolean;
  drsAllowed: boolean;
  is2026Regulations?: boolean;
  activeAeroMode?: number;
  activeAeroAvailable?: boolean;
  activeAeroActivationDistance?: number;
  overtakeActive?: boolean;
  overtakeAvailable?: boolean;
  overtakeActivationDistance?: number;
  ersDeployMode?: ERSDeployMode;
  weather?: Weather;
  airTemperature?: number;
  trackTemperature?: number;
  theme: CockpitTheme;
}

export const CentralCockpit: React.FC<CentralCockpitProps> = memo(({
  gear,
  speed,
  rpm,
  revPercent,
  throttle,
  brake,
  drsActive,
  drsAllowed,
  is2026Regulations = false,
  activeAeroMode = 0,
  activeAeroAvailable = false,
  activeAeroActivationDistance = 0,
  overtakeActive = false,
  overtakeAvailable = false,
  overtakeActivationDistance = 0,
  ersDeployMode = ERSDeployMode.Medium,
  weather = Weather.Clear,
  airTemperature,
  trackTemperature,
  theme,
}) => {
  // Formatação do RPM com separador elegante (ex: 11 450)
  const rpmFormatted = Math.round(rpm || 0)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

  return (
    <View style={styles.container}>
      {/* 1. Indicador de RPM em pontos reativos */}
      <RpmIndicator
        revPercent={revPercent}
        palette={theme.shiftLights}
      />

      {/* 2. Leitura Numérica de RPM */}
      <View style={styles.rpmRow}>
        <Text style={styles.rpmValue}>{rpmFormatted}</Text>
        <Text style={styles.rpmLabel}>RPM</Text>
      </View>

      {/* 3. Bloco Central: Aceleração (flanco) + Marcha/Velocidade + Freio (flanco) */}
      <View style={styles.instrumentRow}>
        <InputBar value={throttle} type="throttle" height={105} />

        <View style={styles.gearSpeedBlock}>
          <GearDisplay gear={gear} />
          <SpeedDisplay speed={speed} />
        </View>

        <InputBar value={brake} type="brake" height={105} />
      </View>

      {/* 4. Sistema Dinâmico de Status (DRS, Overtake, Active Aero, Boost) */}
      <View style={styles.statusRow}>
        <DynamicStatusIndicator
          drsActive={drsActive}
          drsAllowed={drsAllowed}
          is2026Regulations={is2026Regulations}
          activeAeroMode={activeAeroMode}
          activeAeroAvailable={activeAeroAvailable}
          activeAeroActivationDistance={activeAeroActivationDistance}
          overtakeActive={overtakeActive}
          overtakeAvailable={overtakeAvailable}
          overtakeActivationDistance={overtakeActivationDistance}
          ersDeployMode={ersDeployMode}
        />
      </View>

      {/* 5. Indicador Discreto de Clima */}
      <WeatherIndicator
        weather={weather}
        airTemperature={airTemperature}
        trackTemperature={trackTemperature}
      />
    </View>
  );
});

CentralCockpit.displayName = 'CentralCockpit';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 2,
  },
  rpmRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginTop: 2,
    marginBottom: 4,
  },
  rpmValue: {
    color: '#cbd5e1',
    fontSize: 14,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.8,
  },
  rpmLabel: {
    color: '#64748b',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 1,
  },
  instrumentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    marginVertical: 2,
  },
  gearSpeedBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 140,
  },
  statusRow: {
    marginTop: 8,
    minHeight: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
