import dgram, { RemoteInfo } from 'node:dgram';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { WebSocketServer, WebSocket } from 'ws';
import {
  ParserRegistry,
  TelemetryStore,
  CockpitTelemetryState,
  SafetyCarStatus,
  PitStatus,
  Weather
} from '@f1-dash/telemetry-core';

const F1_UDP_PORT = 20777;
const WS_PORT = 20778;
const ESP32_IP = '192.168.1.103';
const ESP32_PORT = 4210;
const LOG_FILE = path.join(process.cwd(), 'simulator', 'jumphost-telemetry.log');

const rxSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
const txSocket = dgram.createSocket({ type: 'udp4' });
const store = TelemetryStore.getInstance();

let latchedDayNight: 'DAY' | 'NIGHT' = 'DAY';
let lastDrivingActivityMs = 0;
let lastTelemetryReceivedMs = 0;
let prevSpeed = 0;
let prevDamageSum = 0;
let isCrashActive = false;
let crashTimer = 0;
let lastPriorityHash = '';
let lastDiagnosticSig = '';
let lastUdpSendTime = 0;
let latestPayload: any = null;
let packetsReceived = 0;
let packetsSentEsp32 = 0;

function writeLog(line: string) {
  const ts = new Date().toISOString().slice(11, 23);
  const full = `[${ts}] ${line}`;
  console.log(full);
  try {
    fs.appendFileSync(LOG_FILE, full + '\n', 'utf8');
  } catch {}
}

function buildLightingPayload(telemetry: CockpitTelemetryState) {
  const now = Date.now();
  const speed = telemetry.speed ?? 0;
  const rpm = telemetry.engineRPM ?? 0;

  if (rpm > 500 || speed > 1) {
    lastDrivingActivityMs = now;
  }
  const isWaiting = now - lastDrivingActivityMs > 6000;

  let weather = 'CLEAR';
  const rawWeather = telemetry.weather;
  if (rawWeather === Weather.LightRain || rawWeather === Weather.HeavyRain) {
    weather = 'RAIN';
  } else if (rawWeather === Weather.Storm) {
    weather = 'STORM';
  } else if (rawWeather === Weather.Overcast || rawWeather === Weather.LightCloud) {
    weather = 'CLOUDY';
  }

  const rawTrackTemp = telemetry.trackTemperature ?? 0;
  if (rawTrackTemp > 0) {
    if (latchedDayNight === 'DAY' && rawTrackTemp <= 23) {
      latchedDayNight = 'NIGHT';
    } else if (latchedDayNight === 'NIGHT' && rawTrackTemp >= 26) {
      latchedDayNight = 'DAY';
    }
  }
  const ambient = isWaiting ? 'WAITING' : latchedDayNight;

  let trackStatus = 'CLEAR';
  if (telemetry.isRedFlagActive || telemetry.vehicleFiaFlags === 4) {
    trackStatus = 'RED';
  } else if (telemetry.safetyCarStatus === SafetyCarStatus.Full) {
    trackStatus = 'SAFETY_CAR';
  } else if (telemetry.safetyCarStatus === SafetyCarStatus.Virtual) {
    trackStatus = 'VSC';
  } else if (telemetry.vehicleFiaFlags === 3) {
    trackStatus = 'YELLOW';
  } else if (telemetry.vehicleFiaFlags === 1) {
    trackStatus = 'GREEN';
  }

  const currentDamageSum =
    (telemetry.frontLeftWingDamage ?? 0) +
    (telemetry.frontRightWingDamage ?? 0) +
    (telemetry.rearWingDamage ?? 0) +
    (telemetry.floorDamage ?? 0);

  const damageDelta = currentDamageSum - prevDamageSum;
  const isSuddenDecel = !isWaiting && prevSpeed >= 65 && speed <= 12 && (telemetry.brake ?? 0) < 0.85;

  if (!isWaiting && (damageDelta >= 5 || isSuddenDecel || telemetry.engineBlown)) {
    isCrashActive = true;
    crashTimer = now + 3500;
  } else if (now > crashTimer || isWaiting) {
    isCrashActive = false;
  }

  prevSpeed = speed;
  prevDamageSum = currentDamageSum;

  // Modo Reta: aciona imediatamente ao entrar na zona (dist == 0) ou quando a asa abre
  let activeAero = 'OFF';
  if (!isWaiting) {
    if (
      telemetry.activeAeroMode === 1 ||
      telemetry.drsActive ||
      (Boolean(telemetry.activeAeroAvailable) && (telemetry.activeAeroActivationDistance ?? 0) === 0)
    ) {
      activeAero = 'X_MODE_STRAIGHT';
    } else if (telemetry.activeAeroMode === 2) {
      activeAero = 'Z_MODE_CORNER';
    }
  }

  // Modo Overtake: SOMENTE quando < 1s atrás do rival com Overtake habilitado/ativo (NUNCA pelo botão ERS comum!)
  const overtake =
    !isWaiting &&
    Boolean(
      telemetry.overtakeActive ||
      (telemetry.overtakeAvailable && (telemetry.overtakeActivationDistance ?? 0) === 0)
    );

  const inPits =
    !isWaiting &&
    (telemetry.pitStatus === PitStatus.Pitting || telemetry.pitStatus === PitStatus.InPitArea);
  const pitLimiter = !isWaiting && !!telemetry.pitLimiterActive;

  const maxRpm = telemetry.maxRPM || 13500;
  const rpmPercent = Math.min(100, Math.max(0, (rpm / maxRpm) * 100));
  const revPercent = Math.max(rpmPercent, telemetry.revLightsPercent ?? 0);
  const shiftFlash = !isWaiting && revPercent >= 96;

  return {
    ambient,
    waiting: isWaiting,
    weather,
    trackTempCelsius: rawTrackTemp > 0 ? rawTrackTemp : 30,
    trackStatus,
    chequeredFlag: !isWaiting && !!(telemetry.totalLaps > 0 && telemetry.currentLapNum > telemetry.totalLaps),
    overtake,
    activeAero,
    drsActive: !isWaiting && (activeAero === 'X_MODE_STRAIGHT' || !!telemetry.drsActive),
    drsAllowed: !isWaiting && !!telemetry.drsAllowed,
    pitLimiter,
    inPits,
    isCrash: isCrashActive,
    engineBlown: !isWaiting && !!telemetry.engineBlown,
    rpmPercent: Math.round(rpmPercent),
    revLightsPercent: Math.round(revPercent),
    shiftFlash,
    timestamp: now
  };
}

