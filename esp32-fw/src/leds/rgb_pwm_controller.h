#pragma once
#include <Arduino.h>
#include "../effects/effect_types.h"
#include "../config/pins.h"

namespace Leds {

class RgbPwmController {
public:
    RgbPwmController();

    void begin();
    void setColor(const Effects::ColorRGB& color);
    Effects::ColorRGB getColor() const { return currentColor_; }

    void setBrightness(uint8_t brightness);
    uint8_t getBrightness() const { return brightness_; }

    void off();

    // Aplica correção de gama para resposta linear do olho humano
    static uint8_t applyGamma(uint8_t val);

private:
    void applyHardwareOutputs();

    Effects::ColorRGB currentColor_ = Effects::ColorRGB::Black();
    uint8_t brightness_ = 255;
    uint16_t lastDutyR_ = 0xFFFF;
    uint16_t lastDutyG_ = 0xFFFF;
    uint16_t lastDutyB_ = 0xFFFF;
};

} // namespace Leds
