import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Animated
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CockpitTelemetryState, INITIAL_TELEMETRY_STATE } from '../core/state/telemetry-state';
import { telemetryService, ConnectionMode, MomentaryEventType } from '../services/telemetry-service';
import { SafetyCarStatus } from '../core/models/session';
import { PitStatus } from '../core/models/lap-data';

import {
  useCockpitTheme,
  EventBadge,
  BatteryErsCard,
  TimingCard,
  CentralCockpit,
  CarHeatmapCard,
  TyreStatusGrid,
  SessionFooter,
} from '../cockpit';
import { ERSDeployMode } from '../core/models/car-status';

import { RaceStartOverlay } from '../components/momentary/RaceStartOverlay';
import { CarDamageMomentaryOverlay } from '../components/momentary/CarDamageMomentaryOverlay';
import { SafetyCarMomentaryOverlay } from '../components/momentary/SafetyCarMomentaryOverlay';
import { RedFlagMomentaryOverlay } from '../components/momentary/RedFlagMomentaryOverlay';
import { PitLaneMomentaryOverlay } from '../components/momentary/PitLaneMomentaryOverlay';
import { ChequeredFlagOverlay } from '../components/momentary/ChequeredFlagOverlay';

interface CockpitScreenProps {
  onNavigateToMenu?: () => void;
  initialMomentaryOverlay?: MomentaryEventType | null;
}

