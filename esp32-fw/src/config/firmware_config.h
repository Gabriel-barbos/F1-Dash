#pragma once
#include <Arduino.h>

namespace Config {
namespace Firmware {

    // -------------------------------------------------------------
    // Densidade e Configuração Física das Fitas WS2805
    // -------------------------------------------------------------
    // Em fitas WS2805 24V com 60 LEDs/metro, normalmente cada CI controla
    // um agrupamento de LEDs (ex: 10 a 20 CIs por metro ou 60 pixels dependendo da fita).
    // Definimos a quantidade lógica de pixels endereçáveis:
    constexpr uint16_t DEFAULT_LEFT_LEDS_COUNT  = 60; // Fita Esquerda (~1m)
    constexpr uint16_t DEFAULT_RIGHT_LEDS_COUNT = 60; // Fita Direita (~1m)

    // Orientação física dos pixels (inverter se o primeiro LED estiver no topo/base)
    constexpr bool INVERT_LEFT_DIRECTION  = false;
    constexpr bool INVERT_RIGHT_DIRECTION = false;

    // -------------------------------------------------------------
    // Taxa de Renderização e Brilho
    // -------------------------------------------------------------
    constexpr uint32_t TARGET_FPS             = 50;  // 50 quadros por segundo
    constexpr uint32_t FRAME_INTERVAL_MS      = 1000 / TARGET_FPS; // 20 ms
    constexpr uint8_t  DEFAULT_BRIGHTNESS     = 200; // 0 a 255
    constexpr uint8_t  MAX_BRIGHTNESS_LIMIT   = 255;

    // -------------------------------------------------------------
    // Timeouts e Duração de Eventos F1 (em milissegundos)
    // -------------------------------------------------------------
    // Heartbeat do F1-Dash é contínuo (~120-150ms). Se ficar sem pacotes por mais
    // de 20.000 ms, o sistema considera fim da sessão / fechamento do simulador.
    // (20s cobre com folga a pausa de 9.24s da cinemática de largada do F1 25)
    constexpr uint32_t F1_TELEMETRY_TIMEOUT_MS = 20000;

    // Duração de eventos transitórios
    constexpr uint32_t CRASH_EFFECT_DURATION_MS       = 3500; // 3.5 segundos de impacto
    constexpr uint32_t GREEN_FLAG_SURGE_DURATION_MS   = 2000; // 2.0 segundos de aceleração verde
    constexpr uint32_t SHIFT_FLASH_DURATION_MS        = 120;  // 120 ms de flash periférico
    constexpr uint32_t CHEQUERED_CYCLE_INTERVAL_MS    = 300;  // Alternância do quadriculado

    // -------------------------------------------------------------
    // Transições de Fade
    // -------------------------------------------------------------
    constexpr uint32_t MODE_TRANSITION_FADE_MS = 600; // 600 ms de fade suave entre modos
    constexpr uint32_t TRANSITION_TO_AMBIENT_MS      = 380; // 380 ms para acalmar suavemente até o branco quente
    constexpr uint32_t TRANSITION_MOTORSPORT_MS      = 120; // 120 ms rápido para entrar em Modo Reta / Overtake
    constexpr uint32_t TRANSITION_INTER_EFFECT_MS    = 250; // 250 ms entre efeitos ativos (ex: Overtake -> Boxes)

} // namespace Firmware
} // namespace Config
