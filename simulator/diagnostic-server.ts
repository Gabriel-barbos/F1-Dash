import dgram, { RemoteInfo } from 'node:dgram';
import { ParserRegistry, PacketId, PACKET_NAMES, Formatters } from '@f1-dash/telemetry-core';

const PORT = Number(process.env.F1_UDP_PORT || 20777);
const HOST = process.env.F1_UDP_HOST || '0.0.0.0';
const socket = dgram.createSocket({ type: 'udp4', reuseAddr: true });

let packetCount = 0;
let lastLog = Date.now();

console.log('\x1b[1m\x1b[44m   🔍 F1 25 TELEMETRY & EVENT MONITOR (REACT NATIVE ENGINE)   \x1b[0m');
console.log(`Porta UDP: \x1b[36m${PORT}\x1b[0m | Host: \x1b[36m${HOST}\x1b[0m`);
console.log('\x1b[33mAguardando pacotes de telemetria do jogo ou simulador...\x1b[0m\n');

socket.on('error', (err) => {
  console.error('[UDP ERROR]', err);
});

socket.on('message', (msg: Buffer, rinfo: RemoteInfo) => {
  packetCount++;
  const uint8 = new Uint8Array(msg.buffer, msg.byteOffset, msg.byteLength);
  const parsed = ParserRegistry.parse(uint8);

  if (!parsed) return;

  if (parsed.type === PacketId.CarTelemetry) {
    const t = parsed.data.playerCarTelemetry;
    const gearStr = t.gear === 0 ? 'N' : t.gear === -1 ? 'R' : String(t.gear);
    process.stdout.write(
      `\r🏎️ [TELEMETRIA] Vel: \x1b[36m${t.speed.toString().padStart(3)} km/h\x1b[0m | Marcha: \x1b[33m${gearStr}\x1b[0m | RPM: \x1b[32m${t.engineRPM.toString().padStart(5)}\x1b[0m | DRS: ${t.drs ? '\x1b[32mON\x1b[0m' : 'OFF'} | LEDs: ${t.revLightsPercent}%`
    );
  } else if (parsed.type === PacketId.Session) {
    const s = parsed.data;
    const sc = Formatters.getSafetyCarInfo(s.safetyCarStatus);
    console.log(
      `\n🚩 [SESSÃO] Safety Car: \x1b[1m${sc.label}\x1b[0m | Clima: ${s.weather} | Temp Pista: ${s.trackTemperature}°C | Temp Ar: ${s.airTemperature}°C`
    );
  } else if (parsed.type === PacketId.LapData) {
    const l = parsed.data.playerLapData;
    const pit = Formatters.getPitStatusLabel(l.pitStatus, false);
    if (l.pitStatus !== 0) {
      console.log(
        `\n🛑 [BOXES/PIT] Status: \x1b[35m${pit.label}\x1b[0m | Tempo no Pit: ${l.pitLaneTimeInLaneInMS}ms | Tempo de Parada: ${l.pitStopTimerInMS}ms`
      );
    }
  } else if (parsed.type === PacketId.CarStatus) {
    const st = parsed.data.playerCarStatus;
    const flag = Formatters.getFiaFlagInfo(st.vehicleFiaFlags);
    if (st.vehicleFiaFlags !== 0) {
      console.log(`\n⚠️ [BANDEIRA FIA] ${flag.label}`);
    }
  } else if (parsed.type === PacketId.CarTelemetry2) {
    const t2 = parsed.data.playerCarTelemetry2;
    const aeroStr = t2.activeAeroMode === 1 ? '\x1b[32mRETA (X)\x1b[0m' : '\x1b[36mCURVA (Z)\x1b[0m';
    const ovtkStr = t2.overtakeActive
      ? '\x1b[35mOVERTAKE ATIVO\x1b[0m'
      : t2.overtakeAvailable
      ? `\x1b[33mDISPONÍVEL (<1s)\x1b[0m`
      : 'OFF';
    process.stdout.write(
      ` | \x1b[1mAero 2026:\x1b[0m ${aeroStr} | \x1b[1mOvertake (1s):\x1b[0m ${ovtkStr}`
    );
  }
});

socket.bind(PORT, HOST, () => {
  console.log(`Socket pronto e aguardando na porta ${PORT}\n`);
});
