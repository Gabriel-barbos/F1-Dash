import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  LightingStateBuilder,
  Esp32LightingBridge
} from '../src/modules/lighting/index.js';
import {
  INITIAL_COCKPIT_TELEMETRY_STATE,
  CockpitTelemetryState,
  Weather,
  SafetyCarStatus,
  PitStatus
} from '@f1-dash/telemetry-core';

describe('ESP32 Lighting Module — State & Event Dispatcher (WLED Ready)', () => {
  const builder = new LightingStateBuilder();

  test('deve detectar dia (branco quente) e clima ensolarado como base', () => {
    const telemetry: CockpitTelemetryState = {
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      trackTemperature: 32,
      weather: Weather.Clear
    };

    const state = builder.buildState(telemetry);
    assert.strictEqual(state.ambient, 'DAY');
    assert.strictEqual(state.weather, 'CLEAR');
    assert.strictEqual(state.trackStatus, 'CLEAR');
    assert.strictEqual(state.isCrash, false);
  });

  test('deve detectar noite (branco frio) para pistas frias ou noturnas (< 26°C)', () => {
    const telemetry: CockpitTelemetryState = {
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      trackTemperature: 22,
      weather: Weather.Clear
    };

    const state = builder.buildState(telemetry);
    assert.strictEqual(state.ambient, 'NIGHT');
  });

  test('deve detectar chuva (efeito gotas) quando clima for LightRain ou HeavyRain', () => {
    const telemetry: CockpitTelemetryState = {
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      weather: Weather.HeavyRain
    };

    const state = builder.buildState(telemetry);
    assert.strictEqual(state.weather, 'RAIN');
  });

  test('deve detectar modo ultrapassagem (overtake) para animação azul', () => {
    const telemetry: CockpitTelemetryState = {
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      overtakeActive: true
    };

    const state = builder.buildState(telemetry);
    assert.strictEqual(state.overtake, true);
  });

  test('deve detectar modo de reta X-MODE para animação speed roxa', () => {
    const telemetry: CockpitTelemetryState = {
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      activeAeroMode: 1
    };

    const state = builder.buildState(telemetry);
    assert.strictEqual(state.activeAero, 'X_MODE_STRAIGHT');
  });

  test('deve detectar bandeira amarela ou Safety Car', () => {
    const telemetry: CockpitTelemetryState = {
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      safetyCarStatus: SafetyCarStatus.Full
    };

    const state = builder.buildState(telemetry);
    assert.strictEqual(state.trackStatus, 'SAFETY_CAR');
  });

  test('deve detectar bandeira vermelha', () => {
    const telemetry: CockpitTelemetryState = {
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      isRedFlagActive: true
    };

    const state = builder.buildState(telemetry);
    assert.strictEqual(state.trackStatus, 'RED');
  });

  test('deve detectar batida violenta (isCrash)', () => {
    const crashBuilder = new LightingStateBuilder();
    // Vinha rápido
    crashBuilder.buildState({
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      speed: 180,
      frontLeftWingDamage: 0
    });

    // Bateu e parou
    const state = crashBuilder.buildState({
      ...INITIAL_COCKPIT_TELEMETRY_STATE,
      speed: 10,
      brake: 0.1,
      frontLeftWingDamage: 25
    });

    assert.strictEqual(state.isCrash, true);
  });

  test('Esp32LightingBridge deve inicializar e expor status com transporte UDP/WLED', async () => {
    const bridge = new Esp32LightingBridge({
      ipAddress: '192.168.0.200',
      port: 4210,
      transport: 'UDP'
    });

    const ok = await bridge.connect();
    assert.strictEqual(ok, true);
    assert.strictEqual(bridge.getStatus().connected, true);
    assert.strictEqual(bridge.getStatus().ipAddress, '192.168.0.200');

    await bridge.disconnect();
    assert.strictEqual(bridge.getStatus().connected, false);
  });
});
