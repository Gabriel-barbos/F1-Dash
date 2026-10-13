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
import {
  CockpitTelemetryState,
  INITIAL_COCKPIT_TELEMETRY_STATE,
  SafetyCarStatus,
  PitStatus,
  ERSDeployMode
} from '@f1-dash/telemetry-core';
import { telemetryService, ConnectionMode, MomentaryEventType, MockScenario } from '../services/telemetry-service';

import {
  useCockpitTheme,
  BatteryErsCard,
  TimingCard,
  CentralCockpit,
  CarHeatmapCard,
  TyreStatusGrid,
  CarDamageMap,
  SessionFooter,
  CockpitAtmosphere,
  ModeTransitionBar,
} from '../cockpit';

import { RaceStartOverlay } from '../components/momentary/RaceStartOverlay';
import { CarDamageMomentaryOverlay } from '../components/momentary/CarDamageMomentaryOverlay';
import { SafetyCarMomentaryOverlay } from '../components/momentary/SafetyCarMomentaryOverlay';
import { RedFlagMomentaryOverlay } from '../components/momentary/RedFlagMomentaryOverlay';
import { PitLaneMomentaryOverlay } from '../components/momentary/PitLaneMomentaryOverlay';
import { ChequeredFlagOverlay } from '../components/momentary/ChequeredFlagOverlay';
import { TeamRadioBanner } from '../components/momentary/TeamRadioBanner';
import { Radio } from 'lucide-react-native';
import { F1Font } from '../theme/typography';
import { claudinhoMobileService } from '../services/claudinho-mobile-service';
import { raceEngineerDetector } from '../services/race-engineer-detector';

interface CockpitScreenProps {
  onNavigateToMenu?: () => void;
  initialMomentaryOverlay?: MomentaryEventType | null;
}

