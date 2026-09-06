import React, { useEffect, useState } from 'react';
import {
  CockpitTelemetryState,
  INITIAL_COCKPIT_TELEMETRY_STATE,
  TelemetryStore,
  toCockpitTelemetryState,
  SafetyCarStatus,
  Weather,
  PitStatus,
  VehicleFiaFlag,
  ERSDeployMode,
  VisualTyreCompound,
  Formatters
} from '@f1-dash/telemetry-core';
import { CarDamageMap } from './components/CarDamageMap';

export const App: React.FC = () => {
  const [telemetry, setTelemetry] = useState<CockpitTelemetryState>(
    TelemetryStore.getInstance().getCockpitState()
  );
  const [wsConnected, setWsConnected] = useState(false);

  useEffect(() => {
    // 1. Ouvir store local
    const unsub = TelemetryStore.getInstance().subscribe((state) => {
      setTelemetry(toCockpitTelemetryState(state));
    });

    // 2. Conectar ao WebSocket do servidor para receber do PC no celular
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/telemetry-ws`;
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        ws = new WebSocket(wsUrl);
        ws.onopen = () => {
          setWsConnected(true);
        };
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            setTelemetry(data);
          } catch {}
        };
        ws.onclose = () => {
          setWsConnected(false);
          reconnectTimeout = setTimeout(connect, 1000);
        };
        ws.onerror = () => {
          ws?.close();
        };
      } catch {
        reconnectTimeout = setTimeout(connect, 2000);
      }
    }

    connect();

    return () => {
      unsub();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      ws?.close();
    };
  }, []);

  // Dados calculados
  const scInfo = Formatters.getSafetyCarInfo(telemetry.safetyCarStatus);
  const flagInfo = Formatters.getFiaFlagInfo(telemetry.vehicleFiaFlags);
  const pitInfo = Formatters.getPitStatusLabel(telemetry.pitStatus, telemetry.pitLimiterActive);
  const ersMode = Formatters.getErsModeName(telemetry.ersDeployMode);

  const gearDisplay = telemetry.gear === 0 ? 'N' : telemetry.gear === -1 ? 'R' : telemetry.gear.toString();
  const maxRpm = telemetry.maxRPM || 13500;
  const rpmPercent = Math.min(100, Math.max(0, (telemetry.engineRPM / maxRpm) * 100));
  const activePercent = Math.max(rpmPercent, telemetry.revLightsPercent);
  const totalLeds = 15;
  const activeLeds = Math.round((activePercent / 100) * totalLeds);
  const isShiftFlash = activePercent >= 96;

  return (
    <div style={styles.appContainer}>
      {/* 1. Barra Superior de Status */}
      <header style={styles.topHeader}>
        <div style={styles.connectionStatus}>
          <span
            style={{
              ...styles.statusDot,
              backgroundColor: telemetry.connected ? '#22c55e' : '#ef4444'
            }}
          />
          <span style={styles.statusLabel}>
            {telemetry.connected
              ? `F1 ${telemetry.gameYear} CONECTADO (${telemetry.packetsPerSecond} Hz)`
              : 'AGUARDANDO TELEMETRIA UDP (PORTA 20777)...'}
          </span>
        </div>
        <div style={styles.weatherInfo}>
          <span>🌡️ Pista: {telemetry.trackTemperature}°C</span>
          <span style={{ marginLeft: 12 }}>Ar: {telemetry.airTemperature}°C</span>
        </div>
      </header>

      {/* 2. Banners de Alerta e Segurança */}
      {telemetry.isRedFlagActive && (
        <div style={{ ...styles.alertBanner, backgroundColor: '#ef4444' }}>
          🛑 BANDEIRA VERMELHA - SESSÃO SUSPENSA
        </div>
      )}

      {scInfo.active && (
        <div style={{ ...styles.alertBanner, backgroundColor: scInfo.color, color: '#000' }}>
          ⚠️ {scInfo.label} {telemetry.safetyCarDelta !== 0 && `| DELTA: ${Formatters.formatDelta(telemetry.safetyCarDelta * 1000)}`}
        </div>
      )}

      {flagInfo.active && (
        <div style={{ ...styles.flagBanner, backgroundColor: flagInfo.color }}>
          🚩 {flagInfo.label}
        </div>
      )}

      {pitInfo.active && (
        <div style={{ ...styles.pitBanner, borderColor: pitInfo.color }}>
          <span style={{ ...styles.pitBadge, backgroundColor: pitInfo.color }}>{pitInfo.label}</span>
          <span style={styles.pitDetail}>Limite: {telemetry.pitSpeedLimit} km/h</span>
          {telemetry.pitLaneTimeInLaneInMS > 0 && (
            <span style={styles.pitDetail}>Pit Lane: {(telemetry.pitLaneTimeInLaneInMS / 1000).toFixed(1)}s</span>
          )}
          {telemetry.pitStopTimerInMS > 0 && (
            <span style={{ ...styles.pitDetail, color: '#f97316', fontWeight: 'bold' }}>
              Parada: {(telemetry.pitStopTimerInMS / 1000).toFixed(1)}s
            </span>
          )}
        </div>
      )}

      {/* 3. Barra de 15 LEDs de RPM (RevLights) */}
      <div style={{ ...styles.revLightsContainer, borderColor: isShiftFlash ? '#a855f7' : '#27272a' }}>
        {Array.from({ length: totalLeds }).map((_, i) => {
          const isActive = i < activeLeds;
          let ledColor = '#22c55e';
          if (i >= 5 && i < 10) ledColor = '#ef4444';
          else if (i >= 10) ledColor = '#a855f7';

          return (
            <div
              key={i}
              style={{
                ...styles.ledItem,
                backgroundColor: isActive ? ledColor : '#1c1917',
                boxShadow: isActive ? `0 0 10px ${ledColor}` : 'none'
              }}
            />
          );
        })}
      </div>

      {/* 4. Grade Principal do Cockpit */}
      <main style={styles.mainGrid}>
        {/* Coluna Esquerda: ERS & Combustível */}
        <section style={styles.card}>
          <div style={styles.cardHeader}>
            <span style={styles.cardTitle}>⚡ ERS & BATERIA</span>
            <span
              style={{
                ...styles.modeBadge,
                backgroundColor: telemetry.ersDeployMode === ERSDeployMode.Overtake ? '#f59e0b' : '#1e293b',
                color: telemetry.ersDeployMode === ERSDeployMode.Overtake ? '#000' : '#38bdf8'
              }}
            >
              {ersMode}
            </span>
          </div>

          <div style={styles.progressTrack}>
            <div
              style={{
                ...styles.progressFill,
                width: `${telemetry.ersPercentage}%`,
                backgroundColor: telemetry.ersDeployMode === ERSDeployMode.Overtake ? '#f59e0b' : '#0ea5e9'
              }}
            />
          </div>
          <div style={styles.bigValue}>{telemetry.ersPercentage.toFixed(0)}%</div>

          <div style={styles.subDivider}>
            <span style={styles.subLabel}>⛽ COMBUSTÍVEL</span>
            <div style={styles.subRow}>
              <span style={styles.subMainText}>{telemetry.fuelInTank.toFixed(1)} kg</span>
              <span style={styles.subText}>
                ({telemetry.fuelRemainingLaps >= 0 ? '+' : ''}
                {telemetry.fuelRemainingLaps.toFixed(1)} v)
              </span>
            </div>
          </div>
        </section>

        {/* Coluna Central: Marcha, Velocidade & DRS */}
        <section style={styles.centerCard}>
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center', flexWrap: 'wrap' }}>
            <div
              style={{
                ...styles.drsBadge,
                backgroundColor: telemetry.drsActive ? '#22c55e' : telemetry.drsAllowed ? '#3b82f6' : '#27272a',
                color: telemetry.drsActive || telemetry.drsAllowed ? '#000' : '#71717a'
              }}
            >
              DRS {telemetry.drsActive ? 'ACTIVE' : telemetry.drsAllowed ? 'READY' : 'OFF'}
            </div>

            {telemetry.activeAeroAvailable && (
              <div
                style={{
                  ...styles.drsBadge,
                  backgroundColor: telemetry.activeAeroMode === 1 ? '#a855f7' : '#0ea5e9',
                  color: '#fff'
                }}
              >
                {telemetry.activeAeroMode === 1 ? 'MODO X (RETA)' : 'MODO Z (CURVA)'}
              </div>
            )}

            {telemetry.overtakeActive && (
              <div
                style={{
                  ...styles.drsBadge,
                  backgroundColor: '#f59e0b',
                  color: '#000',
                  fontWeight: 900
                }}
              >
                ⚡ BOOST 2026
              </div>
            )}
          </div>

          <div style={styles.gearDisplay}>{gearDisplay}</div>

          <div style={styles.speedRow}>
            <span style={styles.speedNumber}>{telemetry.speed}</span>
            <span style={styles.speedUnit}>KM/H</span>
          </div>

          <div style={styles.rpmNumber}>{telemetry.engineRPM} RPM</div>
        </section>

        {/* Coluna Direita: Tempos, Deltas & Posição */}
        <section style={styles.card}>
          <div style={styles.timingHeader}>
            <div>
              <span style={styles.subLabel}>POSIÇÃO</span>
              <div style={styles.posText}>P{telemetry.carPosition || 1}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={styles.subLabel}>VOLTA</span>
              <div style={styles.lapText}>
                {telemetry.currentLapNum || 1}
                {telemetry.totalLaps > 0 ? `/${telemetry.totalLaps}` : ''}
              </div>
            </div>
          </div>

          <div style={styles.timeTable}>
            <div style={styles.timeTableRow}>
              <span style={styles.timeTableLabel}>ATUAL:</span>
              <span style={{ ...styles.timeTableValue, color: '#38bdf8' }}>
                {Formatters.formatLapTime(telemetry.currentLapTimeInMS)}
              </span>
            </div>
            <div style={styles.timeTableRow}>
              <span style={styles.timeTableLabel}>ÚLTIMA:</span>
              <span style={styles.timeTableValue}>
                {Formatters.formatLapTime(telemetry.lastLapTimeInMS)}
              </span>
            </div>
            <div style={styles.timeTableRow}>
              <span style={styles.timeTableLabel}>MELHOR:</span>
              <span style={{ ...styles.timeTableValue, color: '#a855f7' }}>
                {Formatters.formatLapTime(telemetry.bestLapTimeInMS)}
              </span>
            </div>
          </div>

          {/* Setores (incluindo Setor 3 derivado) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '4px 6px', backgroundColor: '#18181b', borderRadius: 4, fontSize: 11, color: '#94a3b8' }}>
            <span>S1: <strong style={{ color: '#fff' }}>{Formatters.formatLapTime(telemetry.sector1TimeInMS)}</strong></span>
            <span>S2: <strong style={{ color: '#fff' }}>{Formatters.formatLapTime(telemetry.sector2TimeInMS)}</strong></span>
            <span>S3: <strong style={{ color: '#38bdf8' }}>{Formatters.formatLapTime(telemetry.sector3TimeInMS)}</strong></span>
          </div>

          <div style={styles.deltaBox}>
            <div>FRENTE: {Formatters.formatDelta(telemetry.deltaToCarInFrontInMS)}</div>
            <div>LÍDER: {Formatters.formatDelta(telemetry.deltaToRaceLeaderInMS)}</div>
          </div>


        </section>
      </main>

      {/* 5. Linha Inferior: 4 Pneus & Pedais */}
      <footer style={styles.bottomFooter}>
        {/* Mapa Visual de Danos + Pneus */}
        <CarDamageMap
          frontLeftWingDamage={telemetry.frontLeftWingDamage}
          frontRightWingDamage={telemetry.frontRightWingDamage}
          rearWingDamage={telemetry.rearWingDamage}
          floorDamage={telemetry.floorDamage}
          diffuserDamage={telemetry.diffuserDamage}
          sidepodDamage={telemetry.sidepodDamage}
          gearBoxDamage={telemetry.gearBoxDamage}
          engineDamage={telemetry.engineDamage}
          tyresWear={telemetry.tyresWear}
          tyresDamage={telemetry.tyresDamage}
          tyresSurfaceTemp={telemetry.tyresSurfaceTemperature}
          tyresPressure={telemetry.tyresPressure}
          brakesTemperature={telemetry.brakesTemperature}
          compound={telemetry.visualTyreCompound}
          tyresAgeLaps={telemetry.tyresAgeLaps}
          drsFault={telemetry.drsFault}
          engineBlown={telemetry.engineBlown}
        />

        {/* Pedais de Acelerador e Freio */}
        <div style={styles.pedalsContainer}>
          <div style={styles.pedalColumn}>
            <span style={styles.pedalLabel}>THR</span>
            <div style={styles.pedalTrack}>
              <div
                style={{
                  ...styles.pedalFill,
                  height: `${Math.round(telemetry.throttle * 100)}%`,
                  backgroundColor: '#22c55e'
                }}
              />
            </div>
            <span style={styles.pedalValue}>{Math.round(telemetry.throttle * 100)}%</span>
          </div>

          <div style={styles.pedalColumn}>
            <span style={styles.pedalLabel}>BRK</span>
            <div style={styles.pedalTrack}>
              <div
                style={{
                  ...styles.pedalFill,
                  height: `${Math.round(telemetry.brake * 100)}%`,
                  backgroundColor: '#ef4444'
                }}
              />
            </div>
            <span style={styles.pedalValue}>{Math.round(telemetry.brake * 100)}%</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  appContainer: {
    width: '100vw',
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '12px',
    backgroundColor: '#050507'
  },
  topHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    borderBottom: '1px solid #1c1917',
    fontSize: '12px'
  },
  connectionStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    display: 'inline-block'
  },
  statusLabel: {
    color: '#a1a1aa',
    fontWeight: 600
  },
  weatherInfo: {
    color: '#71717a',
    fontWeight: 500
  },
  alertBanner: {
    padding: '8px 16px',
    borderRadius: '8px',
    textAlign: 'center',
    fontWeight: 800,
    fontSize: '16px',
    letterSpacing: '1px',
    margin: '4px 0'
  },
  flagBanner: {
    padding: '6px 12px',
    borderRadius: '6px',
    textAlign: 'center',
    fontWeight: 800,
    fontSize: '14px',
    color: '#fff',
    margin: '4px 0'
  },
  pitBanner: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#18181b',
    border: '2px solid',
    borderRadius: '8px',
    padding: '6px',
    margin: '4px 0'
  },
  pitBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    color: '#fff',
    fontWeight: 800,
    fontSize: '12px'
  },
  pitDetail: {
    color: '#a1a1aa',
    fontSize: '12px',
    fontWeight: 600
  },
  revLightsContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '6px',
    padding: '10px',
    backgroundColor: '#09090b',
    borderRadius: '12px',
    border: '2px solid #27272a'
  },
  ledItem: {
    width: '18px',
    height: '28px',
    borderRadius: '4px',
    transition: 'background-color 0.05s ease'
  },
  mainGrid: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '16px',
    flex: 1,
    margin: '8px 0'
  },
  card: {
    flex: 1,
    maxWidth: '280px',
    backgroundColor: '#09090b',
    borderRadius: '12px',
    border: '1px solid #27272a',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  centerCard: {
    minWidth: '220px',
    backgroundColor: '#09090b',
    borderRadius: '16px',
    border: '2px solid #27272a',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: '12px',
    fontWeight: 800
  },
  modeBadge: {
    padding: '2px 8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: 800
  },
  progressTrack: {
    height: '12px',
    backgroundColor: '#27272a',
    borderRadius: '6px',
    overflow: 'hidden',
    marginBottom: '4px'
  },
  progressFill: {
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.1s ease'
  },
  bigValue: {
    color: '#fff',
    fontSize: '22px',
    fontWeight: 800,
    textAlign: 'right'
  },
  subDivider: {
    borderTop: '1px solid #27272a',
    paddingTop: '8px',
    marginTop: '8px'
  },
  subLabel: {
    color: '#71717a',
    fontSize: '10px',
    fontWeight: 700
  },
  subRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline'
  },
  subMainText: {
    color: '#fff',
    fontSize: '16px',
    fontWeight: 800
  },
  subText: {
    color: '#a1a1aa',
    fontSize: '12px'
  },
  drsBadge: {
    padding: '4px 12px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 900,
    marginBottom: '6px'
  },
  gearDisplay: {
    fontSize: '96px',
    fontWeight: 900,
    color: '#ffffff',
    lineHeight: 1
  },
  speedRow: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
  },
  speedNumber: {
    fontSize: '36px',
    fontWeight: 900,
    color: '#38bdf8'
  },
  speedUnit: {
    fontSize: '14px',
    fontWeight: 700,
    color: '#71717a'
  },
  rpmNumber: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#22c55e',
    marginTop: '4px'
  },
  timingHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  posText: {
    color: '#eab308',
    fontSize: '24px',
    fontWeight: 900
  },
  lapText: {
    color: '#fff',
    fontSize: '20px',
    fontWeight: 800
  },
  timeTable: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    borderTop: '1px solid #27272a',
    paddingTop: '6px'
  },
  timeTableRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '12px'
  },
  timeTableLabel: {
    color: '#a1a1aa',
    fontWeight: 700
  },
  timeTableValue: {
    color: '#fff',
    fontWeight: 800,
    fontFamily: 'monospace'
  },
  deltaBox: {
    borderTop: '1px solid #27272a',
    paddingTop: '6px',
    marginTop: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '10px',
    color: '#71717a',
    fontWeight: 600
  },
  bottomFooter: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '24px'
  },
  pedalsContainer: {
    display: 'flex',
    gap: '12px',
    backgroundColor: '#09090b',
    borderRadius: '12px',
    border: '1px solid #27272a',
    padding: '8px 14px'
  },
  pedalColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px'
  },
  pedalLabel: {
    color: '#71717a',
    fontSize: '10px',
    fontWeight: 800
  },
  pedalTrack: {
    width: '24px',
    height: '70px',
    backgroundColor: '#18181b',
    borderRadius: '4px',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end'
  },
  pedalFill: {
    width: '100%',
    borderRadius: '4px',
    transition: 'height 0.05s ease'
  },
  pedalValue: {
    color: '#fff',
    fontSize: '10px',
    fontWeight: 700
  }
};
