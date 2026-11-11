#pragma once
#include <Arduino.h>

namespace Config {
namespace Pins {

    // -------------------------------------------------------------
    // Fita RGB Analógica 12V (Acionamento por MOSFET)
    // -------------------------------------------------------------
    constexpr uint8_t RGB_RED_PIN   = 32;
    constexpr uint8_t RGB_GREEN_PIN = 27;
    constexpr uint8_t RGB_BLUE_PIN  = 26;

    // Canais LEDC do ESP32 para controle PWM
    constexpr uint8_t LEDC_RED_CHANNEL   = 0;
    constexpr uint8_t LEDC_GREEN_CHANNEL = 1;
    constexpr uint8_t LEDC_BLUE_CHANNEL  = 2;

    // Configuração PWM
    constexpr uint32_t PWM_FREQUENCY     = 5000; // 5 kHz (sem ruído audível e sem cintilação)
    constexpr uint8_t  PWM_RESOLUTION    = 8;    // 8 bits (0 - 255)

    // Polaridade do MOSFET: 
    // true  = Canal N padrão (HIGH satura MOSFET -> drena para GND -> LED LIGA)
    // false = Lógica invertida
    constexpr bool PWM_ACTIVE_HIGH       = true;

    // -------------------------------------------------------------
    // Fitas WS2805 RGB+CCT 24V (Saídas de Dados Independentes)
    // -------------------------------------------------------------
    // Conectadas aos pinos de entrada do level shifter 74AHCT125 (3.3V -> 5V)
    constexpr uint8_t WS2805_LEFT_DATA_PIN  = 18; // Fita Esquerda do Monitor
    constexpr uint8_t WS2805_RIGHT_DATA_PIN = 21; // Fita Direita do Monitor

} // namespace Pins
} // namespace Config