export const CockpitScreen: React.FC<CockpitScreenProps> = ({
  onNavigateToMenu,
  initialMomentaryOverlay = null
}) => {
  const insets = useSafeAreaInsets();
  const [telemetry, setTelemetry] = useState<CockpitTelemetryState>(INITIAL_COCKPIT_TELEMETRY_STATE);
  const [connMode, setConnMode] = useState<ConnectionMode>(telemetryService.getMode());
  const [currentScenario, setCurrentScenario] = useState<MockScenario>(telemetryService.getCurrentScenario());
  const [activeMomentaryOverlay, setActiveMomentaryOverlay] = useState<MomentaryEventType | null>(
    initialMomentaryOverlay
  );
  const [isRadioTransmitting, setIsRadioTransmitting] = useState<boolean>(false);
  const [radioPhase, setRadioPhase] = useState<'connecting' | 'live'>('connecting');
  const [radioVoice, setRadioVoice] = useState<{ envelope: number[]; startedAt: number } | null>(null);
  const isRadioTransmittingRef = useRef<boolean>(false);

  // Tema visual ativo — recalculado apenas quando campos de estado mudam, não a cada frame
  const theme = useCockpitTheme(telemetry);

  // Track previous states to trigger momentary alerts only on state changes
  const prevSafetyCar = useRef<SafetyCarStatus>(SafetyCarStatus.None);
  const prevRedFlag = useRef<boolean>(false);

  const handleTriggerClaudinhoRadio = (scenarioOverride?: string) => {
    if (isRadioTransmittingRef.current) return;
    isRadioTransmittingRef.current = true;

    const validScenario = typeof scenarioOverride === 'string' ? scenarioOverride : undefined;
    const scenario = validScenario || (currentScenario === 'NORMAL' ? 'OVERTAKE' : currentScenario);

    claudinhoMobileService.triggerRadio(
      scenario,
      'Gabriel',
      {
        onStart: () => {
          setIsRadioTransmitting(true);
          setRadioPhase('connecting');
          setRadioVoice(null);
        },
        onVoiceStart: ({ envelope, startedAt }) => {
          setRadioPhase('live');
          setRadioVoice({ envelope, startedAt });
        },
        onEnd: () => {
          setTimeout(() => {
            isRadioTransmittingRef.current = false;
            setIsRadioTransmitting(false);
            setRadioVoice(null);
            setRadioPhase('connecting');
          }, 350);
        }
      }
    ).catch(() => {
      isRadioTransmittingRef.current = false;
      setIsRadioTransmitting(false);
    });
  };

  const handleTriggerClaudinhoDirect = (
    scenario: string,
    text: string,
    wavBase64?: string,
    envelope?: number[],
    dspApplied?: boolean,
    durationMs?: number
  ) => {
    if (isRadioTransmittingRef.current) return;
    isRadioTransmittingRef.current = true;

    claudinhoMobileService.playDirectRadio(
      scenario,
      text,
      wavBase64,
      {
        envelope,
        dspApplied,
        durationMs
      },
      {
        onStart: () => {
          setIsRadioTransmitting(true);
          setRadioPhase('connecting');
          setRadioVoice(null);
        },
        onVoiceStart: ({ envelope, startedAt }) => {
          setRadioPhase('live');
          setRadioVoice({ envelope, startedAt });
        },
        onEnd: () => {
          setTimeout(() => {
            isRadioTransmittingRef.current = false;
            setIsRadioTransmitting(false);
            setRadioVoice(null);
            setRadioPhase('connecting');
          }, 350);
        }
      }
    ).catch(() => {
      isRadioTransmittingRef.current = false;
      setIsRadioTransmitting(false);
    });
  };

  const triggerRadioRef = useRef(handleTriggerClaudinhoRadio);
  triggerRadioRef.current = handleTriggerClaudinhoRadio;

  useEffect(() => {
    if (initialMomentaryOverlay) {
      if (initialMomentaryOverlay === 'TEAM_RADIO') {
        handleTriggerClaudinhoRadio();
      } else {
        setActiveMomentaryOverlay(initialMomentaryOverlay);
      }
    }
  }, [initialMomentaryOverlay]);

  useEffect(() => {
    // Reinicia rastreamento do detector ao montar ou trocar de modo
    raceEngineerDetector.reset();

    const unsubscribe = telemetryService.subscribe((state) => {
      setTelemetry({ ...state });

      // Detect Safety Car status transition (apenas em jogo real para não bloquear a tela no mock)
      if (
        connMode !== 'MOCK' &&
        (state.safetyCarStatus === SafetyCarStatus.Full || state.safetyCarStatus === SafetyCarStatus.Virtual) &&
        prevSafetyCar.current !== state.safetyCarStatus
      ) {
        setActiveMomentaryOverlay(
          state.safetyCarStatus === SafetyCarStatus.Virtual ? 'VSC' : 'SAFETY_CAR'
        );
      }
      prevSafetyCar.current = state.safetyCarStatus;

      // Detect Red Flag status transition
      if (connMode !== 'MOCK' && state.isRedFlagActive && !prevRedFlag.current) {
        setActiveMomentaryOverlay('RED_FLAG');
      }
      prevRedFlag.current = !!state.isRedFlagActive;
    });

    const unsubMomentary = telemetryService.subscribeMomentaryEvent((event, payload) => {
      if (event === 'TEAM_RADIO') {
        if (payload?.wavBase64) {
          handleTriggerClaudinhoDirect(
            payload.scenario || 'OVERTAKE',
            payload.text || '',
            payload.wavBase64,
            payload.envelope,
            payload.dspApplied,
            payload.durationMs
          );
        } else {
          triggerRadioRef.current(payload?.scenario);
        }
      } else {
        setActiveMomentaryOverlay(event);
      }
    });

    return () => {
      unsubscribe();
      unsubMomentary();
    };
  }, [connMode]);

  const handleSelectScenario = (scenario: MockScenario) => {
    setCurrentScenario(scenario);
    setActiveMomentaryOverlay(null);
    telemetryService.forceStateScenario(scenario);
    if (scenario !== 'NORMAL') {
      handleTriggerClaudinhoRadio(scenario);
    }
  };

  const handleConnectionPress = () => {
    if (connMode === 'UDP_NATIVE') {
      telemetryService.stopNativeUdp();
      telemetryService.startNativeUdp();
    } else if (connMode === 'WEBSOCKET') {
      telemetryService.connectWs();
    } else if (connMode === 'MOCK') {
      telemetryService.forceStateScenario(currentScenario);
    }
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
    <CockpitAtmosphere theme={theme}>
      <View
        style={[
          styles.safeArea,
          {
            backgroundColor: 'transparent', // deixa o gradiente aparecer
            paddingTop: Math.max(insets.top, 6),
            paddingBottom: Math.max(insets.bottom, 6),
            paddingLeft: Math.max(insets.left, 12),
            paddingRight: Math.max(insets.right, 12)
          }
        ]}
      >
        <StatusBar hidden />
        <View style={styles.container}>
          {/* Header Superior: Barra de transição de modo expansiva e botões flutuando */}
          <View style={styles.topHeader}>
            {onNavigateToMenu && (
              <View style={styles.headerLeftGroup}>
                <TouchableOpacity onPress={onNavigateToMenu} style={styles.pillBtn} activeOpacity={0.7}>
                  <Text style={styles.pillBtnIcon}>≡</Text>
                  <Text style={styles.pillBtnText}>MENU</Text>
                </TouchableOpacity>
              </View>
            )}

            <ModeTransitionBar theme={theme} />

            <View style={styles.headerRightGroup}>
              <TouchableOpacity
                onPress={handleConnectionPress}
                style={[
                  styles.pillBtn,
                  {
                    borderColor: !telemetry.connected
                      ? telemetryService.isWsConnected()
                        ? '#b45309'
                        : '#991b1b'
                      : (telemetry.packetsPerSecond ?? 0) > 0
                      ? '#15803d'
                      : '#b45309'
                  }
                ]}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.statusDot,
                    {
                      backgroundColor: !telemetry.connected
                        ? telemetryService.isWsConnected()
                          ? '#f59e0b'
                          : '#ef4444'
                        : (telemetry.packetsPerSecond ?? 0) > 0
                        ? '#22c55e'
                        : '#f59e0b'
                    }
                  ]}
                />
                <Text style={styles.pillBtnText}>
                  {!telemetry.connected
                    ? telemetryService.isWsConnected()
                      ? 'AGUARDANDO F1'
                      : 'RECONECTAR'
                    : (telemetry.packetsPerSecond ?? 0) > 0
                    ? `ONLINE • ${telemetry.packetsPerSecond} HZ`
                    : 'AGUARDANDO'}
                </Text>
              </TouchableOpacity>

              {/* Botão de Rádio Claudinho Ronaldo */}
              <TouchableOpacity
                style={[
                  styles.pillBtn,
                  {
                    backgroundColor: isRadioTransmitting ? '#381a12' : '#1c1310',
                    borderColor: '#E05A36',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5
                  }
                ]}
                onPress={() => handleTriggerClaudinhoRadio()}
                activeOpacity={0.7}
              >
                <Radio size={12} color="#FF7043" />
                <Text
                  style={[
                    styles.pillBtnText,
                    { color: '#FF7043', fontFamily: F1Font.bold, fontWeight: '700' }
                  ]}
                >
                  {isRadioTransmitting ? 'TRANSMITINDO' : 'CLAUDINHO'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

        {/* Mock Scenario Quick Bar */}
        {connMode === 'MOCK' && (
          <View style={styles.scenarioBar}>
            <Text style={styles.scenarioLabel}>TESTE MOCK:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scenarioScroll}>
              {[
                { id: 'NORMAL', label: 'Normal' },
                { id: 'START', label: 'Largada' },
                { id: 'DRS', label: 'DRS / Reta' },
                { id: 'OVERTAKE', label: 'Overtake' },
                { id: 'SAFETY_CAR', label: 'Safety Car' },
                { id: 'VSC', label: 'VSC' },
                { id: 'RED_FLAG', label: 'Red Flag' },
                { id: 'PIT_LANE', label: 'Boxes' },
                { id: 'FASTEST_LAP', label: 'Volta Rápida' },
                { id: 'WET', label: 'Chuva' },
                { id: 'DAMAGE', label: 'Dano' },
              ].map((sc) => {
                const isActive = currentScenario === sc.id;
                return (
                  <TouchableOpacity
                    key={sc.id}
                    onPress={() => handleSelectScenario(sc.id as MockScenario)}
                    style={[
                      styles.scenarioBtn,
                      isActive && {
                        backgroundColor: '#1e3a5f',
                        borderColor: '#38bdf8',
                        borderWidth: 1.2,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.scenarioBtnText,
                        isActive && { color: '#38bdf8', fontWeight: '900' },
                      ]}
                    >
                      {sc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Dashboard Principal (3 Colunas perfeitamente alinhadas) */}
        <View style={styles.dashboardBody}>
          <View style={styles.columnsContainer}>
            {/* Coluna Esquerda: Bateria no Topo + Posição e Tempos embaixo */}
            <View style={styles.leftColumn}>
              <BatteryErsCard
                batteryPercent={telemetry.ersPercentage ?? 0}
                ersStoreEnergy={telemetry.ersStoreEnergy ?? 0}
                ersDeployedThisLap={telemetry.ersDeployedThisLap ?? 0}
                ersHarvestedThisLap={telemetry.ersHarvestedThisLapMGUK ?? 0}
                boostActive={telemetry.ersDeployMode === ERSDeployMode.Overtake}
                theme={theme}
              />
              <TimingCard
                position={telemetry.carPosition ?? 0}
                currentLap={telemetry.currentLapNum ?? 0}
                totalLaps={telemetry.totalLaps ?? 0}
                currentLapTimeMS={telemetry.currentLapTimeInMS ?? 0}
                lastLapTimeMS={telemetry.lastLapTimeInMS ?? 0}
                bestLapTimeMS={telemetry.bestLapTimeInMS ?? 0}
                deltaFrontMS={telemetry.deltaToCarInFrontInMS ?? 0}
                sector1TimeMS={telemetry.sector1TimeInMS ?? 0}
                sector2TimeMS={telemetry.sector2TimeInMS ?? 0}
                currentSector={telemetry.currentSector ?? 0}
                lapInvalid={telemetry.currentLapInvalid ?? false}
                theme={theme}
              />
            </View>

            {/* Coluna Central: ShiftLights + Aceleração + Marcha/Speed + Freio */}
            <View style={styles.centerColumn}>
              <CentralCockpit
                gear={telemetry.gear ?? 0}
                speed={telemetry.speed ?? 0}
                rpm={telemetry.engineRPM ?? 0}
                maxRpm={telemetry.maxRPM || 13500}
                revPercent={telemetry.revLightsPercent ?? 0}
                throttle={telemetry.throttle ?? 0.0}
                brake={telemetry.brake ?? 0.0}
                drsActive={telemetry.drsActive ?? false}
                drsAllowed={telemetry.drsAllowed ?? false}
                is2026Regulations={telemetry.is2026Regulations ?? false}
                activeAeroMode={telemetry.activeAeroMode ?? 0}
                activeAeroAvailable={telemetry.activeAeroAvailable ?? false}
                activeAeroActivationDistance={telemetry.activeAeroActivationDistance ?? 0}
                overtakeActive={telemetry.overtakeActive ?? false}
                overtakeAvailable={telemetry.overtakeAvailable ?? false}
                overtakeActivationDistance={telemetry.overtakeActivationDistance ?? 0}
                ersDeployMode={telemetry.ersDeployMode}
                weather={telemetry.weather}
                airTemperature={telemetry.airTemperature}
                trackTemperature={telemetry.trackTemperature}
                theme={theme}
              />
            </View>

            {/* Coluna Direita: Mapa Visual de Danos e Telemetria dos Pneus */}
            <View style={styles.rightColumn}>
              <CarDamageMap
                frontLeftWingDamage={telemetry.frontLeftWingDamage ?? 0}
                frontRightWingDamage={telemetry.frontRightWingDamage ?? 0}
                rearWingDamage={telemetry.rearWingDamage ?? 0}
                floorDamage={telemetry.floorDamage ?? 0}
                diffuserDamage={telemetry.diffuserDamage ?? 0}
                sidepodDamage={telemetry.sidepodDamage ?? 0}
                gearBoxDamage={telemetry.gearBoxDamage ?? 0}
                engineDamage={telemetry.engineDamage ?? 0}
                tyresWear={telemetry.tyresWear ?? [0, 0, 0, 0]}
                tyresSurfaceTemp={telemetry.tyresSurfaceTemperature ?? [0, 0, 0, 0]}
                tyresPressure={telemetry.tyresPressure ?? [0, 0, 0, 0]}
                brakesTemperature={telemetry.brakesTemperature ?? [0, 0, 0, 0]}
                compound={telemetry.visualTyreCompound ?? 16}
                tyresAgeLaps={telemetry.tyresAgeLaps ?? 0}
                drsFault={telemetry.drsFault}
                engineBlown={telemetry.engineBlown}
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
            currentSpeed={telemetry.speed ?? 0}
            timeInLaneMS={telemetry.pitLaneTimeInLaneInMS ?? 0}
          />
        )}

        {activeMomentaryOverlay === 'CHEQUERED_FLAG' && (
          <ChequeredFlagOverlay
            onDismiss={handleDismissOverlay}
            position={telemetry.carPosition ?? 0}
          />
        )}
      </View>

      {/* Faixa inferior de rádio F1 Broadcast — sobreposta na parte inferior sem cobrir o cockpit */}
      <TeamRadioBanner
        visible={isRadioTransmitting}
        phase={radioPhase}
        envelope={radioVoice?.envelope}
        voiceStartedAt={radioVoice?.startedAt}
        engineerName="CLAUDINHO RONALDO"
        driverName="GABRIEL"
      />
    </View>
  </CockpitAtmosphere>
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
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 2,
    minHeight: 52,
  },
  headerLeftGroup: {
    position: 'absolute',
    left: 8,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 10,
  },
  headerRightGroup: {
    position: 'absolute',
    right: 8,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
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
    width: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
});