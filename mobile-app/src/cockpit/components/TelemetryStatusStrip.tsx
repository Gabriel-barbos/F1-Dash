/**
 * TelemetryStatusStrip — Faixa de status de telemetria inferior
 *
 * Exibe indicadores de DRS, clima e modo de pista
 * na parte inferior do cockpit central.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Weather } from '../../core/models/session';
import { CockpitTheme } from '../theme/types';

interface TelemetryStatusStripProps {
  drsActive: boolean;
  drsAllowed: boolean;
  weather: Weather;
  connected: boolean;
  packetsPerSecond: number;
  theme: CockpitTheme;
}

function getWeatherLabel(weather: Weather): string {
  switch (weather) {
    case Weather.Clear: return '☀ SECO';
    case Weather.LightCloud: return '⛅ NUBLADO';
    case Weather.Overcast: return '☁ COBERTO';
    case Weather.LightRain: return '🌦 CHUVA LEVE';
    case Weather.HeavyRain: return '🌧 CHUVA FORTE';
    case Weather.Storm: return '⛈ TEMPESTADE';
    default: return '-- --';
  }
}

function getWeatherColor(weather: Weather): string {
  switch (weather) {
    case Weather.Clear:
    case Weather.LightCloud:
    case Weather.Overcast:
      return '#94a3b8';
    case Weather.LightRain:
      return '#38bdf8';
    case Weather.HeavyRain:
    case Weather.Storm:
      return '#3b82f6';
    default:
      return '#64748b';
  }
}

export const TelemetryStatusStrip: React.FC<TelemetryStatusStripProps> = memo(({
  drsActive,
  drsAllowed,
  weather,
  connected,
  packetsPerSecond,
  theme,
}) => {
  return (
    <View style={styles.container}>
      {/* DRS Status */}
      <View style={[
        styles.chip,
        drsActive && { backgroundColor: '#052e16', borderColor: '#22c55e' },
        !drsActive && drsAllowed && { backgroundColor: '#172554', borderColor: '#3b82f6' },
        !drsActive && !drsAllowed && { borderColor: '#2b3149' },
      ]}>
        <Text style={[
          styles.chipText,
          drsActive && { color: '#22c55e' },
          !drsActive && drsAllowed && { color: '#60a5fa' },
          !drsActive && !drsAllowed && { color: '#475569' },
        ]}>
          DRS {drsActive ? 'OPEN' : drsAllowed ? 'AVAIL' : 'OFF'}
        </Text>
      </View>

      {/* Clima */}
      <View style={[styles.chip, { borderColor: '#2b3149' }]}>
        <Text style={[styles.chipText, { color: getWeatherColor(weather) }]}>
          {getWeatherLabel(weather)}
        </Text>
      </View>

      {/* Conectividade */}
      <View style={[styles.chip, { borderColor: '#2b3149' }]}>
        <View style={[
          styles.connDot,
          { backgroundColor: connected ? '#22c55e' : '#ef4444' }
        ]} />
        <Text style={[styles.chipText, { color: '#64748b' }]}>
          {connected ? `${packetsPerSecond}Hz` : 'DESCON.'}
        </Text>
      </View>
    </View>
  );
});

TelemetryStatusStrip.displayName = 'TelemetryStatusStrip';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    backgroundColor: '#0a0c14',
  },
  chipText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  connDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
});
