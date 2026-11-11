/**
 * G7 Desk F1 Smart Lighting — Teste de Validação de Payloads e Contrato UDP
 * Executa testes automatizados contra o contrato de telemetria do F1-Dash.
 * 
 * Execução:
 *   node test/test_payload_validation.js
 */

import assert from 'node:assert/strict';

console.log('\x1b[36m================================================================');
console.log(' G7 Desk F1 Smart Lighting — Suíte de Testes do Contrato UDP');
console.log('================================================================\x1b[0m\n');

let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
    try {
        fn();
        console.log(`  \x1b[32m✔ [PASS]\x1b[0m ${name}`);
        passedTests++;
    } catch (err) {
        console.error(`  \x1b[31m✘ [FAIL]\x1b[0m ${name}`);
        console.error(`     Erro: ${err.message}`);
        failedTests++;
    }
}

// -------------------------------------------------------------
// Simulação da lógica de parse e prioridades do Firmware
// -------------------------------------------------------------
function parseAmbient(str) {
    if (!str) return 'DAY';
    if (str === 'NIGHT') return 'NIGHT';
    return 'DAY';
}

function parseWeather(str) {
    if (!str) return 'CLEAR';
    if (str === 'RAIN') return 'RAIN';
    if (str === 'STORM') return 'STORM';
    if (str === 'CLOUDY') return 'CLOUDY';
    return 'CLEAR';
}

function parseTrackStatus(str) {
    if (!str) return 'CLEAR';
    if (str === 'GREEN') return 'GREEN';
    if (str === 'YELLOW') return 'YELLOW';
    if (str === 'RED') return 'RED';
    if (str === 'SAFETY_CAR') return 'SAFETY_CAR';
    if (str === 'VSC') return 'VSC';
    if (str === 'CHEQUERED') return 'CHEQUERED';
    return 'CLEAR';
}

function evaluatePriority(state, isCrashTimerActive) {
    if (isCrashTimerActive || state.isCrash) return 'INCIDENT_CRASH';
    if (state.trackStatus === 'RED') return 'FLAG_RED';
    if (state.engineBlown) return 'INCIDENT_ENGINE_BLOWN';
    if (state.trackStatus === 'SAFETY_CAR') return 'SAFETY_CAR';
    if (state.trackStatus === 'VSC') return 'VSC';
    if (state.trackStatus === 'YELLOW') return 'FLAG_YELLOW';
    if (state.pitLimiter || state.inPits) return 'PIT_LANE';
    if (state.overtake) return 'OVERTAKE_BOOST';
    if (state.activeAero === 'X_MODE_STRAIGHT' || state.drsActive) return 'ACTIVE_AERO_STRAIGHT';
    if (state.chequeredFlag || state.trackStatus === 'CHEQUERED') return 'CHEQUERED_VICTORY';
    if (state.weather === 'STORM') return 'WEATHER_STORM';
    if (state.weather === 'RAIN') return 'WEATHER_RAIN';
    if (state.ambient === 'NIGHT') return 'AMBIENT_NIGHT';
    return 'AMBIENT_DAY';
}

// -------------------------------------------------------------
// Testes
// -------------------------------------------------------------

runTest('1. Parse de Ambiente: Dia e Noite com fallback resiliente', () => {
    assert.strictEqual(parseAmbient('DAY'), 'DAY');
    assert.strictEqual(parseAmbient('NIGHT'), 'NIGHT');
    assert.strictEqual(parseAmbient('UNKNOWN_VAL'), 'DAY');
    assert.strictEqual(parseAmbient(null), 'DAY');
});

runTest('2. Parse de Clima: CLEAR, CLOUDY, RAIN, STORM', () => {
    assert.strictEqual(parseWeather('CLEAR'), 'CLEAR');
    assert.strictEqual(parseWeather('CLOUDY'), 'CLOUDY');
    assert.strictEqual(parseWeather('RAIN'), 'RAIN');
    assert.strictEqual(parseWeather('STORM'), 'STORM');
    assert.strictEqual(parseWeather('SNOW'), 'CLEAR'); // Fallback seguro
});

