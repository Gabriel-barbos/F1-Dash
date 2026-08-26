import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar
} from 'react-native';
import { CockpitTelemetryState } from '../core/state/telemetry-state';
import { telemetryService, ConnectionMode } from '../services/telemetry-service';
import { SafetyCarStatus } from '../core/models/session';
import { PitStatus } from '../core/models/lap-data';

import { RevLights } from '../components/RevLights';
import { ModernRpmArc } from '../components/ModernRpmArc';
import { GearDisplay } from '../components/GearDisplay';
import { ThrottleBrakeBars } from '../components/ThrottleBrakeBars';
import { ErsWidget } from '../components/ErsWidget';
import { TyreWidget } from '../components/TyreWidget';
import { TimingWidget } from '../components/TimingWidget';
import { SafetyCarBanner } from '../components/SafetyCarBanner';
import { RedFlagBanner } from '../components/RedFlagBanner';
import { PitLaneBanner } from '../components/PitLaneBanner';
import { DamageHeatmap } from '../components/DamageHeatmap';

export const CockpitScreen: React.FC = () => {
  const [telemetry, setTelemetry] = useState<CockpitTelemetryState>({} as any);
  const [uiMode, setUiMode] = useState<'REALISTIC' | 'MODERN'>('REALISTIC');
  const [damageModalVisible, setDamageModalVisible] = useState(false);
  const [connMode, setConnMode] = useState<ConnectionMode>('UDP_NATIVE');

  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((state) => {
      setTelemetry({ ...state });
    });

    telemetryService.setMode('UDP_NATIVE');

    return () => {
      unsubscribe();
    };
  }, []);

  const cycleConnectionMode = () => {
    let nextMode: ConnectionMode = 'UDP_NATIVE';
    if (connMode === 'UDP_NATIVE') nextMode = 'WEBSOCKET';
    else if (connMode === 'WEBSOCKET') nextMode = 'MOCK';
    else nextMode = 'UDP_NATIVE';

    setConnMode(nextMode);
    telemetryService.setMode(nextMode);
  };

  const isSafetyCar =
    telemetry.safetyCarStatus === SafetyCarStatus.Full ||
    telemetry.safetyCarStatus === SafetyCarStatus.Virtual;

  const isRedFlag = telemetry.isRedFlagActive;

  const isPitLane =
    telemetry.pitStatus === PitStatus.InPitArea ||
    telemetry.pitStatus === PitStatus.Pitting ||
    telemetry.pitLimiterActive;

  const hasCriticalDamage =
    (telemetry.frontLeftWingDamage ?? 0) > 20 ||
    (telemetry.frontRightWingDamage ?? 0) > 20 ||
    (telemetry.floorDamage ?? 0) > 20 ||
    (telemetry.engineDamage ?? 0) > 20;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar hidden />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View style={styles.statusGroup}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: telemetry.connected ? '#22c55e' : '#ef4444' }
              ]}
            />
            <Text style={styles.statusText}>
              {telemetry.connected
                ? connMode === 'MOCK'
                  ? 'SIMULADOR DE TESTE ATIVO (60 FPS)'
                  : connMode === 'UDP_NATIVE'
                  ? `UDP 20777 ATIVO (F1 ${telemetry.gameYear ?? 2025})`
                  : `WEBSOCKET CONECTADO (F1 ${telemetry.gameYear ?? 2025})`
                : connMode === 'UDP_NATIVE'
                ? 'ESCUTANDO UDP 20777 (AGUARDANDO DADOS DO JOGO)...'
                : 'AGUARDANDO CONEXÃO COM SERVIDOR...'}
            </Text>
          </View>

          <View style={styles.actionsGroup}>
            <TouchableOpacity onPress={cycleConnectionMode} style={styles.connToggleBtn}>
              <Text style={styles.connToggleText}>
                FONTE: {connMode === 'UDP_NATIVE' ? 'UDP DIRETO' : connMode === 'WEBSOCKET' ? 'WS PC' : 'MOCK'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setUiMode(uiMode === 'REALISTIC' ? 'MODERN' : 'REALISTIC')}
              style={styles.modeToggleBtn}
            >
              <Text style={styles.modeToggleText}>
                {uiMode === 'REALISTIC' ? 'MODO REALISTA' : 'MODO MODERNO'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setDamageModalVisible(true)}
              style={[styles.damageBtn, hasCriticalDamage && styles.damageBtnAlert]}
            >
              <Text style={styles.damageBtnText}>
                {hasCriticalDamage ? '⚠️ DAMAGE DETECTED' : 'CAR DAMAGE'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {connMode === 'MOCK' && (
          <View style={styles.scenarioBar}>
            <Text style={styles.scenarioLabel}>CENÁRIO:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scenarioScroll}>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('NORMAL')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Normal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('DRS')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>DRS Ativo</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('OVERTAKE')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Overtake</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('SAFETY_CAR')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Safety Car</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('VSC')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>VSC</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('RED_FLAG')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Red Flag</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('PIT_LANE')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Pit Lane</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('DAMAGE')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Dano</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        <View style={styles.dashboardBody}>
          {isRedFlag ? (
            <RedFlagBanner />
          ) : isSafetyCar ? (
            <SafetyCarBanner
              status={telemetry.safetyCarStatus}
              delta={telemetry.safetyCarDelta ?? 0}
              speedLimit={80}
            />
          ) : isPitLane ? (
            <PitLaneBanner
              speedLimit={telemetry.pitSpeedLimit ?? 80}
              currentSpeed={telemetry.speed ?? 0}
              timeInLaneMS={telemetry.pitLaneTimeInLaneInMS ?? 0}
            />
          ) : (
            <View style={styles.racingLayout}>
              <View style={styles.revLightsArea}>
                {uiMode === 'REALISTIC' ? (
                  <RevLights revPercent={telemetry.revLightsPercent ?? 0} />
                ) : (
                  <ModernRpmArc
                    rpm={telemetry.engineRPM ?? 0}
                    maxRpm={telemetry.maxRPM ?? 13500}
                    revPercent={telemetry.revLightsPercent ?? 0}
                  />
                )}
              </View>

              <View style={styles.columnsContainer}>
                <View style={styles.leftColumn}>
                  <TimingWidget
                    position={telemetry.carPosition ?? 5}
                    currentLap={telemetry.currentLapNum ?? 1}
                    totalLaps={telemetry.totalLaps ?? 58}
                    currentLapTimeMS={telemetry.currentLapTimeInMS ?? 0}
                    lastLapTimeMS={telemetry.lastLapTimeInMS ?? 0}
                    deltaFrontMS={telemetry.deltaToCarInFrontInMS ?? 0}
                  />
                  <ErsWidget
                    batteryPercent={telemetry.ersPercentage ?? 100}
                    deployMode={telemetry.ersDeployMode ?? 0}
                    overtakeActive={telemetry.speed > 250 && telemetry.gear >= 6}
                  />
                </View>

                <View style={styles.centerColumn}>
                  <GearDisplay
                    gear={telemetry.gear ?? 0}
                    speed={telemetry.speed ?? 0}
                    rpm={telemetry.engineRPM ?? 0}
                    drsActive={telemetry.drsActive ?? false}
                    drsAllowed={telemetry.drsAllowed ?? false}
                    overtakeActive={telemetry.speed > 260}
                  />
                </View>

                <View style={styles.rightColumn}>
                  <TyreWidget
                    compound={telemetry.visualTyreCompound ?? 18}
                    tyresAgeLaps={telemetry.tyresAgeLaps ?? 1}
                    surfaceTemps={telemetry.tyresSurfaceTemperature ?? [90, 90, 90, 90]}
                    pressures={telemetry.tyresPressure ?? [23.5, 23.5, 23.5, 23.5]}
                    wear={telemetry.tyresWear ?? [0, 0, 0, 0]}
                  />
                  <ThrottleBrakeBars
                    throttle={telemetry.throttle ?? 0}
                    brake={telemetry.brake ?? 0}
                  />
                </View>
              </View>
            </View>
          )}
        </View>

        <DamageHeatmap
          visible={damageModalVisible}
          onClose={() => setDamageModalVisible(false)}
          frontLeftWing={telemetry.frontLeftWingDamage ?? 0}
          frontRightWing={telemetry.frontRightWingDamage ?? 0}
          rearWing={telemetry.rearWingDamage ?? 0}
          floor={telemetry.floorDamage ?? 0}
          diffuser={telemetry.diffuserDamage ?? 0}
          sidepod={telemetry.sidepodDamage ?? 0}
          gearBox={telemetry.gearBoxDamage ?? 0}
          engine={telemetry.engineDamage ?? 0}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090a0f'
  },
  container: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 6
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#171924'
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 6
  },
  connToggleBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38bdf8'
  },
  connToggleText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '900'
  },
  modeToggleBtn: {
    backgroundColor: '#161925',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2b3149'
  },
  modeToggleText: {
    color: '#cbd5e1',
    fontSize: 9,
    fontWeight: '800'
  },
  damageBtn: {
    backgroundColor: '#161925',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2b3149'
  },
  damageBtnAlert: {
    backgroundColor: '#450a0a',
    borderColor: '#ef4444'
  },
  damageBtnText: {
    color: '#f8fafc',
    fontSize: 9,
    fontWeight: '800'
  },
  scenarioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10121a',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 4,
    gap: 8
  },
  scenarioLabel: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '900'
  },
  scenarioScroll: {
    gap: 6
  },
  scenarioBtn: {
    backgroundColor: '#1e2436',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  scenarioBtnText: {
    color: '#e2e8f0',
    fontSize: 9,
    fontWeight: '700'
  },
  dashboardBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4
  },
  racingLayout: {
    flex: 1,
    width: '100%',
    justifyContent: 'space-between'
  },
  revLightsArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  leftColumn: {
    gap: 8,
    alignItems: 'flex-start'
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  rightColumn: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center'
  }
});