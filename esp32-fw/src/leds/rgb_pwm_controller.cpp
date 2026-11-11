#include "rgb_pwm_controller.h"
#include <esp_arduino_version.h>

namespace Leds {

// Tabela de curva gama (2.2) para resposta suave de luminosidade
static const uint8_t PROGMEM GAMMA_TABLE[256] = {
    0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   1,   1,   1,   1,   1,   1,
    1,   1,   1,   2,   2,   2,   2,   2,   2,   3,   3,   3,   3,   4,   4,   4,
    4,   5,   5,   5,   5,   6,   6,   6,   7,   7,   7,   8,   8,   8,   9,   9,
    9,  10,  10,  11,  11,  11,  12,  12,  13,  13,  14,  14,  15,  15,  16,  16,
    17,  17,  18,  18,  19,  19,  20,  20,  21,  22,  22,  23,  23,  24,  25,  25,
    26,  26,  27,  28,  28,  29,  30,  30,  31,  32,  32,  33,  34,  35,  35,  36,
    37,  38,  38,  39,  40,  41,  42,  42,  43,  44,  45,  46,  47,  47,  48,  49,
    50,  51,  52,  53,  54,  55,  56,  56,  57,  58,  59,  60,  61,  62,  63,  64,
    65,  66,  67,  68,  70,  71,  72,  73,  74,  75,  76,  77,  78,  80,  81,  82,
    83,  84,  86,  87,  88,  89,  91,  92,  93,  94,  96,  97,  98, 100, 101, 102,
    104, 105, 106, 108, 109, 110, 112, 113, 115, 116, 118, 119, 121, 122, 124, 125,
    127, 128, 130, 131, 133, 135, 136, 138, 139, 141, 143, 144, 146, 148, 149, 151,
    153, 155, 156, 158, 160, 162, 164, 165, 167, 169, 171, 173, 175, 177, 179, 181,
    183, 185, 187, 189, 191, 193, 195, 197, 199, 201, 203, 205, 207, 210, 212, 214,
    216, 218, 221, 223, 225, 228, 230, 232, 235, 237, 239, 242, 244, 247, 249, 252,
    254, 255
};

RgbPwmController::RgbPwmController() {}

uint8_t RgbPwmController::applyGamma(uint8_t val) {
    return pgm_read_byte(&GAMMA_TABLE[val]);
}

void RgbPwmController::begin() {
#if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
    // ESP32 Arduino Core 3.x API com canais explícitos dedicados
    ledcAttachChannel(Config::Pins::RGB_RED_PIN, Config::Pins::PWM_FREQUENCY, Config::Pins::PWM_RESOLUTION, Config::Pins::LEDC_RED_CHANNEL);
    ledcAttachChannel(Config::Pins::RGB_GREEN_PIN, Config::Pins::PWM_FREQUENCY, Config::Pins::PWM_RESOLUTION, Config::Pins::LEDC_GREEN_CHANNEL);
    ledcAttachChannel(Config::Pins::RGB_BLUE_PIN, Config::Pins::PWM_FREQUENCY, Config::Pins::PWM_RESOLUTION, Config::Pins::LEDC_BLUE_CHANNEL);
#else
    // ESP32 Arduino Core 2.x API
    ledcSetup(Config::Pins::LEDC_RED_CHANNEL, Config::Pins::PWM_FREQUENCY, Config::Pins::PWM_RESOLUTION);
    ledcSetup(Config::Pins::LEDC_GREEN_CHANNEL, Config::Pins::PWM_FREQUENCY, Config::Pins::PWM_RESOLUTION);
    ledcSetup(Config::Pins::LEDC_BLUE_CHANNEL, Config::Pins::PWM_FREQUENCY, Config::Pins::PWM_RESOLUTION);

    ledcAttachPin(Config::Pins::RGB_RED_PIN, Config::Pins::LEDC_RED_CHANNEL);
    ledcAttachPin(Config::Pins::RGB_GREEN_PIN, Config::Pins::LEDC_GREEN_CHANNEL);
    ledcAttachPin(Config::Pins::RGB_BLUE_PIN, Config::Pins::LEDC_BLUE_CHANNEL);
#endif

    off();
    Serial.println("[RGB PWM] Controlador analógico 12V inicializado");
}

void RgbPwmController::setColor(const Effects::ColorRGB& color) {
    currentColor_ = color;
    applyHardwareOutputs();
}

void RgbPwmController::setBrightness(uint8_t brightness) {
    brightness_ = brightness;
    applyHardwareOutputs();
}

void RgbPwmController::off() {
    currentColor_ = Effects::ColorRGB::Black();
    applyHardwareOutputs();
}

void RgbPwmController::applyHardwareOutputs() {
    uint8_t dutyR = 0;
    uint8_t dutyG = 0;
    uint8_t dutyB = 0;

    if (brightness_ > 0) {
        uint8_t maxCh = currentColor_.r;
        if (currentColor_.g > maxCh) maxCh = currentColor_.g;
        if (currentColor_.b > maxCh) maxCh = currentColor_.b;

        if (maxCh > 0) {
            // Normaliza sempre para potência máxima (254) preservando a proporção exata da cor
            dutyR = static_cast<uint8_t>((static_cast<uint16_t>(currentColor_.r) * 254) / maxCh);
            dutyG = static_cast<uint8_t>((static_cast<uint16_t>(currentColor_.g) * 254) / maxCh);
            dutyB = static_cast<uint8_t>((static_cast<uint16_t>(currentColor_.b) * 254) / maxCh);
        }
    }

    // Ajusta polaridade se não for active-high
    if (!Config::Pins::PWM_ACTIVE_HIGH) {
        dutyR = 254 - dutyR;
        dutyG = 254 - dutyG;
        dutyB = 254 - dutyB;
    }

    // Só atualiza os registradores de hardware se o duty cycle realmente mudou
    if (dutyR == lastDutyR_ && dutyG == lastDutyG_ && dutyB == lastDutyB_) {
        return;
    }
    lastDutyR_ = dutyR;
    lastDutyG_ = dutyG;
    lastDutyB_ = dutyB;

#if ESP_ARDUINO_VERSION >= ESP_ARDUINO_VERSION_VAL(3, 0, 0)
    ledcWrite(Config::Pins::RGB_RED_PIN, dutyR);
    ledcWrite(Config::Pins::RGB_GREEN_PIN, dutyG);
    ledcWrite(Config::Pins::RGB_BLUE_PIN, dutyB);
#else
    ledcWrite(Config::Pins::LEDC_RED_CHANNEL, dutyR);
    ledcWrite(Config::Pins::LEDC_GREEN_CHANNEL, dutyG);
    ledcWrite(Config::Pins::LEDC_BLUE_CHANNEL, dutyB);
#endif
}

} // namespace Leds
