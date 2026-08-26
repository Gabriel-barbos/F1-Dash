import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { VisualTyreCompound } from '../core/models/car-status';

interface TyreWidgetProps {
  compound: VisualTyreCompound;
  tyresAgeLaps: number;
  surfaceTemps: [number, number, number, number]; // [RL, RR, FL, FR]
  pressures: [number, number, number, number];
  wear: [number, number, number, number];
}

export const TyreWidget: React.FC<TyreWidgetProps> = ({
  compound,
  tyresAgeLaps,
  surfaceTemps,
  pressures,
  wear
}) => {
  // Configuração visual do Composto
  let compoundLetter = 'H';
  let compoundColor = '#ffffff';
  let compoundName = 'HARD';

  switch (compound) {
    case VisualTyreCompound.F1_Soft:
      compoundLetter = 'S';
      compoundColor = '#ef4444';
      compoundName = 'SOFT';
      break;
    case VisualTyreCompound.F1_Medium:
      compoundLetter = 'M';
      compoundColor = '#eab308';
      compoundName = 'MEDIUM';
      break;
    case VisualTyreCompound.F1_Hard:
      compoundLetter = 'H';
      compoundColor = '#ffffff';
      compoundName = 'HARD';
      break;
    case VisualTyreCompound.F1_Inter:
      compoundLetter = 'I';
      compoundColor = '#22c55e';
      compoundName = 'INTER';
      break;
    case VisualTyreCompound.F1_Wet:
      compoundLetter = 'W';
      compoundColor = '#3b82f6';
      compoundName = 'WET';
      break;
  }

  // Helper para cor de temperatura de pneu
  const getTempColor = (temp: number) => {
    if (temp < 80) return '#38bdf8'; // Frio
    if (temp <= 105) return '#22c55e'; // Ótimo
    if (temp <= 115) return '#eab308'; // Quente
    return '#ef4444'; // Superaquecido
  };

  const renderTyre = (pos: string, temp: number, psi: number, w: number) => (
    <View style={styles.tyreBox}>
      <Text style={styles.tyrePos}>{pos}</Text>
      <Text style={[styles.tyreTemp, { color: getTempColor(temp) }]}>{temp}°C</Text>
      <Text style={styles.tyrePsi}>{psi.toFixed(1)} PSI</Text>
      <Text style={styles.tyreWear}>{w}% desg</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Cabeçalho do Composto */}
      <View style={styles.header}>
        <View style={[styles.compoundBadge, { borderColor: compoundColor }]}>
          <Text style={[styles.compoundLetter, { color: compoundColor }]}>{compoundLetter}</Text>
        </View>
        <View style={styles.compoundInfo}>
          <Text style={styles.compoundTitle}>{compoundName}</Text>
          <Text style={styles.compoundAge}>{tyresAgeLaps} voltas</Text>
        </View>
      </View>

      {/* Grid dos 4 Pneus */}
      <View style={styles.grid}>
        <View style={styles.row}>
          {renderTyre('FL', surfaceTemps[2] ?? 90, pressures[2] ?? 23.5, wear[2] ?? 0)}
          {renderTyre('FR', surfaceTemps[3] ?? 90, pressures[3] ?? 23.5, wear[3] ?? 0)}
        </View>
        <View style={styles.row}>
          {renderTyre('RL', surfaceTemps[0] ?? 90, pressures[0] ?? 23.5, wear[0] ?? 0)}
          {renderTyre('RR', surfaceTemps[1] ?? 90, pressures[1] ?? 23.5, wear[1] ?? 0)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#10121a',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#24283b',
    minWidth: 130
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  compoundBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6
  },
  compoundLetter: {
    fontSize: 12,
    fontWeight: '900'
  },
  compoundInfo: {
    justifyContent: 'center'
  },
  compoundTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800'
  },
  compoundAge: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600'
  },
  grid: {
    gap: 6
  },
  row: {
    flexDirection: 'row',
    gap: 6
  },
  tyreBox: {
    flex: 1,
    backgroundColor: '#161925',
    padding: 4,
    borderRadius: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#272d42'
  },
  tyrePos: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '700'
  },
  tyreTemp: {
    fontSize: 11,
    fontWeight: '800',
    marginVertical: 1
  },
  tyrePsi: {
    color: '#94a3b8',
    fontSize: 8,
    fontWeight: '600'
  },
  tyreWear: {
    color: '#64748b',
    fontSize: 7,
    fontWeight: '600'
  }
});
