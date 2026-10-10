import dgram, { RemoteInfo } from 'node:dgram';
import http from 'node:http';
import os from 'node:os';
import { WebSocketServer, WebSocket } from 'ws';
import {
  ParserRegistry,
  TelemetryStore,
  PacketId,
  Formatters,
  SafetyCarStatus
} from '@f1-dash/telemetry-core';
import { RaceEngineerDetector } from '../mobile-app/src/services/race-engineer-detector';

// ==========================================
// CONFIGURAÇÕES DE REDE E PORTAS
// ==========================================
const UDP_PORT = Number(process.env.F1_UDP_PORT || 20777);
const WS_PORT = Number(process.env.F1_WS_PORT || 20778);
const GEMINI_API_KEY = 'AQ.Ab8RN6LgIEBTDjoOU0k7dj_BYMD9Slh6fjVUuZWpuS82HOCyyA';

function getLocalIp(): string {
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '127.0.0.1';
}

const LAN_IP = getLocalIp();
const store = TelemetryStore.getInstance();
const detector = new RaceEngineerDetector();

// ==========================================
// SERVIDOR UDP (RECEBE DO JOGO NA PORTA 20777)
// ==========================================
const udpSocket = dgram.createSocket({ type: 'udp4', reuseAddr: true });
let udpPacketCount = 0;
let lastUdpPacketTime = 0;
let currentUdpHz = 0;
let lastHzCheck = Date.now();

udpSocket.on('error', (err) => {
  console.error('[UDP Error]', err);
});

udpSocket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
  udpPacketCount++;
  lastUdpPacketTime = Date.now();

  try {
    const uint8 = new Uint8Array(msg.buffer, msg.byteOffset, msg.byteLength);
    const parsed = ParserRegistry.parse(uint8);
    if (parsed) {
      store.processPacket(parsed);

      // Avalia eventos de corrida em tempo real diretamente no PC
      const cockpit = store.getCockpitState();
      detector.evaluate(cockpit, (scenario) => {
        handleTriggerRadio(scenario, cockpit);
      });
    }
  } catch (err) {
    // Silencia erros de pacotes corrompidos eventuais
  }
});

udpSocket.bind(UDP_PORT, '0.0.0.0', () => {
  console.log(`\x1b[32m✔ Socket UDP escutando na porta ${UDP_PORT} (0.0.0.0)\x1b[0m`);
});

// ==========================================
// CLAUDINHO RONALDO AI (GERAÇÃO DIRETA NO PC)
// ==========================================
const SCENARIO_FALLBACKS: Record<string, string[]> = {
  OVERTAKE: [
    'CARALHO, QUE PASSADA! É disso que eu tô falando, Gabriel, porra!',
    'Moleque doido, passou voando! Mantém essa porra de ritmo!',
    'Boa, Gabriel! O cara nem viu a cor do carro, caralho!'
  ],
  DAMAGE: [
    'Puta que pariu, bateu onde?! Segura esse carro na pista, porra!',
    'Cuidado com a asa dianteira, caralho! Me avisa se o volante tá torto!',
    'Merda, danificou o carro! Não arrisca agora, traz ele inteiro pro box!'
  ],
  SAFETY_CAR: [
    'Safety car na pista, porra! Segura o delta positivo e não faz cagada!',
    'Bandeira amarela, safety car! Respira, economiza pneu e foca no delta!'
  ],
  VSC: [
    'Virtual Safety Car na pista! Olha o delta no visor e segura o pé!',
    'VSC acionado! Mantém o delta positivo, não toma punição à toa!'
  ],
  PIT_LANE: [
    'Box agora, box agora! Aciona a porra do limitador na linha!',
    'Entrando no pit, não esquece o limitador! Parada rápida agora!'
  ],
  FASTEST_LAP: [
    'VOLTA MAIS RÁPIDA! É o Goat da F1, caralho! Que volta absurda!',
    'Roxo em todos os setores! Você tá voando baixo hoje, porra!'
  ],
  CALM_RACE: [
    'Tá tão calmo que parece passeio de domingo, Gabriel! Anda logo com essa lata velha!',
    'Tudo sussa por aqui, Gabriel. Só não vai dormir no volante, caralho!',
    'Pista limpa na sua frente, hein? Vê se não inventa moda e mantém o ritmo, moleque!'
  ],
  GAP_UPDATE: [
    'O cara da frente tá logo ali, Gabriel! Tira essa diferença, caralho!',
    'Cola na asa dele, porra! Tá a menos de dois segundos, bota pressão!'
  ],
  RED_FLAG: [
    'Bandeira vermelha, caralho! Sessão suspensa, traz o carro pro box devagar!'
  ],
  POSITION_LOST: [
    'Puta que pariu, tomou passada! Foco na retomada, Gabriel, vai pra cima!'
  ],
  TYRE_WEAR: [
    'Esses pneus tão no osso, porra! Mais de 70% de desgaste, segura na curva!'
  ]
};

