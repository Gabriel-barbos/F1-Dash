import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, StatusBar, SafeAreaView, ScrollView } from 'react-native';
import { TelemetryStore, CockpitTelemetryState } from '../core/state/telemetry-store';
import { RevLights } from '../components/RevLights';
import { GearDisplay } from '../components/GearDisplay';
import { SafetyCarBanner } from '../components/SafetyCarBanner';
import { FlagsBanner } from '../components/FlagsBanner';
import { PitStatusCard } from '../components/PitStatusCard';
import { TyreWidget } from '../components/TyreWidget';
import { ERSWidget } from '../components/ERSWidget';
import { TimingWidget } from '../components/TimingWidget';

export const CockpitScreen: React.FC = () => {
  const [telemetry, setTelemetry] = useState<CockpitTelemetryState>(
    TelemetryStore.getInstance().getState()
  );

  useEffect(() => {
    const unsubscribe = TelemetryStore.getInstance().subscribe((newState) => {
      setTelemetry({ ...newState });
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <ScrollView contentContainerStyle={styles.container}>
        {/* Barra superior de status de conexão */}
        <View style={styles.statusBar}>
          <View style={styles.connectionBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: telemetry.connected ? '#22c55e' : '#ef4444' }
              ]}
            />
            <Text style={styles.statusText}>
              {telemetry.connected
                ? `F1 ${telemetry.gameYear} CONECTADO (${telemetry.packetsPerSecond} Hz)`
                : 'AGUARDANDO TELEMETRIA UDP...'}
            </Text>
          </View>
          <Text style={styles.weatherText}>
            ☀️ {telemetry.trackTemperature}°C Pista | {telemetry.airTemperature}°C Ar
          </Text>
        </View>

        {/* Banners de Segurança / Incidentes */}
        <SafetyCarBanner
          status={telemetry.safetyCarStatus}
          isRedFlagActive={telemetry.isRedFlagActive}
          delta={telemetry.safetyCarDelta}
        />
        <FlagsBanner flag={telemetry.vehicleFiaFlags} />
        <PitStatusCard
          pitStatus={telemetry.pitStatus}
          pitLimiterActive={telemetry.pitLimiterActive}
          pitLaneTimeInLaneInMS={telemetry.pitLaneTimeInLaneInMS}
          pitStopTimerInMS={telemetry.pitStopTimerInMS}
          pitSpeedLimit={telemetry.pitSpeedLimit}
        />

        {/* Barra de LEDs de RPM no Topo */}
        <View style={styles.revLightsWrapper}>
          <RevLights
            rpmPercentage={telemetry.rpmPercentage}
            revLightsPercent={telemetry.revLightsPercent}
          />
        </View>

        {/* Área Central: Marcha, Velocidade e Widgets Laterais */}
        <View style={styles.mainGrid}>
          {/* Coluna Esquerda: ERS e Pneus */}
          <View style={styles.column}>
            <ERSWidget
              ersPercentage={telemetry.ersPercentage}
              ersDeployMode={telemetry.ersDeployMode}
              fuelInTank={telemetry.fuelInTank}
              fuelRemainingLaps={telemetry.fuelRemainingLaps}
            />
          </View>

          {/* Coluna Central: Marcha e Velocidade */}
          <View style={styles.centerColumn}>
            <GearDisplay
              gear={telemetry.gear}
              speed={telemetry.speed}
              drsActive={telemetry.drsActive}
              drsAllowed={telemetry.drsAllowed}
            />
          </View>

          {/* Coluna Direita: Tempos e Posição */}
          <View style={styles.column}>
            <TimingWidget
              position={telemetry.carPosition}
              lapNumber={telemetry.currentLapNum}
              totalLaps={telemetry.totalLaps}
              currentLapTimeInMS={telemetry.currentLapTimeInMS}
              lastLapTimeInMS={telemetry.lastLapTimeInMS}
              bestLapTimeInMS={telemetry.bestLapTimeInMS}
              deltaToLeaderInMS={telemetry.deltaToRaceLeaderInMS}
              deltaToFrontInMS={telemetry.deltaToCarInFrontInMS}
            />
          </View>
        </View>

        {/* Linha Inferior: Pneus & Pedais */}
        <View style={styles.bottomRow}>
          <TyreWidget
            compound={telemetry.visualTyreCompound}
            tyresAgeLaps={telemetry.tyresAgeLaps}
            tyresWear={telemetry.tyresWear}
            tyresSurfaceTemp={telemetry.tyresSurfaceTemperature}
            tyresPressure={telemetry.tyresPressure}
          />

          {/* Barras de Throttle e Brake */}
          <View style={styles.pedalsBox}>
            <View style={styles.pedalItem}>
              <Text style={styles.pedalLabel}>THR</Text>
              <View style={styles.pedalBarTrack}>
                <View
                  style={[
                    styles.pedalBarFill,
                    {
                      height: `${Math.round(telemetry.throttle * 100)}%`,
                      backgroundColor: '#22c55e'
                    }
                  ]}
                />
              </View>
              <Text style={styles.pedalValue}>
                {Math.round(telemetry.throttle * 100)}%
              </Text>
            </View>

            <View style={styles.pedalItem}>
              <Text style={styles.pedalLabel}>BRK</Text>
              <View style={styles.pedalBarTrack}>
                <View
                  style={[
                    styles.pedalBarFill,
                    {
                      height: `${Math.round(telemetry.brake * 100)}%`,
                      backgroundColor: '#ef4444'
                    }
                  ]}
                />
              </View>
              <Text style={styles.pedalValue}>
                {Math.round(telemetry.brake * 100)}%
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000'
  },
  container: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10
  },
  statusBar: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#18181b'
  },
  connectionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusText: {
    color: '#a1a1aa',
    fontSize: 11,
    fontWeight: '700'
  },
  weatherText: {
    color: '#71717a',
    fontSize: 11,
    fontWeight: '600'
  },
  revLightsWrapper: {
    width: '100%',
    alignItems: 'center'
  },
  mainGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    marginVertical: 4
  },
  column: {
    flex: 1,
    maxWidth: 200
  },
  centerColumn: {
    alignItems: 'center'
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    width: '100%',
    marginTop: 4
  },
  pedalsBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#09090b',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#27272a',
    padding: 10,
    alignItems: 'center'
  },
  pedalItem: {
    alignItems: 'center',
    gap: 4
  },
  pedalLabel: {
    color: '#71717a',
    fontSize: 10,
    fontWeight: '800'
  },
  pedalBarTrack: {
    width: 20,
    height: 80,
    backgroundColor: '#18181b',
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end'
  },
  pedalBarFill: {
    width: '100%',
    borderRadius: 4
  },
  pedalValue: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700'
  }
});