export const CockpitScreen: React.FC<CockpitScreenProps> = ({
  onNavigateToMenu,
  initialMomentaryOverlay = null
}) => {
  const insets = useSafeAreaInsets();
  const [telemetry, setTelemetry] = useState<CockpitTelemetryState>(INITIAL_TELEMETRY_STATE);
  const [connMode, setConnMode] = useState<ConnectionMode>(telemetryService.getMode());
  const [activeMomentaryOverlay, setActiveMomentaryOverlay] = useState<MomentaryEventType | null>(
    initialMomentaryOverlay
  );

  // Tema visual ativo — recalculado apenas quando campos de estado mudam, não a cada frame
  const theme = useCockpitTheme(telemetry);

  // Track previous states to trigger momentary alerts only on state changes
  const prevSafetyCar = useRef<SafetyCarStatus>(SafetyCarStatus.None);
  const prevRedFlag = useRef<boolean>(false);

  useEffect(() => {
    if (initialMomentaryOverlay) {
      setActiveMomentaryOverlay(initialMomentaryOverlay);
    }
  }, [initialMomentaryOverlay]);

  useEffect(() => {
    const unsubscribe = telemetryService.subscribe((state) => {
      setTelemetry({ ...state });

      // Detect Safety Car status transition
      if (
        (state.safetyCarStatus === SafetyCarStatus.Full || state.safetyCarStatus === SafetyCarStatus.Virtual) &&
        prevSafetyCar.current !== state.safetyCarStatus
      ) {
        setActiveMomentaryOverlay(
          state.safetyCarStatus === SafetyCarStatus.Virtual ? 'VSC' : 'SAFETY_CAR'
        );
      }
      prevSafetyCar.current = state.safetyCarStatus;

      // Detect Red Flag status transition
      if (state.isRedFlagActive && !prevRedFlag.current) {
        setActiveMomentaryOverlay('RED_FLAG');
      }
      prevRedFlag.current = !!state.isRedFlagActive;
    });

    const unsubMomentary = telemetryService.subscribeMomentaryEvent((event) => {
      setActiveMomentaryOverlay(event);
    });

    return () => {
      unsubscribe();
      unsubMomentary();
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

  const handleDismissOverlay = () => {
    setActiveMomentaryOverlay(null);
    // Ao fechar tela momentânea, retorna o estado do simulador para a corrida normal
    telemetryService.forceStateScenario('NORMAL');
  };

  const hasCriticalDamage =
    (telemetry.frontLeftWingDamage ?? 0) > 20 ||
    (telemetry.frontRightWingDamage ?? 0) > 20 ||
    (telemetry.floorDamage ?? 0) > 20 ||
    (telemetry.engineDamage ?? 0) > 20;

  return (
    <View
      style={[
        styles.safeArea,
        {
          backgroundColor: theme.background.primary,
          paddingTop: Math.max(insets.top, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingLeft: Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12)
        }
      ]}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Header Superior: EventBadge no centro, Menu e Conexão à direita */}
        <View style={styles.topHeader}>
          <View style={styles.headerLeftSpacer} />

          <View style={styles.headerCenter}>
            <EventBadge theme={theme} />
          </View>

          <View style={styles.headerRightGroup}>
            {onNavigateToMenu && (
              <TouchableOpacity
                onPress={onNavigateToMenu}
                style={styles.pillBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
              >
                <Text style={styles.pillBtnIcon}>≡</Text>
                <Text style={styles.pillBtnText}>MENU</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={cycleConnectionMode}
              style={[
                styles.pillBtn,
                { borderColor: telemetry.connected ? '#15803d' : '#991b1b' }
              ]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: telemetry.connected ? '#22c55e' : '#ef4444' }
                ]}
              />
              <Text style={styles.pillBtnText}>
                {telemetry.connected
                  ? connMode === 'MOCK'
                    ? 'SIMULADOR'
                    : 'CONECTADO'
                  : 'DESCONECTADO'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Mock Scenario Quick Bar */}
        {connMode === 'MOCK' && (
          <View style={styles.scenarioBar}>
            <Text style={styles.scenarioLabel}>CENÁRIO:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scenarioScroll}>
              <TouchableOpacity onPress={() => handleDismissOverlay()} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Normal</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveMomentaryOverlay('RACE_START')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Largada</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('DRS')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>DRS / Reta</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('OVERTAKE')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Overtake</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  telemetryService.forceStateScenario('SAFETY_CAR');
                  setActiveMomentaryOverlay('SAFETY_CAR');
                }}
                style={styles.scenarioBtn}
              >
                <Text style={styles.scenarioBtnText}>Safety Car</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  telemetryService.forceStateScenario('VSC');
                  setActiveMomentaryOverlay('VSC');
                }}
                style={styles.scenarioBtn}
              >
                <Text style={styles.scenarioBtnText}>VSC</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  telemetryService.forceStateScenario('RED_FLAG');
                  setActiveMomentaryOverlay('RED_FLAG');
                }}
                style={styles.scenarioBtn}
              >
                <Text style={styles.scenarioBtnText}>Red Flag</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  telemetryService.forceStateScenario('PIT_LANE');
                  setActiveMomentaryOverlay('PIT_LANE');
                }}
                style={styles.scenarioBtn}
              >
                <Text style={styles.scenarioBtnText}>Boxes</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('FASTEST_LAP')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Volta Rápida</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => telemetryService.forceStateScenario('WET')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Chuva</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveMomentaryOverlay('CHEQUERED_FLAG')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Final</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Dashboard Principal (3 Colunas perfeitamente alinhadas) */}
        <View style={styles.dashboardBody}>
          <View style={styles.columnsContainer}>
            {/* Coluna Esquerda: Bateria no Topo + Posição e Tempos embaixo */}
            <View style={styles.leftColumn}>
              <BatteryErsCard
                batteryPercent={telemetry.ersPercentage ?? 100}
                ersStoreEnergy={telemetry.ersStoreEnergy ?? 4_000_000}
                ersDeployedThisLap={telemetry.ersDeployedThisLap ?? 0}
                ersHarvestedThisLap={telemetry.ersHarvestedThisLapMGUK ?? 0}
                boostActive={telemetry.ersDeployMode === ERSDeployMode.Overtake}
                theme={theme}
              />
              <TimingCard
                position={telemetry.carPosition ?? 3}
                currentLap={telemetry.currentLapNum ?? 12}
                totalLaps={telemetry.totalLaps ?? 56}
                currentLapTimeMS={telemetry.currentLapTimeInMS ?? 56234}
                lastLapTimeMS={telemetry.lastLapTimeInMS ?? 88456}
                bestLapTimeMS={telemetry.bestLapTimeInMS ?? 87891}
                deltaFrontMS={telemetry.deltaToCarInFrontInMS ?? -247}
                sector1TimeMS={telemetry.sector1TimeInMS ?? 28120}
                sector2TimeMS={telemetry.sector2TimeInMS ?? 29310}
                currentSector={telemetry.currentSector ?? 0}
                lapInvalid={telemetry.currentLapInvalid ?? false}
                theme={theme}
              />
            </View>

            {/* Coluna Central: ShiftLights + Aceleração + Marcha/Speed + Freio */}
            <View style={styles.centerColumn}>
              <CentralCockpit
                gear={telemetry.gear ?? 7}
                speed={telemetry.speed ?? 375}
                rpm={telemetry.engineRPM ?? 7600}
                maxRpm={telemetry.maxRPM ?? 13500}
                revPercent={telemetry.revLightsPercent ?? 75}
                throttle={telemetry.throttle ?? 1.0}
                brake={telemetry.brake ?? 0.0}
                drsActive={telemetry.drsActive ?? false}
                drsAllowed={telemetry.drsAllowed ?? false}
                theme={theme}
              />
            </View>

            {/* Coluna Direita: Painel de Temperatura e Status dos Pneus */}
            <View style={styles.rightColumn}>
              <TyreStatusGrid
                compound={telemetry.visualTyreCompound ?? 18}
                tyresAgeLaps={telemetry.tyresAgeLaps ?? 1}
                surfaceTemps={telemetry.tyresSurfaceTemperature ?? [102, 101, 98, 99]}
                pressures={telemetry.tyresPressure ?? [24.1, 24.0, 23.8, 23.9]}
                wear={telemetry.tyresWear ?? [25, 23, 18, 21]}
                theme={theme}
              />
            </View>
          </View>
        </View>

        {/* Telas Momentâneas em tela cheia (desaparecem após 5-7s e voltam ao painel normal) */}
        {activeMomentaryOverlay === 'RACE_START' && (
          <RaceStartOverlay onDismiss={handleDismissOverlay} />
        )}

        {activeMomentaryOverlay === 'CAR_DAMAGE' && (
          <CarDamageMomentaryOverlay
            onDismiss={handleDismissOverlay}
            frontLeftWing={telemetry.frontLeftWingDamage ?? 0}
            frontRightWing={telemetry.frontRightWingDamage ?? 0}
            rearWing={telemetry.rearWingDamage ?? 0}
            floor={telemetry.floorDamage ?? 0}
            diffuser={telemetry.diffuserDamage ?? 0}
            sidepod={telemetry.sidepodDamage ?? 0}
            gearBox={telemetry.gearBoxDamage ?? 0}
            engine={telemetry.engineDamage ?? 0}
          />
        )}

        {activeMomentaryOverlay === 'SAFETY_CAR' && (
          <SafetyCarMomentaryOverlay
            onDismiss={handleDismissOverlay}
            status={SafetyCarStatus.Full}
            delta={telemetry.safetyCarDelta ?? 0}
            speedLimit={80}
          />
        )}

        {activeMomentaryOverlay === 'VSC' && (
          <SafetyCarMomentaryOverlay
            onDismiss={handleDismissOverlay}
            status={SafetyCarStatus.Virtual}
            delta={telemetry.safetyCarDelta ?? -0.4}
            speedLimit={80}
          />
        )}

        {activeMomentaryOverlay === 'RED_FLAG' && (
          <RedFlagMomentaryOverlay onDismiss={handleDismissOverlay} />
        )}

        {activeMomentaryOverlay === 'PIT_LANE' && (
          <PitLaneMomentaryOverlay
            onDismiss={handleDismissOverlay}
            speedLimit={telemetry.pitSpeedLimit ?? 80}
            currentSpeed={telemetry.speed ?? 78}
            timeInLaneMS={telemetry.pitLaneTimeInLaneInMS ?? 0}
          />
        )}

        {activeMomentaryOverlay === 'CHEQUERED_FLAG' && (
          <ChequeredFlagOverlay
            onDismiss={handleDismissOverlay}
            position={telemetry.carPosition ?? 1}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#090a0f'
  },
  container: {
    flex: 1
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 4,
    minHeight: 42,
  },
  headerLeftSpacer: {
    width: 140,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightGroup: {
    width: 140,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 6,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0d18',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2b3149',
    gap: 4,
  },
  pillBtnIcon: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '900',
  },
  pillBtnText: {
    color: '#cbd5e1',
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  scenarioBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c0f1a',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginVertical: 2,
    gap: 6,
  },
  scenarioLabel: {
    color: '#38bdf8',
    fontSize: 8.5,
    fontWeight: '900',
  },
  scenarioScroll: {
    gap: 5,
  },
  scenarioBtn: {
    backgroundColor: '#181e2e',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  scenarioBtnText: {
    color: '#e2e8f0',
    fontSize: 8.5,
    fontWeight: '700',
  },
  dashboardBody: {
    flex: 1,
    justifyContent: 'center',
    marginTop: 2,
  },
  columnsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  leftColumn: {
    width: 220,
    gap: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  rightColumn: {
    width: 230,
    alignItems: 'center',
    justifyContent: 'center',
  },
});