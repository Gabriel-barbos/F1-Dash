import { test, describe } from 'node:test';
import assert from 'node:assert';
import {
  EngineerBrain,
  GeminiEngineerClient,
  DEFAULT_RACE_ENGINEER_CONFIG
} from '../src/modules/race-engineer';
import {
  INITIAL_RACE_STATE,
  RaceState,
  RaceEvent
} from '@f1-dash/telemetry-core';

describe('Race Engineer - Claudinho Ronaldo & Engineer Brain', () => {
  test('deve inicializar com o perfil do Claudinho Ronaldo e tema terracota', () => {
    assert.strictEqual(DEFAULT_RACE_ENGINEER_CONFIG.personality.name, 'Claudinho Ronaldo');
    assert.strictEqual(DEFAULT_RACE_ENGINEER_CONFIG.personality.driverName, 'Gabriel');
    assert.strictEqual(DEFAULT_RACE_ENGINEER_CONFIG.personality.theme.primaryTerracotta, '#E05A36');
  });

  test('EngineerBrain deve aprovar evento CRITICAL de Safety Car imediatamente', () => {
    const brain = new EngineerBrain(DEFAULT_RACE_ENGINEER_CONFIG);
    const mockEvent: RaceEvent = {
      id: 'sc-1',
      type: 'SAFETY_CAR',
      timestamp: Date.now(),
      sessionTime: 120,
      frameId: 100,
      data: {}
    };

    const decision = brain.evaluateRaceEvent(mockEvent, INITIAL_RACE_STATE);
    assert.strictEqual(decision.shouldTriggerGemini, true);
    assert.strictEqual(decision.priority, 'CRITICAL');
    assert.strictEqual(decision.context?.engineerName, 'Claudinho Ronaldo');
    assert.strictEqual(decision.context?.driverName, 'Gabriel');
  });

  test('EngineerBrain deve aprovar ultrapassagem (OVERTAKE) com prioridade HIGH', () => {
    const brain = new EngineerBrain(DEFAULT_RACE_ENGINEER_CONFIG);
    const mockEvent: RaceEvent = {
      id: 'ovtk-1',
      type: 'OVERTAKE',
      timestamp: Date.now(),
      sessionTime: 240,
      frameId: 250,
      data: {}
    };

    const decision = brain.evaluateRaceEvent(mockEvent, INITIAL_RACE_STATE);
    assert.strictEqual(decision.shouldTriggerGemini, true);
    assert.strictEqual(decision.priority, 'HIGH');
    assert.strictEqual(decision.context?.event, 'OVERTAKE');
  });

  test('CooldownManager deve suprimir mensagens repetidas em intervalos curtos', () => {
    const brain = new EngineerBrain(DEFAULT_RACE_ENGINEER_CONFIG);
    const mockEvent: RaceEvent = {
      id: 'ovtk-1',
      type: 'OVERTAKE',
      timestamp: Date.now(),
      sessionTime: 240,
      frameId: 250,
      data: {}
    };

    // Primeira avaliação -> Aprovado
    const decision1 = brain.evaluateRaceEvent(mockEvent, INITIAL_RACE_STATE);
    assert.strictEqual(decision1.shouldTriggerGemini, true);

    // Registra que a fala ocorreu
    brain.onMessageSpoken(
      { shouldSpeak: true, message: 'Boa!', tone: 'celebratory', category: 'overtake', priority: 'HIGH' },
      'OVERTAKE'
    );

    // Segunda avaliação imediata -> Bloqueado por Cooldown
    const decision2 = brain.evaluateRaceEvent(mockEvent, INITIAL_RACE_STATE);
    assert.strictEqual(decision2.shouldTriggerGemini, false);
    assert.match(decision2.reason, /cooldown|recentemente|Limite/i);
  });

  test('GeminiEngineerClient deve gerar falas autênticas do Claudinho Ronaldo', async () => {
    const client = new GeminiEngineerClient(DEFAULT_RACE_ENGINEER_CONFIG.ai);
    const result = await client.generateRadioMessage({
      event: 'OVERTAKE',
      priority: 'HIGH',
      lap: 12,
      totalLaps: 50,
      position: 3,
      driverName: 'Gabriel',
      engineerName: 'Claudinho Ronaldo',
      speedKmH: 290
    });

    assert.strictEqual(result.shouldSpeak, true);
    assert.strictEqual(result.priority, 'HIGH');
    assert.ok(result.message.length > 5);
    assert.match(result.message, /Gabriel|moleque|Boa/i);
  });
});
