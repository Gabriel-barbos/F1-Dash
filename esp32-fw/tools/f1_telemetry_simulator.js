/**
 * G7 Desk F1 Smart Lighting — Telemetry Simulator & Test Injector
 * 
 * Este utilitário de teste envia pacotes UDP no contrato exato do F1-Dash
 * para validar o firmware do ESP32 na rede local sem depender do PlayStation 5.
 * 
 * Uso:
 *   node tools/f1_telemetry_simulator.js [IP_DO_ESP32] [CENARIO]
 * 
 * Cenários disponíveis:
 *   - normal      (Dia claro, ritmo normal de corrida)
 *   - rain        (Chuva dinâmica)
 *   - storm       (Tempestade com relâmpagos)
 *   - overtake    (Ultrapassagem com fluxo azul)
 *   - speed       (Active Aero modo reta roxo)
 *   - safetycar   (Safety Car com pulsação amarela)
 *   - vsc         (Virtual Safety Car)
 *   - redflag     (Bandeira vermelha com flash de emergência)
 *   - pit         (Entrada nos boxes e limitador de pit)
 *   - crash       (Batida violenta de 3.5s + recuperação para chuva)
 *   - engine      (Motor quebrado com alerta vermelho lento)
 *   - victory     (Bandeira quadriculada de final de prova)
 *   - shift       (Ponto de troca de marcha)
 */

import dgram from 'node:dgram';

const targetIp = process.argv[2] || '127.0.0.1';
const scenario = (process.argv[3] || 'normal').toLowerCase();
const targetPort = 4210;

const client = dgram.createSocket('udp4');

console.log(`\x1b[36m=======================================================`);
console.log(`   G7 F1 Smart Lighting — Simulador de Telemetria UDP  `);
console.log(`=======================================================\x1b[0m`);
console.log(`Destino: ${targetIp}:${targetPort}`);
console.log(`Cenário: ${scenario.toUpperCase()}\n`);

function createPayload(scen) {
    const base = {
        ambient: 'DAY',
        weather: 'CLEAR',
        trackTempCelsius: 32,
        trackStatus: 'CLEAR',
        chequeredFlag: false,
        overtake: false,
        activeAero: 'OFF',
        drsActive: false,
        drsAllowed: false,
        pitLimiter: false,
        inPits: false,
        isCrash: false,
        engineBlown: false,
        rpmPercent: 75,
        revLightsPercent: 78,
        shiftFlash: false,
        timestamp: Date.now()
    };

    switch (scen) {
        case 'rain':
            base.weather = 'RAIN';
            base.trackTempCelsius = 22;
            base.ambient = 'NIGHT';
            break;
        case 'storm':
            base.weather = 'STORM';
            base.trackTempCelsius = 20;
            base.ambient = 'NIGHT';
            break;
        case 'overtake':
            base.overtake = true;
            base.rpmPercent = 98;
            base.revLightsPercent = 96;
            break;
        case 'speed':
            base.activeAero = 'X_MODE_STRAIGHT';
            base.drsActive = true;
            base.rpmPercent = 99;
            break;
        case 'safetycar':
            base.trackStatus = 'SAFETY_CAR';
            base.rpmPercent = 40;
            break;
        case 'vsc':
            base.trackStatus = 'VSC';
            base.rpmPercent = 45;
            break;
        case 'redflag':
            base.trackStatus = 'RED';
            break;
        case 'pit':
            base.inPits = true;
            base.pitLimiter = true;
            base.rpmPercent = 30;
            break;
        case 'crash':
            base.isCrash = true;
            base.weather = 'RAIN'; // Demonstra recuperação para chuva pós-impacto
            break;
        case 'engine':
            base.engineBlown = true;
            base.rpmPercent = 0;
            break;
        case 'victory':
            base.chequeredFlag = true;
            base.trackStatus = 'CHEQUERED';
            break;
        case 'shift':
            base.rpmPercent = 98;
            base.revLightsPercent = 97;
            base.shiftFlash = true;
            break;
        default:
            break;
    }

    return base;
}

let packetsSent = 0;

function sendHeartbeat() {
    const payload = createPayload(scenario);
    const jsonStr = JSON.stringify(payload);
    const buffer = Buffer.from(jsonStr);

    client.send(buffer, 0, buffer.length, targetPort, targetIp, (err) => {
        if (err) {
            console.error('\x1b[31m[Erro]\x1b[0m Falha ao enviar pacote:', err.message);
        } else {
            packetsSent++;
            process.stdout.write(`\r\x1b[32m✔ Pacotes enviados: ${packetsSent} (5 Hz) | Cenário: ${scenario.toUpperCase()} \x1b[0m`);
        }
    });
}

// Dispara a 5 Hz (200ms) conforme especificação do F1-Dash
const interval = setInterval(sendHeartbeat, 200);

process.on('SIGINT', () => {
    clearInterval(interval);
    client.close();
    console.log(`\n\n\x1b[33mSimulador encerrado. Total de pacotes: ${packetsSent}\x1b[0m`);
    process.exit(0);
});