async function generateGeminiSpeech(scenario: string, text: string): Promise<string | undefined> {
  const models = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
  const body = JSON.stringify({
    contents: [{ parts: [{ text }] }],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Puck' } } }
    }
  });

  for (const model of models) {
    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body }
      );
      if (res.ok) {
        const json = await res.json();
        const data = json?.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData)?.inlineData?.data;
        if (data) return data;
      }
    } catch {}
  }
  return undefined;
}

let isGeneratingRadio = false;

async function handleTriggerRadio(scenario: string, telemetry: any) {
  if (isGeneratingRadio) return;
  isGeneratingRadio = true;

  console.log(`\n\x1b[33m⚡ [EVENTO DETECTADO]: ${scenario}\x1b[0m`);
  const pool = SCENARIO_FALLBACKS[scenario] || SCENARIO_FALLBACKS.OVERTAKE;
  const radioText = pool[Math.floor(Math.random() * pool.length)];

  console.log(`🎙️ [Claudinho Ronaldo]: "${radioText}"`);
  console.log('🤖 Gerando áudio via Gemini 3.8 Puck...');

  const wavBase64 = await generateGeminiSpeech(scenario, radioText);

  if (wavBase64) {
    console.log(`\x1b[32m✔ Áudio gerado (${wavBase64.length} bytes base64) — Enviando aos celulares conectados!\x1b[0m\n`);
  } else {
    console.log(`\x1b[33m⚠ Áudio remoto indisponível — enviando texto com fallback local.\x1b[0m\n`);
  }

  const radioPayload = JSON.stringify({
    type: 'TEAM_RADIO',
    scenario,
    text: radioText,
    wavBase64
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(radioPayload);
    }
  }

  setTimeout(() => {
    isGeneratingRadio = false;
  }, 4000);
}

