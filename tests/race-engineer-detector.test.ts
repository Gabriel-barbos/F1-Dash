import { test, describe } from 'node:test';
import assert from 'node:assert';
import { RaceEngineerDetector } from '../mobile-app/src/services/race-engineer-detector';
import {
  INITIAL_COCKPIT_TELEMETRY_STATE,
  CockpitTelemetryState,
  SafetyCarStatus,
  PitStatus
} from '@f1-dash/telemetry-core';

describe('RaceEngineerDetector — Automatic Event Detection', () => {
  test('deve inicializar no primeiro pacote sem disparar rádio falso', () => {
    const detector = new RaceEngineerDetector();
    let triggered = false;

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, frontLeftWingDamage: 0 },
      () => {
        triggered = true;
      }
    );

    assert.strictEqual(triggered, false, 'Não deve disparar no primeiro pacote de conexão');
  });

  test('deve disparar rádio DAMAGE automaticamente ao sofrer batida', () => {
    const detector = new RaceEngineerDetector({ cooldownDamageMs: 100 });
    let triggeredScenario: string | null = null;

    // Pacote 1: Conectado sem danos
    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, frontLeftWingDamage: 0 },
      (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, null);

    // Pacote 2: Bateu o carro! Dano de asa subiu para 25%
    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, frontLeftWingDamage: 25 },
      (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, 'DAMAGE', 'Deve disparar DAMAGE imediatamente ao bater');
  });

  test('não deve disparar com pequenas variações de dano (< 4%)', () => {
    const detector = new RaceEngineerDetector();
    let triggeredScenario: string | null = null;

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, frontLeftWingDamage: 10 },
      (sc) => { triggeredScenario = sc; }
    );

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, frontLeftWingDamage: 12 }, // +2%
      (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, null, 'Pequena variação não deve disparar');
  });

  test('deve disparar DAMAGE em batida com desaceleração violenta mesmo com dano do jogo desativado (0%)', () => {
    const detector = new RaceEngineerDetector({ cooldownDamageMs: 100 });
    let triggeredScenario: string | null = null;

    // Vinha a 160 km/h
    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, speed: 160, brake: 0, frontLeftWingDamage: 0 },
      (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, null);

    // Bateu no muro (caiu para 5 km/h sem freio total, dano do jogo desligado)
    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, speed: 5, brake: 0.2, frontLeftWingDamage: 0 },
      (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, 'DAMAGE', 'Deve detectar choque violento contra muro');
  });

  test('deve disparar SAFETY_CAR quando o safety car entrar na pista', () => {
    const detector = new RaceEngineerDetector();
    let triggeredScenario: string | null = null;

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, safetyCarStatus: SafetyCarStatus.None },
      (sc) => { triggeredScenario = sc; }
    );

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, safetyCarStatus: SafetyCarStatus.Full },
      (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, 'SAFETY_CAR', 'Deve disparar SAFETY_CAR');
  });

  test('deve disparar OVERTAKE quando o piloto ganhar posição', () => {
    const detector = new RaceEngineerDetector();
    let triggeredScenario: string | null = null;

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, carPosition: 4 },
      (sc) => { triggeredScenario = sc; }
    );

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, carPosition: 3 }, // Subiu para P3!
      (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, 'OVERTAKE', 'Deve disparar OVERTAKE');
  });

  test('deve disparar PIT_LANE ao entrar nos boxes ou acionar o limitador', () => {
    const detector = new RaceEngineerDetector();
    let triggeredScenario: string | null = null;

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, pitStatus: PitStatus.None, pitLimiterActive: false },
      (sc) => { triggeredScenario = sc; }
    );

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, pitStatus: PitStatus.Pitting, pitLimiterActive: true },
    (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, 'PIT_LANE', 'Deve disparar PIT_LANE');
  });

  test('deve disparar GAP_UPDATE ao completar volta com gap pro carro da frente', () => {
    const detector = new RaceEngineerDetector();
    let triggeredScenario: string | null = null;

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, currentLapNum: 3, deltaToCarInFrontInMS: 1500 },
      (sc) => { triggeredScenario = sc; }
    );

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, currentLapNum: 4, deltaToCarInFrontInMS: 1400 },
      (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, 'GAP_UPDATE', 'Deve disparar GAP_UPDATE');
  });

  test('deve disparar GAP_BEHIND ao completar volta com carro colado atrás (< 1.5s)', () => {
    const detector = new RaceEngineerDetector();
    let triggeredScenario: string | null = null;

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, currentLapNum: 3, deltaToCarBehindInMS: 850 },
      (sc) => { triggeredScenario = sc; }
    );

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, currentLapNum: 4, deltaToCarBehindInMS: 850 },
      (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, 'GAP_BEHIND', 'Deve disparar GAP_BEHIND');
  });

  test('deve disparar CALM_RACE após período de silêncio com carro em velocidade', () => {
    const detector = new RaceEngineerDetector();
    let triggeredScenario: string | null = null;

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, speed: 120 },
      (sc) => { triggeredScenario = sc; }
    );

    // Simula passagem de 50 segundos forçando o relógio interno
    (detector as any).lastGlobalTriggerTime = Date.now() - 50000;

    detector.evaluate(
      { ...INITIAL_COCKPIT_TELEMETRY_STATE, connected: true, speed: 180 },
      (sc) => { triggeredScenario = sc; }
    );
    assert.strictEqual(triggeredScenario, 'CALM_RACE', 'Deve disparar CALM_RACE');
  });
});
