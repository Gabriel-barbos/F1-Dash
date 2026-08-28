import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  TextInput
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import { telemetryService, ConnectionMode, MomentaryEventType } from '../services/telemetry-service';
import { CockpitTelemetryState, INITIAL_TELEMETRY_STATE } from '../core/state/telemetry-state';

interface MenuScreenProps {
  onLaunchCockpit: (overlay?: MomentaryEventType) => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onLaunchCockpit }) => {
  const insets = useSafeAreaInsets();
  const [telemetry, setTelemetry] = useState<CockpitTelemetryState>(
    telemetryService.isMockActive() ? ({} as any) : INITIAL_TELEMETRY_STATE
  );
  const [connMode, setConnMode] = useState<ConnectionMode>(telemetryService.getMode());
  const [hostInput, setHostInput] = useState<string>(telemetryService.getServerHost());
  const [deviceIp, setDeviceIp] = useState<string>('Obtendo IP...');

  const deviceName = telemetryService.getDeviceName();
  const isExpo = telemetryService.isExpoGo();

  useEffect(() => {
    Network.getIpAddressAsync()
      .then((ip) => setDeviceIp(ip || 'Verifique no Wi-Fi'))
      .catch(() => setDeviceIp('Verifique no Wi-Fi'));
  }, []);

  const handleSaveHost = () => {
    telemetryService.setServerHost(hostInput);
  };

  useEffect(() => {
    const unsub = telemetryService.subscribe((state) => {
      setTelemetry({ ...state });
    });
    return unsub;
  }, []);

  const handleSelectMode = (mode: ConnectionMode) => {
    setConnMode(mode);
    telemetryService.setMode(mode);
  };

  const handleTestScreen = (type: MomentaryEventType) => {
    // Leva diretamente para o cockpit com essa tela momentânea ativada,
    // a qual é exibida por alguns segundos e retorna para o painel de corrida normal!
    if (type === 'SAFETY_CAR') {
      telemetryService.forceStateScenario('SAFETY_CAR');
    } else if (type === 'VSC') {
      telemetryService.forceStateScenario('VSC');
    } else if (type === 'RED_FLAG') {
      telemetryService.forceStateScenario('RED_FLAG');
    } else if (type === 'PIT_LANE') {
      telemetryService.forceStateScenario('PIT_LANE');
    } else if (type === 'CAR_DAMAGE') {
      telemetryService.forceStateScenario('DAMAGE');
    }
    onLaunchCockpit(type);
  };

  const isConnected = telemetry.connected;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 12),
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16)
        }
      ]}
    >
      {/* Header com Status da Conexão e Dispositivo */}
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <View style={styles.titleBadgeRow}>
            <Text style={styles.titleBadge}>F1 TELEMETRY HUB</Text>
            <View style={[styles.envBadge, isExpo ? styles.envBadgeExpo : styles.envBadgeApk]}>
              <Text style={[styles.envBadgeText, isExpo ? styles.envTextExpo : styles.envTextApk]}>
                {isExpo ? '📱 EXPO GO' : '🚀 APK STANDALONE'}
              </Text>
            </View>
          </View>
          <Text style={styles.mainTitle}>COCKPIT CONTROL CENTER</Text>
        </View>

        <View style={styles.deviceCard}>
          <View style={styles.deviceRow}>
            <Text style={styles.deviceLabel}>DISPOSITIVO:</Text>
            <View style={styles.deviceBadge}>
              <Text style={styles.deviceIcon}>🎮</Text>
              <Text style={styles.deviceName}>{deviceName}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isConnected ? '#22c55e' : '#ef4444' }
              ]}
            />
            <Text style={styles.statusLabel}>STATUS:</Text>
            <Text style={[styles.statusValue, { color: isConnected ? '#22c55e' : '#f87171' }]}>
              {isConnected
                ? connMode === 'MOCK'
                  ? 'SIMULADOR ATIVO (60 FPS)'
                  : (telemetry.packetsPerSecond > 0 || (telemetry.speed > 0 || telemetry.engineRPM > 0))
                  ? `TRANSMITINDO (${telemetry.packetsPerSecond || 60} HZ) • F1 ${telemetry.gameYear ?? 2025}`
                  : 'SERVIDOR CONECTADO (AGUARDANDO O JOGO NO PS5...)'
                : 'AGUARDANDO CONEXÃO COM O SERVIDOR...'}
            </Text>
          </View>
        </View>
      </View>

      {/* Main Content Area: 2 Columns */}
      <View style={styles.mainLayout}>
        {/* Left Column: Data Source Selector & Launch Button */}
        <View style={styles.leftCol}>
          <Text style={styles.sectionHeading}>SELECIONE A FONTE DE DADOS</Text>

          <View style={styles.sourcesContainer}>
            {/* Option 1: PS5 (UDP Direto) */}
            <TouchableOpacity
              onPress={() => handleSelectMode('UDP_NATIVE')}
              style={[
                styles.sourceCard,
                connMode === 'UDP_NATIVE' && styles.sourceCardSelected
              ]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.sourceHeader}>
                <Text style={styles.sourceIcon}>🎮</Text>
                <Text style={styles.sourceTitle}>PS5 (PLAYSTATION 5)</Text>
              </View>
              <Text style={styles.sourceDesc}>
                {isExpo
                  ? 'Recepção direta no APK (No Expo Go, use MOCK ou PC)'
                  : 'Recepção direta UDP 20777 do F1 no console'}
              </Text>
              <View style={styles.sourceRadio}>
                <View
                  style={[
                    styles.radioDot,
                    connMode === 'UDP_NATIVE' && styles.radioDotSelected
                  ]}
                />
                <Text style={styles.radioText}>
                  {connMode === 'UDP_NATIVE' ? 'SELECIONADO' : 'USAR PS5'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Option 2: MOCK (Simulador) */}
            <TouchableOpacity
              onPress={() => handleSelectMode('MOCK')}
              style={[
                styles.sourceCard,
                connMode === 'MOCK' && styles.sourceCardSelected
              ]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.sourceHeader}>
                <Text style={styles.sourceIcon}>🧪</Text>
                <Text style={styles.sourceTitle}>MOCK (SIMULADOR)</Text>
              </View>
              <Text style={styles.sourceDesc}>
                Simulador interno realista a 60 FPS com telemetria ativa
              </Text>
              <View style={styles.sourceRadio}>
                <View
                  style={[
                    styles.radioDot,
                    connMode === 'MOCK' && styles.radioDotSelected
                  ]}
                />
                <Text style={styles.radioText}>
                  {connMode === 'MOCK' ? 'SELECIONADO' : 'USAR MOCK'}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Option 3: WEB SERVER (WebSocket) */}
            <TouchableOpacity
              onPress={() => handleSelectMode('WEBSOCKET')}
              style={[
                styles.sourceCard,
                connMode === 'WEBSOCKET' && styles.sourceCardSelected
              ]}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={styles.sourceHeader}>
                <Text style={styles.sourceIcon}>🌐</Text>
                <Text style={styles.sourceTitle}>WEB SERVER (WS PC)</Text>
              </View>
              <Text style={styles.sourceDesc}>
                Conexão WebSocket com servidor PC local
              </Text>
              <View style={styles.sourceRadio}>
                <View
                  style={[
                    styles.radioDot,
                    connMode === 'WEBSOCKET' && styles.radioDotSelected
                  ]}
                />
                <Text style={styles.radioText}>
                  {connMode === 'WEBSOCKET' ? 'SELECIONADO' : 'USAR SERVIDOR'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Configuração de IP do Servidor PC / Bridge */}
          <View style={styles.serverHostCard}>
            <Text style={styles.serverHostLabel}>IP DO SERVIDOR / PC:</Text>
            <View style={styles.serverHostInputRow}>
              <TextInput
                value={hostInput}
                onChangeText={setHostInput}
                placeholder="192.168.1.107:5173"
                placeholderTextColor="#64748b"
                style={styles.serverHostInput}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity onPress={handleSaveHost} style={styles.serverHostSaveBtn}>
                <Text style={styles.serverHostSaveText}>CONECTAR</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Launch Display Button */}
          <TouchableOpacity
            onPress={() => {
              telemetryService.forceStateScenario('NORMAL');
              onLaunchCockpit();
            }}
            style={styles.launchBtn}
            activeOpacity={0.8}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.launchBtnText}>▶ INICIAR COCKPIT DISPLAY</Text>
            <Text style={styles.launchBtnSubtext}>PAINEL PRINCIPAL DE TELEMETRIA</Text>
          </TouchableOpacity>
        </View>

        {/* Right Column: Individual Screen Tests */}
        <View style={styles.rightCol}>
          <View style={styles.testHeaderRow}>
            <Text style={styles.sectionHeading}>TESTE DE TELAS MOMENTÂNEAS</Text>
            <Text style={styles.testSubtitle}>Toque para testar cada tela</Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.testGrid}
          >
            <TouchableOpacity
              onPress={() => handleTestScreen('RACE_START')}
              style={[styles.testCard, styles.testCardStart]}
              activeOpacity={0.7}
            >
              <Text style={styles.testCardIcon}>🚦</Text>
              <View style={styles.testCardContent}>
                <Text style={styles.testCardTitle}>TELA DA LARGADA</Text>
                <Text style={styles.testCardDesc}>5 luzes vermelhas & sinal verde</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTestScreen('CAR_DAMAGE')}
              style={[styles.testCard, styles.testCardDamage]}
              activeOpacity={0.7}
            >
              <Text style={styles.testCardIcon}>🏎️</Text>
              <View style={styles.testCardContent}>
                <Text style={styles.testCardTitle}>CAR DAMAGE & HEATMAP</Text>
                <Text style={styles.testCardDesc}>Diagnóstico de asa, assoalho e motor</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTestScreen('SAFETY_CAR')}
              style={[styles.testCard, styles.testCardSC]}
              activeOpacity={0.7}
            >
              <Text style={styles.testCardIcon}>🟡</Text>
              <View style={styles.testCardContent}>
                <Text style={styles.testCardTitle}>SAFETY CAR (SC)</Text>
                <Text style={styles.testCardDesc}>Alerta com delta e velocidade</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTestScreen('VSC')}
              style={[styles.testCard, styles.testCardVSC]}
              activeOpacity={0.7}
            >
              <Text style={styles.testCardIcon}>⚡</Text>
              <View style={styles.testCardContent}>
                <Text style={styles.testCardTitle}>VIRTUAL SAFETY CAR</Text>
                <Text style={styles.testCardDesc}>VSC delta pacing limiter</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTestScreen('RED_FLAG')}
              style={[styles.testCard, styles.testCardRedFlag]}
              activeOpacity={0.7}
            >
              <Text style={styles.testCardIcon}>🚩</Text>
              <View style={styles.testCardContent}>
                <Text style={styles.testCardTitle}>RED FLAG (BANDEIRA VERMELHA)</Text>
                <Text style={styles.testCardDesc}>Paralisação e retorno aos boxes</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTestScreen('PIT_LANE')}
              style={[styles.testCard, styles.testCardPit]}
              activeOpacity={0.7}
            >
              <Text style={styles.testCardIcon}>🛑</Text>
              <View style={styles.testCardContent}>
                <Text style={styles.testCardTitle}>PIT LANE & LIMITER</Text>
                <Text style={styles.testCardDesc}>Velocidade do pit limiter ativa</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleTestScreen('CHEQUERED_FLAG')}
              style={[styles.testCard, styles.testCardFinish]}
              activeOpacity={0.7}
            >
              <Text style={styles.testCardIcon}>🏁</Text>
              <View style={styles.testCardContent}>
                <Text style={styles.testCardTitle}>BANDEIRA QUADRICULADA</Text>
                <Text style={styles.testCardDesc}>Celebração de final de prova</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>

          {/* Guia Rápido: PS5 Direto no App / MOCK no Expo Go */}
          <View style={styles.ps5GuideBox}>
            <View style={styles.guideHeaderRow}>
              <Text style={styles.ps5GuideTitle}>
                {isExpo ? '🎮 MOCK ATIVO NO EXPO GO' : '🎮 PS5 DIRETO NO CELULAR (SEM PC!)'}
              </Text>
              <View style={[styles.standaloneBadge, isExpo && styles.standaloneBadgeExpo]}>
                <Text style={[styles.standaloneBadgeText, isExpo && styles.standaloneBadgeTextExpo]}>
                  {isExpo ? 'SIMULADOR 60 FPS' : '100% INDEPENDENTE'}
                </Text>
              </View>
            </View>
            {isExpo ? (
              <>
                <Text style={styles.ps5GuideItem}>
                  • O <Text style={styles.guideGreen}>MOCK interno a 60 FPS</Text> está ativo para testar o cockpit, marchas, RPM e telas momentâneas!
                </Text>
                <Text style={styles.ps5GuideItem}>
                  • Para ligar direto no PS5 sem PC, gere o APK com <Text style={styles.guideHighlight}>eas build -p android --profile preview</Text>.
                </Text>
                <Text style={styles.ps5GuideItem}>
                  • Ou pelo Expo Go via PC bridge, configure o IP: <Text style={styles.guideHighlight}>{hostInput}</Text>.
                </Text>
              </>
            ) : (
              <>
                <Text style={styles.ps5GuideItem}>
                  1. Conecte o celular e o PS5 no <Text style={styles.guideHighlight}>mesmo Wi-Fi</Text>.
                </Text>
                <Text style={styles.ps5GuideItem}>
                  2. No F1 do PS5: <Text style={styles.guideHighlight}>Opções &gt; Configurações de Telemetria</Text>.
                </Text>
                <Text style={styles.ps5GuideItem}>
                  3. Telemetria UDP: <Text style={styles.guideGreen}>LIGADO</Text> | Porta: <Text style={styles.guideHighlight}>20777</Text> | Taxa: <Text style={styles.guideHighlight}>60 Hz</Text>.
                </Text>
                <Text style={styles.ps5GuideItem}>
                  4. Modo de Difusão (Broadcast): <Text style={styles.guideGreen}>LIGADO</Text> (Recomendado) ou IP deste celular: <Text style={styles.guideHighlight}>{deviceIp}</Text>.
                </Text>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07090e',
    justifyContent: 'space-between'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#171d2b'
  },
  titleContainer: {
    gap: 2
  },
  titleBadge: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2
  },
  mainTitle: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1
  },
  deviceCard: {
    backgroundColor: '#0f1422',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  deviceLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800'
  },
  deviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4
  },
  deviceIcon: {
    fontSize: 12
  },
  deviceName: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3
  },
  statusLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800'
  },
  statusValue: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
    gap: 16,
    marginTop: 10
  },
  leftCol: {
    flex: 1,
    justifyContent: 'space-between'
  },
  sectionHeading: {
    color: '#cbd5e1',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 6
  },
  sourcesContainer: {
    gap: 8,
    flex: 1
  },
  sourceCard: {
    backgroundColor: '#0e121d',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#1e2638',
    padding: 10,
    justifyContent: 'space-between'
  },
  sourceCardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#0c1a2e'
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2
  },
  sourceIcon: {
    fontSize: 14
  },
  sourceTitle: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  sourceDesc: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '500',
    marginBottom: 6
  },
  sourceRadio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#334155'
  },
  radioDotSelected: {
    backgroundColor: '#38bdf8'
  },
  radioText: {
    color: '#e2e8f0',
    fontSize: 9,
    fontWeight: '800'
  },
  launchBtn: {
    backgroundColor: '#16a34a',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4ade80',
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
    marginTop: 6
  },
  launchBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 1.5
  },
  launchBtnSubtext: {
    color: '#dcfce7',
    fontSize: 8,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2
  },
  rightCol: {
    flex: 1.1,
    backgroundColor: '#0a0d15',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#171d2b',
    padding: 10
  },
  testHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#171d2b',
    paddingBottom: 6,
    marginBottom: 6
  },
  testSubtitle: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '600'
  },
  testGrid: {
    gap: 6,
    paddingBottom: 10
  },
  testCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f1422',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1f293d',
    gap: 10
  },
  testCardIcon: {
    fontSize: 16
  },
  testCardContent: {
    flex: 1
  },
  testCardTitle: {
    color: '#f1f5f9',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  testCardDesc: {
    color: '#64748b',
    fontSize: 8,
    fontWeight: '600'
  },
  testCardStart: {
    borderLeftWidth: 3,
    borderLeftColor: '#ef4444'
  },
  testCardDamage: {
    borderLeftWidth: 3,
    borderLeftColor: '#f97316'
  },
  testCardSC: {
    borderLeftWidth: 3,
    borderLeftColor: '#eab308'
  },
  testCardVSC: {
    borderLeftWidth: 3,
    borderLeftColor: '#facc15'
  },
  testCardRedFlag: {
    borderLeftWidth: 3,
    borderLeftColor: '#dc2626'
  },
  testCardPit: {
    borderLeftWidth: 3,
    borderLeftColor: '#3b82f6'
  },
  testCardFinish: {
    borderLeftWidth: 3,
    borderLeftColor: '#ffffff'
  },
  serverHostCard: {
    backgroundColor: '#0d121f',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginTop: 4
  },
  serverHostLabel: {
    color: '#94a3b8',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4
  },
  serverHostInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  serverHostInput: {
    flex: 1,
    backgroundColor: '#080b12',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#263148',
    color: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '700'
  },
  serverHostSaveBtn: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#38bdf8'
  },
  serverHostSaveText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '900'
  },
  ps5GuideBox: {
    backgroundColor: '#090d17',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e2638',
    padding: 8,
    marginTop: 6
  },
  ps5GuideTitle: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 3
  },
  ps5GuideItem: {
    color: '#94a3b8',
    fontSize: 8.5,
    fontWeight: '600',
    marginVertical: 1
  },
  guideHighlight: {
    color: '#f8fafc',
    fontWeight: '800'
  },
  guideGreen: {
    color: '#22c55e',
    fontWeight: '900'
  },
  guideHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  standaloneBadge: {
    backgroundColor: '#052e16',
    borderWidth: 1,
    borderColor: '#22c55e',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4
  },
  standaloneBadgeText: {
    color: '#4ade80',
    fontSize: 7.5,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  standaloneBadgeExpo: {
    backgroundColor: '#172554',
    borderColor: '#38bdf8'
  },
  standaloneBadgeTextExpo: {
    color: '#38bdf8'
  },
  titleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  envBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1
  },
  envBadgeExpo: {
    backgroundColor: '#1e1b4b',
    borderColor: '#818cf8'
  },
  envBadgeApk: {
    backgroundColor: '#052e16',
    borderColor: '#22c55e'
  },
  envBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  envTextExpo: {
    color: '#a5b4fc'
  },
  envTextApk: {
    color: '#4ade80'
  }
});