function sendUdpToEsp32(jsonStr: string) {
  // DESATIVADO PERMANENTEMENTE: O celular é o único remetente autorizado para o ESP32!
  // O PC Jumphost atua estritamente como monitor/logger passivo para jamais conflitar com o celular.
  return;
}

function dispatchToEsp32(payload: any, telemetry?: CockpitTelemetryState) {
  const now = Date.now();
  const priorityHash = `${payload.ambient}_${payload.waiting}_${payload.weather}_${payload.trackStatus}_${payload.overtake}_${payload.activeAero}_${payload.drsActive}_${payload.pitLimiter}_${payload.inPits}_${payload.isCrash}_${payload.engineBlown}_${payload.chequeredFlag}`;

  if (telemetry) {
    const diagSig = `aeroMode=${telemetry.activeAeroMode}|aeroAvail=${telemetry.activeAeroAvailable}(${telemetry.activeAeroActivationDistance}m)|ovtkAct=${telemetry.overtakeActive}|ovtkAvail=${telemetry.overtakeAvailable}(${telemetry.overtakeActivationDistance}m)|drs=${telemetry.drsActive}/${telemetry.drsAllowed}|ersMode=${telemetry.ersDeployMode}|wait=${payload.waiting}`;
    if (diagSig !== lastDiagnosticSig) {
      lastDiagnosticSig = diagSig;
      writeLog(
        `[TELEMETRIA PS5] ${diagSig} | GapFrente=${telemetry.deltaToCarInFrontInMS}ms | Vel=${telemetry.speed}km/h -> LED=[activeAero:${payload.activeAero}, overtake:${payload.overtake}, ambient:${payload.ambient}]`
      );
    }
  }

  const isPriorityChanged = priorityHash !== lastPriorityHash;
  const isHeartbeatDue = now - lastUdpSendTime >= 140;

  if (!isPriorityChanged && !isHeartbeatDue) return;

  lastPriorityHash = priorityHash;
  lastUdpSendTime = now;
  const jsonStr = JSON.stringify(payload);

  if (isPriorityChanged) {
    writeLog(
      `⚡ [DISPARO IMEDIATO -> ESP32 ${ESP32_IP}:${ESP32_PORT}] activeAero=${payload.activeAero} | overtake=${payload.overtake} | ambient=${payload.ambient} | track=${payload.trackStatus}`
    );
    sendUdpToEsp32(jsonStr);
    for (const delay of [8, 20, 40]) {
      setTimeout(() => {
        if (latestPayload) sendUdpToEsp32(JSON.stringify(latestPayload));
      }, delay);
    }
  } else {
    sendUdpToEsp32(jsonStr);
  }
}

