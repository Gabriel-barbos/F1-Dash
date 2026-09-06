/**
 * WeatherIndicator — Indicador Discreto de Condições Climáticas no Center HUD
 *
 * Exibe temperatura e condição da pista de maneira sutil:
 * ex: ☀️ 26°C · SECO  ou  🌧 18°C · MOLHADO
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Sun, Cloud, CloudRain } from 'lucide-react-native';
import { Weather } from '@f1-dash/telemetry-core';

interface WeatherIndicatorProps {
  weather?: Weather;
  airTemperature?: number;
  trackTemperature?: number;
}

export const WeatherIndicator: React.FC<WeatherIndicatorProps> = memo(({
  weather = Weather.Clear,
  airTemperature,
  trackTemperature,
}) => {
  const temp = airTemperature && airTemperature > 0
    ? airTemperature
    : trackTemperature && trackTemperature > 0
    ? trackTemperature
    : 24;

  const isRain =
    weather === Weather.LightRain ||
    weather === Weather.HeavyRain ||
    weather === Weather.Storm;

  const isCloudy =
    weather === Weather.LightCloud ||
    weather === Weather.Overcast;

  const conditionLabel = isRain ? 'WET' : 'DRY';
  const conditionColor = isRain ? '#38bdf8' : '#64748b';

  return (
    <View style={styles.container}>
      {isRain ? (
        <CloudRain size={11} color="#38bdf8" strokeWidth={2.4} />
      ) : isCloudy ? (
        <Cloud size={11} color="#94a3b8" strokeWidth={2.4} />
      ) : (
        <Sun size={11} color="#f59e0b" strokeWidth={2.4} />
      )}

      <Text style={styles.tempText}>{Math.round(temp)}°C</Text>
      <Text style={styles.dot}>·</Text>
      <Text style={[styles.conditionText, { color: conditionColor }]}>
        {conditionLabel}
      </Text>
    </View>
  );
});

WeatherIndicator.displayName = 'WeatherIndicator';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    marginTop: 6,
    opacity: 0.85,
  },
  tempText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.5,
  },
  dot: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '900',
  },
  conditionText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
