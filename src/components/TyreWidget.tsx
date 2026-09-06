import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VisualTyreCompound, Formatters } from '@f1-dash/telemetry-core';

interface TyreWidgetProps {
  compound: VisualTyreCompound;
  tyresAgeLaps: number;
  tyresWear: [number, number, number, number]; // [RL, RR, FL, FR]
  tyresSurfaceTemp: [number, number, number, number]; // [RL, RR, FL, FR]
  tyresPressure: [number, number, number, number];
}

export const TyreWidget: React.FC<TyreWidgetProps> = ({
  compound,
  tyresAgeLaps,
  tyresWear,
  tyresSurfaceTemp,
  tyresPressure
}) => {
  const compoundInfo = Formatters.getTyreCompoundInfo(compound);

  const renderTyreCell = (label: string, index: number) => {
    const wear = tyresWear[index] || 0;
    const temp = tyresSurfaceTemp[index] || 0;
    const press = tyresPressure[index] ? tyresPressure[index].toFixed(1) : '22.5';

    let wearColor = '#22c55e';
    if (wear > 50) wearColor = '#ef4444';
    else if (wear > 25) wearColor = '#eab308';

    return (
      <View style={styles.tyreBox}>
        <Text style={styles.tyreLabel}>{label}</Text>
        <Text style={[styles.wearText, { color: wearColor }]}>{wear.toFixed(0)}%</Text>
        <Text style={styles.tempText}>{temp}°C</Text>
        <Text style={styles.pressText}>{press} psi</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Cabeçalho do Composto */}
      <View style={styles.compoundHeader}>
        <View style={[styles.compoundBadge, { backgroundColor: compoundInfo.color }]}>
          <Text style={[styles.compoundBadgeText, { color: compoundInfo.textColor }]}>
            {compoundInfo.short}
          </Text>
        </View>
        <Text style={styles.compoundTitle}>
          {compoundInfo.name} ({tyresAgeLaps}V)
        </Text>
      </View>

      {/* Grid 2x2 dos 4 Pneus */}
      <View style={styles.gridContainer}>
        <View style={styles.gridRow}>
          {renderTyreCell('FL', 2)}
          {renderTyreCell('FR', 3)}
        </View>
        <View style={styles.gridRow}>
          {renderTyreCell('RL', 0)}
          {renderTyreCell('RR', 1)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#09090b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 10,
    minWidth: 150
  },
  compoundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8
  },
  compoundBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center'
  },
  compoundBadgeText: {
    fontSize: 11,
    fontWeight: '900'
  },
  compoundTitle: {
    color: '#e4e4e7',
    fontSize: 12,
    fontWeight: '700'
  },
  gridContainer: {
    gap: 6
  },
  gridRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center'
  },
  tyreBox: {
    backgroundColor: '#18181b',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    minWidth: 62
  },
  tyreLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '700'
  },
  wearText: {
    fontSize: 13,
    fontWeight: '800'
  },
  tempText: {
    color: '#a1a1aa',
    fontSize: 10,
    fontWeight: '600'
  },
  pressText: {
    color: '#52525b',
    fontSize: 9
  }
});