// -------------------------------------------------------------
// SERVIDOR HTTP & WEBSOCKET NA PORTA 20778 (Para o modo PC RELAY do app)
// -------------------------------------------------------------
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  res.end(JSON.stringify({ status: 'ok', server: 'Jumphost Monitor & Bridge', online: true }));
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req) => {
  writeLog(`📱 [CELULAR CONECTADO NO JUMPHOST VIA WEBSOCKET] IP: ${req.socket.remoteAddress}`);
  const initial = store.getCockpitState();
  ws.send(JSON.stringify({ ...initial, connected: true, packetsPerSecond: 60 }));
});

// Envia telemetria para os celulares conectados a cada 33ms (30 FPS)
setInterval(() => {
  if (wss.clients.size === 0) return;
  const cockpit = store.getCockpitState();
  const isOnline = Date.now() - lastTelemetryReceivedMs < 3000;
  const payload = JSON.stringify({
    ...cockpit,
    connected: isOnline,
    packetsPerSecond: isOnline ? 60 : 0
  });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}, 33);

server.listen(WS_PORT, '0.0.0.0', () => {
  writeLog(`🌐 [SERVIDOR WEBSOCKET RELAY ATIVO] Porta ${WS_PORT} pronta para conexões do celular!`);
});

// -------------------------------------------------------------
// RECEPÇÃO UDP NA PORTA 20777 (PS5 Broadcast)
// -------------------------------------------------------------
const COCKPIT_IDS = new Set([1, 2, 3, 6, 7, 10, 16]);

rxSocket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
  packetsReceived++;
  if (msg.length < 7) return;
  const pktId = msg[6];
  if (!COCKPIT_IDS.has(pktId)) return;

  const uint8 = new Uint8Array(msg.buffer, msg.byteOffset, msg.byteLength);
  const parsed = ParserRegistry.parse(uint8, { playerOnly: true });
  if (!parsed) return;

  store.processPacket(parsed);
  lastTelemetryReceivedMs = Date.now();

  const cockpit = store.getCockpitState();
  const payload = buildLightingPayload(cockpit);
  latestPayload = payload;
  dispatchToEsp32(payload, cockpit);
});

setInterval(() => {
  const now = Date.now();
  if (latestPayload && now - lastTelemetryReceivedMs < 12000) {
    if (now - lastTelemetryReceivedMs > 1500 && !latestPayload.waiting) {
      latestPayload = {
        ...latestPayload,
        ambient: 'WAITING',
        waiting: true,
        activeAero: 'OFF',
        overtake: false,
        drsActive: false,
        shiftFlash: false,
        timestamp: now
      };
    } else {
      latestPayload.timestamp = now;
    }
    dispatchToEsp32(latestPayload);
  }
}, 150);

rxSocket.bind(F1_UDP_PORT, '0.0.0.0', () => {
  writeLog(
    `🚀 [JUMPHOST DUAL ATIVO] UDP 20777 (PS5) + WebSocket 20778 (Celular) -> Ponte Direta UDP <2ms para ESP32 (${ESP32_IP}:${ESP32_PORT})`
  );
});
