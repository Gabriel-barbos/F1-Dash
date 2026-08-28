/**
 * SessionFooter — Rodapé do cockpit com informações de sessão
 *
 * Exibe: modo de conexão, tipo de sessão e tempo restante.
 * Preparado para exibir nome da pista quando trackId
 * for adicionado ao estado de telemetria.
 */

import React, { memo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CockpitTheme } from '../theme/types';
import { ConnectionMode } from '../../services/telemetry-service';
import { getSessionTypeLabel } from '../utils/trackNames';

interface SessionFooterProps {
  sessionType: number;
  sessionTimeLeft: number;  // em segundos
  sessionTotalLaps: number;
  currentLap: number;
  connMode: ConnectionMode;
  gameYear: number;
  onPressConnMode?: () => void;
  theme: CockpitTheme;
}

function formatSessionTime(seconds: number): string {
  if (seconds <= 0) return '--:--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toFixed(0).padStart(2, '0')}`;
}

function getConnLabel(mode: ConnectionMode, year: number): string {
  switch (mode) {
    case 'UDP_NATIVE': return `UDP PS5 · F1 ${year}`;
    case 'WEBSOCKET':  return `WEBSOCKET · F1 ${year}`;
    case 'MOCK':       return 'SIMULADOR';
    default:           return mode;
  }
}

export const SessionFooter: React.FC<SessionFooterProps> = memo(({
  sessionType,
  sessionTimeLeft,
  sessionTotalLaps,
  currentLap,
  connMode,
  gameYear,
  onPressConnMode,
  theme,
}) => {
  const sessionLabel = getSessionTypeLabel(sessionType);
  const connLabel = getConnLabel(connMode, gameYear);

  // Exibe tempo restante se houver, caso contrário exibe progresso de voltas
  const progressStr = sessionTimeLeft > 0
    ? formatSessionTime(sessionTimeLeft)
    : sessionTotalLaps > 0
    ? `V ${currentLap}/${sessionTotalLaps}`
    : '--';

  return (
    <View style={styles.container}>
      {/* Tipo de sessão */}
      <View style={styles.chip}>
        <Text style={styles.chipText}>{sessionLabel}</Text>
      </View>

      {/* Progresso */}
      <View style={styles.chip}>
        <Text style={styles.chipLabel}>RESTANTE</Text>
        <Text style={[styles.chipValue, { color: theme.accent }]}>{progressStr}</Text>
      </View>

      {/* Modo de conexão */}
      <TouchableOpacity
        style={[styles.chip, styles.connChip]}
        onPress={onPressConnMode}
        activeOpacity={0.7}
      >
        <Text style={styles.chipText}>{connLabel}</Text>
      </TouchableOpacity>
    </View>
  );
});

SessionFooter.displayName = 'SessionFooter';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderTopColor: '#1a1d2e',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    backgroundColor: '#0a0c14',
    borderWidth: 1,
    borderColor: '#1e2436',
  },
  connChip: {
    borderColor: '#2b3149',
  },
  chipText: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  chipLabel: {
    color: '#475569',
    fontSize: 7,
    fontWeight: '700',
  },
  chipValue: {
    fontSize: 9,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
