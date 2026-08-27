import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CockpitTelemetryState, INITIAL_TELEMETRY_STATE } from '../core/state/telemetry-state';
import { telemetryService, ConnectionMode, MomentaryEventType } from '../services/telemetry-service';
import { SafetyCarStatus } from '../core/models/session';
import { PitStatus } from '../core/models/lap-data';

import { RevLights } from '../components/RevLights';
import { ModernRpmArc } from '../components/ModernRpmArc';
import { GearDisplay } from '../components/GearDisplay';
import { ThrottleBrakeBars } from '../components/ThrottleBrakeBars';
import { ErsWidget } from '../components/ErsWidget';
import { TyreWidget } from '../components/TyreWidget';
import { TimingWidget } from '../components/TimingWidget';

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
  const [uiMode, setUiMode] = useState<'REALISTIC' | 'MODERN'>('REALISTIC');
  const [connMode, setConnMode] = useState<ConnectionMode>(telemetryService.getMode());
  const [activeMomentaryOverlay, setActiveMomentaryOverlay] = useState<MomentaryEventType | null>(
    initialMomentaryOverlay
  );

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
    <View
      style={[
        styles.safeArea,
        {
          paddingTop: Math.max(insets.top, 6),
          paddingBottom: Math.max(insets.bottom, 6),
          paddingLeft: Math.max(insets.left, 12),
          paddingRight: Math.max(insets.right, 12)
        }
      ]}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        {/* Top Control Bar */}
        <View style={styles.topBar}>
          <View style={styles.statusGroup}>
            {onNavigateToMenu && (
              <TouchableOpacity
                onPress={onNavigateToMenu}
                style={styles.menuBtn}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Text style={styles.menuBtnIcon}>☵</Text>
                <Text style={styles.menuBtnText}>MENU</Text>
              </TouchableOpacity>
            )}

            <View
              style={[
                styles.statusDot,
                { backgroundColor: telemetry.connected ? '#22c55e' : '#ef4444' }
              ]}
            />
            <Text style={styles.statusText} numberOfLines={1}>
              {telemetry.connected
                ? connMode === 'MOCK'
                  ? 'SIMULADOR 60 FPS'
                  : connMode === 'UDP_NATIVE'
                  ? `UDP 20777 (F1 ${telemetry.gameYear ?? 2025})`
                  : `WEBSOCKET (F1 ${telemetry.gameYear ?? 2025})`
                : connMode === 'UDP_NATIVE'
                ? 'UDP 20777 (AGUARDANDO PS5)...'
                : 'AGUARDANDO CONEXÃO...'}
            </Text>
          </View>

          <View style={styles.actionsGroup}>
            <TouchableOpacity
              onPress={cycleConnectionMode}
              style={styles.connToggleBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.connToggleText}>
                FONTE: {connMode === 'UDP_NATIVE' ? 'PS5 / UDP' : connMode === 'WEBSOCKET' ? 'WS PC' : 'MOCK'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setUiMode(uiMode === 'REALISTIC' ? 'MODERN' : 'REALISTIC')}
              style={styles.modeToggleBtn}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.modeToggleText}>
                {uiMode === 'REALISTIC' ? 'MODO REALISTA' : 'MODO MODERNO'}
              </Text>
            </TouchableOpacity>

            {/* Car Damage Trigger - Shows Momentary Overlay without freezing */}
            <TouchableOpacity
              onPress={() => setActiveMomentaryOverlay('CAR_DAMAGE')}
              style={[styles.damageBtn, hasCriticalDamage && styles.damageBtnAlert]}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            >
              <Text style={styles.damageBtnText}>
                {hasCriticalDamage ? '⚠️ DAMAGE' : 'CAR DAMAGE'}
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
                <Text style={styles.scenarioBtnText}>DRS Ativo</Text>
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
                <Text style={styles.scenarioBtnText}>Pit Lane</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  telemetryService.forceStateScenario('DAMAGE');
                  setActiveMomentaryOverlay('CAR_DAMAGE');
                }}
                style={styles.scenarioBtn}
              >
                <Text style={styles.scenarioBtnText}>Dano</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveMomentaryOverlay('CHEQUERED_FLAG')} style={styles.scenarioBtn}>
                <Text style={styles.scenarioBtnText}>Final</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}

        {/* Dashboard Body - Sempre exibe o painel de corrida normal */}
        <View style={styles.dashboardBody}>
          {/* Faixas situacionais compactas no topo quando houver SC, Red Flag ou Box ativo (não cobrem o painel!) */}
          {isRedFlag ? (
            <TouchableOpacity
              onPress={() => setActiveMomentaryOverlay('RED_FLAG')}
              style={styles.situationalStripRed}
              activeOpacity={0.8}
            >
              <Text style={styles.situationalStripText}>🚩 BANDEIRA VERMELHA • SESSÃO PARALISADA • TOQUE PARA VER</Text>
            </TouchableOpacity>
          ) : isSafetyCar ? (
            <TouchableOpacity
              onPress={() =>
                setActiveMomentaryOverlay(
                  telemetry.safetyCarStatus === SafetyCarStatus.Virtual ? 'VSC' : 'SAFETY_CAR'
                )
              }
              style={styles.situationalStripYellow}
              activeOpacity={0.8}
            >
              <Text style={styles.situationalStripText}>
                {telemetry.safetyCarStatus === SafetyCarStatus.Virtual
                  ? `⚡ VSC ATIVO • DELTA: ${(telemetry.safetyCarDelta ?? 0) >= 0 ? `+${(telemetry.safetyCarDelta ?? 0).toFixed(2)}` : (telemetry.safetyCarDelta ?? 0).toFixed(2)}s • TOQUE PARA VER`
                  : `🟡 SAFETY CAR • DELTA: ${(telemetry.safetyCarDelta ?? 0) >= 0 ? `+${(telemetry.safetyCarDelta ?? 0).toFixed(2)}` : (telemetry.safetyCarDelta ?? 0).toFixed(2)}s • TOQUE PARA VER`}
              </Text>
            </TouchableOpacity>
          ) : isPitLane ? (
            <TouchableOpacity
              onPress={() => setActiveMomentaryOverlay('PIT_LANE')}
              style={styles.situationalStripBlue}
              activeOpacity={0.8}
            >
              <Text style={styles.situationalStripText}>
                🛑 PIT LIMITER ATIVO • {telemetry.pitSpeedLimit ?? 80} KM/H • TOQUE PARA VER
              </Text>
            </TouchableOpacity>
          ) : null}

          {/* PAINEL NORMAL DE CORRIDA: SEMPRE PRESENTE! */}
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#171924'
  },
  menuBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38bdf8',
    gap: 4
  },
  menuBtnIcon: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '900'
  },
  menuBtnText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  statusGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5
  },
  statusText: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
    flexShrink: 1
  },
  actionsGroup: {
    flexDirection: 'row',
    gap: 6
  },
  connToggleBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 5,
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
    paddingVertical: 5,
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
    paddingVertical: 5,
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
    gap: 6
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
    justifyContent: 'space-between',
    marginTop: 4
  },
  situationalStripRed: {
    backgroundColor: '#7f1d1d',
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 4
  },
  situationalStripYellow: {
    backgroundColor: '#713f12',
    borderWidth: 1,
    borderColor: '#eab308',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 4
  },
  situationalStripBlue: {
    backgroundColor: '#1e3a8a',
    borderWidth: 1,
    borderColor: '#3b82f6',
    borderRadius: 6,
    paddingVertical: 3,
    paddingHorizontal: 10,
    alignItems: 'center',
    marginBottom: 4
  },
  situationalStripText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5
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