runTest('3. Prioridade Crítica: Batida (Crash) deve sobrepor Chuva e Safety Car', () => {
    const state = {
        isCrash: true,
        weather: 'RAIN',
        trackStatus: 'SAFETY_CAR',
        overtake: true
    };
    const active = evaluatePriority(state, false);
    assert.strictEqual(active, 'INCIDENT_CRASH');
});

runTest('4. Recuperação Pós-Batida: Ao fim do timer de impacto, deve retornar para Chuva', () => {
    const state = {
        isCrash: false, // Timer de crash expirou
        weather: 'RAIN',
        trackStatus: 'CLEAR',
        overtake: false
    };
    const active = evaluatePriority(state, false);
    assert.strictEqual(active, 'WEATHER_RAIN');
});

runTest('5. Prioridade de Segurança: Safety Car deve sobrepor Overtake e Active Aero', () => {
    const state = {
        isCrash: false,
        trackStatus: 'SAFETY_CAR',
        overtake: true,
        activeAero: 'X_MODE_STRAIGHT'
    };
    const active = evaluatePriority(state, false);
    assert.strictEqual(active, 'SAFETY_CAR');
});

runTest('6. Prioridade de Potência: Overtake deve sobrepor Active Aero e Chuva', () => {
    const state = {
        isCrash: false,
        trackStatus: 'CLEAR',
        overtake: true,
        activeAero: 'X_MODE_STRAIGHT',
        weather: 'RAIN'
    };
    const active = evaluatePriority(state, false);
    assert.strictEqual(active, 'OVERTAKE_BOOST');
});

runTest('7. Prioridade de Velocidade: Active Aero X-Mode deve sobrepor Chuva', () => {
    const state = {
        isCrash: false,
        trackStatus: 'CLEAR',
        overtake: false,
        activeAero: 'X_MODE_STRAIGHT',
        weather: 'RAIN'
    };
    const active = evaluatePriority(state, false);
    assert.strictEqual(active, 'ACTIVE_AERO_STRAIGHT');
});

runTest('8. Resiliência JSON: Payload com campos ausentes não quebra o sistema', () => {
    const minimalPayload = JSON.stringify({
        ambient: 'NIGHT'
    });
    const parsed = JSON.parse(minimalPayload);
    assert.strictEqual(parsed.ambient, 'NIGHT');
    assert.strictEqual(parsed.weather, undefined);
    // Valida fallback
    assert.strictEqual(parseWeather(parsed.weather), 'CLEAR');
});

runTest('9. Serialização e Deserialização do Payload Oficial do F1-Dash', () => {
    const officialPayload = {
        ambient: 'DAY',
        weather: 'RAIN',
        trackTempCelsius: 24,
        trackStatus: 'YELLOW',
        chequeredFlag: false,
        overtake: true,
        activeAero: 'X_MODE_STRAIGHT',
        drsActive: true,
        drsAllowed: true,
        pitLimiter: false,
        inPits: false,
        isCrash: false,
        engineBlown: false,
        rpmPercent: 92,
        revLightsPercent: 94,
        shiftFlash: false,
        timestamp: 1740000000000
    };

    const jsonStr = JSON.stringify(officialPayload);
    assert.ok(jsonStr.length > 50);
    assert.ok(jsonStr.length < 1000);

    const decoded = JSON.parse(jsonStr);
    assert.strictEqual(decoded.trackStatus, 'YELLOW');
    assert.strictEqual(decoded.overtake, true);
    assert.strictEqual(decoded.revLightsPercent, 94);
});

console.log('\n----------------------------------------------------------------');
console.log(`Resultado da Suíte: ${passedTests} aprovados, ${failedTests} falhas.`);
console.log('----------------------------------------------------------------\n');

if (failedTests > 0) {
    process.exit(1);
}
