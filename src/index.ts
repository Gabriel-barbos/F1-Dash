/**
 * F1 25 Dash - Ponto de Entrada Principal da Aplicação
 *
 * Módulos do Sistema:
 * - Telemetry Core: Modelos, parsers DataView, normalização e TelemetryStore
 * - UDP Engine: Receptor de telemetria nativo UDP
 * - Race Engineer: Cérebro do engenheiro de corrida, prompts, IA Gemini e áudio DSP
 * - Lighting (ESP32): Integração e controle de LEDs para o simulador
 */

export * from '@f1-dash/telemetry-core';
export * from './modules/udp-engine/index.js';
export * from './modules/race-engineer/index.js';
export * from './modules/lighting/esp32-bridge.js';
