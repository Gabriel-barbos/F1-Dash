import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Network from 'expo-network';
import {
  Laptop,
  Gamepad2,
  FlaskConical,
  Play,
  Wifi,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react-native';
import { telemetryService, ConnectionMode, MomentaryEventType } from '../services/telemetry-service';
import { CockpitTelemetryState, INITIAL_COCKPIT_TELEMETRY_STATE } from '@f1-dash/telemetry-core';

interface MenuScreenProps {
  onLaunchCockpit: (overlay?: MomentaryEventType) => void;
}

export const MenuScreen: React.FC<MenuScreenProps> = ({ onLaunchCockpit }) => {
  const insets = useSafeAreaInsets();
  const [telemetry, setTelemetry] = useState<CockpitTelemetryState>(
    telemetryService.isMockActive() ? ({} as any) : INITIAL_COCKPIT_TELEMETRY_STATE
  );
  const [connMode, setConnMode] = useState<ConnectionMode>(telemetryService.getMode());
  const [hostInput, setHostInput] = useState<string>(telemetryService.getServerHost());
  const [deviceIp, setDeviceIp] = useState<string>('Obtendo IP...');
  const isExpo = telemetryService.isExpoGo();

  useEffect(() => {
    Network.getIpAddressAsync()
      .then((ip) => setDeviceIp(ip || 'Wi-Fi'))
      .catch(() => setDeviceIp('Wi-Fi'));
  }, []);

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

  const handleConnectHost = () => {
    if (hostInput.trim()) {
      telemetryService.setServerHost(hostInput);
      handleSelectMode('WEBSOCKET');
    }
  };

  const isConnected = telemetry.connected;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: Math.max(insets.top, 10),
          paddingBottom: Math.max(insets.bottom, 10),
          paddingLeft: Math.max(insets.left, 16),
          paddingRight: Math.max(insets.right, 16)
        }
      ]}
    >
      {/* 1. Header do Hub */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.brandBadgeRow}>
            <Text style={styles.brandTag}>F1 DASHBOARD</Text>
            <View style={[styles.envBadge, isExpo ? styles.envBadgeExpo : styles.envBadgeApk]}>
              <Text style={styles.envBadgeText}>
                {isExpo ? '📱 EXPO GO' : '⚡ NATIVO'}
              </Text>
            </View>
          </View>
          <Text style={styles.headerTitle}>CONFIGURAÇÃO DE TELEMETRIA</Text>
        </View>

        {/* Status de Conexão */}
        <View style={[styles.statusPill, isConnected ? styles.statusPillOnline : styles.statusPillOffline]}>
          {isConnected ? (
            <CheckCircle2 size={15} color="#22c55e" strokeWidth={2.5} />
          ) : (
            <XCircle size={15} color="#ef4444" strokeWidth={2.5} />
          )}
          <Text style={[styles.statusPillText, { color: isConnected ? '#22c55e' : '#f87171' }]}>
            {isConnected
              ? connMode === 'MOCK'
                ? 'SIMULADOR ATIVO (60 FPS)'
                : `ONLINE • ${telemetry.packetsPerSecond || 60} HZ`
              : 'DESCONECTADO'}
          </Text>
        </View>
      </View>

      {/* 2. Conteúdo Central Scrollável */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>SELECIONE COMO RECEBER OS DADOS</Text>

        <View style={styles.cardsRow}>
          {/* Opção 1: PC Relay (WebSocket) - IDEAL PARA EXPO GO */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              connMode === 'WEBSOCKET' && styles.modeCardSelected,
              styles.modeCardHighlight
            ]}
            onPress={() => handleSelectMode('WEBSOCKET')}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, connMode === 'WEBSOCKET' && styles.iconWrapActive]}>
                <Laptop size={22} color={connMode === 'WEBSOCKET' ? '#38bdf8' : '#94a3b8'} strokeWidth={2.5} />
              </View>
              <View style={styles.cardTitleWrap}>
                <View style={styles.badgeRow}>
                  <Text style={styles.cardTitle}>PC RELAY (WEBSOCKET)</Text>
                  <View style={styles.recommendedPill}>
                    <Text style={styles.recommendedText}>RECOMENDADO NO EXPO</Text>
                  </View>
                </View>
                <Text style={styles.cardSubtitle}>
                  O PC recebe o UDP na porta 20777 e envia para o celular via Wi-Fi.
                </Text>
              </View>
            </View>

            {/* Configuração de IP integrada dentro do próprio card */}
            <View style={styles.ipConfigSection}>
              <Text style={styles.inputLabel}>IP:PORTA DO SERVIDOR PC:</Text>
              <View style={styles.inputActionRow}>
                <TextInput
                  value={hostInput}
                  onChangeText={setHostInput}
                  placeholder="Ex: 192.168.0.75:20778"
                  placeholderTextColor="#64748b"
                  style={styles.ipInput}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={[styles.connectBtn, isConnected && connMode === 'WEBSOCKET' && styles.connectBtnActive]}
                  onPress={handleConnectHost}
                  activeOpacity={0.8}
                >
                  <RefreshCw size={14} color="#fff" strokeWidth={2.5} />
                  <Text style={styles.connectBtnText}>
                    {isConnected && connMode === 'WEBSOCKET' ? 'RECONECTAR' : 'CONECTAR'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>

          {/* Opção 2: MOCK (Simulador Local) */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              connMode === 'MOCK' && styles.modeCardSelected
            ]}
            onPress={() => handleSelectMode('MOCK')}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, connMode === 'MOCK' && styles.iconWrapActive]}>
                <FlaskConical size={22} color={connMode === 'MOCK' ? '#38bdf8' : '#94a3b8'} strokeWidth={2.5} />
              </View>
              <View style={styles.cardTitleWrap}>
                <Text style={styles.cardTitle}>SIMULADOR INTERNO (MOCK)</Text>
                <Text style={styles.cardSubtitle}>
                  Gera aceleração, marchas, DRS e pneus no celular para demonstração sem PC.
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Opção 3: PS5 Direto (UDP Nativo) */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              connMode === 'UDP_NATIVE' && styles.modeCardSelected,
              isExpo && styles.modeCardDisabled
            ]}
            onPress={() => handleSelectMode('UDP_NATIVE')}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconWrap, connMode === 'UDP_NATIVE' && styles.iconWrapActive]}>
                <Gamepad2 size={22} color={connMode === 'UDP_NATIVE' ? '#38bdf8' : '#94a3b8'} strokeWidth={2.5} />
              </View>
              <View style={styles.cardTitleWrap}>
                <View style={styles.badgeRow}>
                  <Text style={styles.cardTitle}>PS5 UDP DIRETO (PORTA 20777)</Text>
                  {isExpo && (
                    <View style={styles.warningPill}>
                      <Text style={styles.warningText}>REQUER APK STANDALONE</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.cardSubtitle}>
                  {isExpo
                    ? 'Sockets UDP nativos não abrem no sandbox Expo Go. No Expo Go use "PC RELAY".'
                    : 'Recepção direta dos pacotes do PS5 na porta 20777 sem computador.'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Instruções Rápidas de Configuração */}
        <View style={styles.instructionsBox}>
          <Text style={styles.instructionTitle}>💡 COMO USAR COM O PC:</Text>
          <Text style={styles.instructionText}>
            1. No terminal do PC, rode <Text style={styles.codeText}>npm run dev</Text> para ligar o servidor.
          </Text>
          <Text style={styles.instructionText}>
            2. Toque no botão <Text style={styles.codeText}>CONECTAR</Text> acima com o IP do seu PC.
          </Text>
          <Text style={styles.instructionText}>
            3. No F1 do PS5, aponte a telemetria para o IP do seu PC (<Text style={styles.codeText}>{hostInput.split(':')[0]}</Text>) porta <Text style={styles.codeText}>20777</Text>, ou rode <Text style={styles.codeText}>npm run mock</Text> no PC.
          </Text>
        </View>
      </ScrollView>

      {/* 3. Botão Gigante de Iniciar */}
      <View style={styles.footerBar}>
        <TouchableOpacity
          style={styles.launchButton}
          onPress={() => {
            telemetryService.forceStateScenario('NORMAL');
            onLaunchCockpit();
          }}
          activeOpacity={0.85}
        >
          <Play size={20} color="#fff" fill="#fff" />
          <Text style={styles.launchButtonText}>ENTRAR NO COCKPIT DISPLAY</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#06080e',
    justifyContent: 'space-between'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#171e2e'
  },
  headerLeft: {
    gap: 3
  },
  brandBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  brandTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2
  },
  envBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  envBadgeExpo: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#0284c7'
  },
  envBadgeApk: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    borderWidth: 1,
    borderColor: '#16a34a'
  },
  envBadgeText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '900'
  },
  headerTitle: {
    color: '#f8fafc',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1
  },
  statusPillOnline: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: '#22c55e'
  },
  statusPillOffline: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: '#ef4444'
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  scrollContainer: {
    flex: 1
  },
  scrollContent: {
    paddingVertical: 12,
    gap: 12
  },
  sectionTitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase'
  },
  cardsRow: {
    gap: 10
  },
  modeCard: {
    backgroundColor: '#0c101c',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    padding: 14,
    gap: 12
  },
  modeCardSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#0f172a'
  },
  modeCardHighlight: {
    borderColor: '#0284c7'
  },
  modeCardDisabled: {
    opacity: 0.75
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#171e2e',
    alignItems: 'center',
    justifyContent: 'center'
  },
  iconWrapActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)'
  },
  cardTitleWrap: {
    flex: 1,
    gap: 2
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap'
  },
  cardTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  cardSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15
  },
  recommendedPill: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#38bdf8'
  },
  recommendedText: {
    color: '#38bdf8',
    fontSize: 9,
    fontWeight: '900'
  },
  warningPill: {
    backgroundColor: 'rgba(234, 179, 8, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#eab308'
  },
  warningText: {
    color: '#facc15',
    fontSize: 9,
    fontWeight: '800'
  },
  ipConfigSection: {
    backgroundColor: '#080c16',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    gap: 6,
    marginTop: 2
  },
  inputLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  inputActionRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center'
  },
  ipInput: {
    flex: 1,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  connectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6
  },
  connectBtnActive: {
    backgroundColor: '#059669'
  },
  connectBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  instructionsBox: {
    backgroundColor: '#090d18',
    borderWidth: 1,
    borderColor: '#172033',
    borderRadius: 8,
    padding: 12,
    gap: 4
  },
  instructionTitle: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    marginBottom: 2
  },
  instructionText: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500'
  },
  codeText: {
    color: '#f8fafc',
    fontWeight: '800',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace'
  },
  footerBar: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#171e2e'
  },
  launchButton: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    borderRadius: 10,
    shadowColor: '#2563eb',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 6
  },
  launchButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 1
  }
});