// ==========================================
// SERVIDOR HTTP & WEBSOCKET (PORTA 20778)
// ==========================================
const server = http.createServer((req, res) => {
  const url = req.url || '/';

  if (url === '/api/telemetry-status') {
    const cockpit = store.getCockpitState();
    res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(
      JSON.stringify({
        online: Date.now() - lastUdpPacketTime < 2500,
        udpHz: currentUdpHz,
        wsClients: wss.clients.size,
        speed: cockpit.speed,
        gear: cockpit.gear,
        rpm: cockpit.engineRPM,
        position: cockpit.carPosition,
        lap: cockpit.currentLapNum,
        frontLeftWingDamage: cockpit.frontLeftWingDamage,
        frontRightWingDamage: cockpit.frontRightWingDamage,
        safetyCarStatus: cockpit.safetyCarStatus
      })
    );
    return;
  }

  // Página web simples de diagnóstico
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  const cockpit = store.getCockpitState();
  const isOnline = Date.now() - lastUdpPacketTime < 2500;
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>F1 Dash — PC Relay & Diagnostic Server</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body { font-family: system-ui, sans-serif; background: #0b0f19; color: #f8fafc; padding: 24px; }
        .card { max-width: 650px; margin: 0 auto; background: #131b2e; border: 1px solid #1e293b; border-radius: 16px; padding: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
        .badge { display: inline-block; padding: 4px 10px; border-radius: 9999px; font-weight: bold; font-size: 12px; }
        .online { background: #064e3b; color: #34d399; }
        .offline { background: #7f1d1d; color: #f87171; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-top: 16px; }
        .stat { background: #0f172a; padding: 12px; border-radius: 8px; border: 1px solid #1e293b; }
        .stat-val { font-size: 24px; font-weight: 800; color: #38bdf8; }
        .stat-lbl { font-size: 11px; color: #94a3b8; text-transform: uppercase; }
        .btn { display: inline-block; margin-top: 8px; padding: 10px 16px; background: #E05A36; color: #fff; border-radius: 8px; text-decoration: none; font-weight: bold; border: none; cursor: pointer; }
        .btn:hover { background: #ff6b45; }
      </style>
    </head>
    <body>
      <div class="card">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h2 style="margin:0;">🏎️ F1 DASH — RELAY SERVER</h2>
          <span class="badge ${isOnline ? 'online' : 'offline'}">${isOnline ? 'UDP ONLINE' : 'AGUARDANDO JOGO'}</span>
        </div>
        <p style="color:#94a3b8; font-size:14px; margin-top:8px;">
          IP para conectar no celular: <strong style="color:#38bdf8;">${LAN_IP}:${WS_PORT}</strong>
        </p>

        <div class="grid">
          <div class="stat"><div class="stat-lbl">Frequência UDP</div><div class="stat-val">${currentUdpHz} HZ</div></div>
          <div class="stat"><div class="stat-lbl">Celulares Conectados</div><div class="stat-val">${wss.clients.size}</div></div>
          <div class="stat"><div class="stat-lbl">Velocidade</div><div class="stat-val">${cockpit.speed || 0} km/h</div></div>
          <div class="stat"><div class="stat-lbl">Marcha</div><div class="stat-val">${cockpit.gear === 0 ? 'N' : cockpit.gear === -1 ? 'R' : cockpit.gear}</div></div>
          <div class="stat"><div class="stat-lbl">Asa Dianteira Esq</div><div class="stat-val">${cockpit.frontLeftWingDamage || 0}%</div></div>
          <div class="stat"><div class="stat-lbl">Asa Dianteira Dir</div><div class="stat-val">${cockpit.frontRightWingDamage || 0}%</div></div>
        </div>

        <div style="margin-top:24px; padding-top:16px; border-top:1px solid #1e293b;">
          <h4 style="margin:0 0 12px 0;">⚡ Testar Disparo de Rádio no Celular:</h4>
          <button class="btn" onclick="fetch('/api/trigger?scenario=DAMAGE')">💥 Testar Batida</button>
          <button class="btn" onclick="fetch('/api/trigger?scenario=SAFETY_CAR')">🚗 Testar Safety Car</button>
          <button class="btn" onclick="fetch('/api/trigger?scenario=OVERTAKE')">🏎️ Testar Ultrapassagem</button>
          <button class="btn" onclick="fetch('/api/trigger?scenario=CALM_RACE')">😂 Testar Piada</button>
        </div>
      </div>
      <script>
        // Auto-refresh a cada 1.5s
        setTimeout(() => location.reload(), 1500);
      </script>
    </body>
    </html>
  `);
});

// Endpoint para testar disparos via clique na página
server.on('request', (req, res) => {
  if (req.url?.startsWith('/api/trigger')) {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const scenario = urlParams.searchParams.get('scenario') || 'OVERTAKE';
    handleTriggerRadio(scenario, store.getCockpitState());
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ triggered: scenario }));
  }
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket, req) => {
  const remoteIp = req.socket.remoteAddress;
  console.log(`\x1b[32m📱 [NOVO CELULAR CONECTADO VIA WEBSOCKET]\x1b[0m IP: ${remoteIp}`);

  // Envia estado inicial completo de imediato
  const initial = store.getCockpitState();
  ws.send(
    JSON.stringify({
      ...initial,
      connected: true,
      packetsPerSecond: currentUdpHz || 30
    })
  );

  ws.on('close', () => {
    console.log(`\x1b[31m📱 [CELULAR DESCONECTOU]\x1b[0m IP: ${remoteIp}`);
  });
});

// Broadcast contínuo de telemetria a ~33 FPS (a cada 30ms)
setInterval(() => {
  if (wss.clients.size === 0) return;

  const cockpit = store.getCockpitState();
  const isOnline = Date.now() - lastUdpPacketTime < 2500;

  const payload = JSON.stringify({
    ...cockpit,
    connected: isOnline,
    packetsPerSecond: isOnline ? (currentUdpHz || 30) : 0
  });

  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
}, 30);

// Cálculo de frequência Hz a cada 1 segundo
setInterval(() => {
  const now = Date.now();
  const elapsed = (now - lastHzCheck) / 1000;
  if (elapsed >= 1) {
    currentUdpHz = Math.round(udpPacketCount / elapsed);
    udpPacketCount = 0;
    lastHzCheck = now;
  }

  // Linha de status no terminal
  if (Date.now() - lastUdpPacketTime < 2500) {
    const cockpit = store.getCockpitState();
    const gearStr = cockpit.gear === 0 ? 'N' : cockpit.gear === -1 ? 'R' : String(cockpit.gear);
    process.stdout.write(
      `\r🏎️ [UDP LIVE: \x1b[32m${currentUdpHz} HZ\x1b[0m] Vel: \x1b[36m${cockpit.speed || 0} km/h\x1b[0m | Marcha: \x1b[33m${gearStr}\x1b[0m | RPM: \x1b[32m${cockpit.engineRPM || 0}\x1b[0m | Dano Asa: \x1b[31m${cockpit.frontLeftWingDamage || 0}%\x1b[0m | Celulares: \x1b[35m${wss.clients.size}\x1b[0m  `
    );
  }
}, 1000);

server.listen(WS_PORT, '0.0.0.0', () => {
  console.log('\n=============================================================');
  console.log('🏎️  \x1b[1m\x1b[41m  F1 DASH — PC RELAY & TELEMETRY ENGINE  \x1b[0m');
  console.log('=============================================================');
  console.log(`📡 \x1b[1mPorta UDP F1 (Entrada):\x1b[0m  \x1b[36m${UDP_PORT}\x1b[0m (Configure no PS5 / F1 23/24)`);
  console.log(`🌐 \x1b[1mIP do seu PC na Rede:\x1b[0m    \x1b[32m${LAN_IP}\x1b[0m`);
  console.log(`📱 \x1b[1mNo Celular (PC Relay):\x1b[0m   \x1b[33m${LAN_IP}:${WS_PORT}\x1b[0m`);
  console.log(`🔍 \x1b[1mPainel Web de Teste:\x1b[0m     \x1b[34mhttp://${LAN_IP}:${WS_PORT}\x1b[0m`);
  console.log('=============================================================\n');
  console.log('\x1b[33mAguardando pacotes do jogo ou conexão do celular...\x1b[0m\n');
});
