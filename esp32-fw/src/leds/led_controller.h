#pragma once
#include <Arduino.h>
#include "../effects/effect_types.h"
#include "ws2805_controller.h"
#include "rgb_pwm_controller.h"

namespace Leds {

class ILedController {
public:
    virtual ~ILedController() = default;

    virtual void begin() = 0;
    virtual void clear() = 0;
    virtual void show() = 0;

    // Fita Analógica RGB (12V MOSFET)
    virtual void setAnalogRgb(const Effects::ColorRGB& color) = 0;
    virtual Effects::ColorRGB getAnalogRgb() const = 0;

    // Fitas Digitais WS2805 (24V RGBCCT)
    virtual void setLeftPixel(uint16_t index, const Effects::ColorRGBCCT& color) = 0;
    virtual void setRightPixel(uint16_t index, const Effects::ColorRGBCCT& color) = 0;
    virtual Effects::ColorRGBCCT getLeftPixel(uint16_t index) const = 0;
    virtual Effects::ColorRGBCCT getRightPixel(uint16_t index) const = 0;

    // Métodos de conveniência em bloco
    virtual void fillLeft(const Effects::ColorRGBCCT& color) = 0;
    virtual void fillRight(const Effects::ColorRGBCCT& color) = 0;
    virtual void fillBoth(const Effects::ColorRGBCCT& color) = 0;
    virtual void fillAll(const Effects::ColorRGBCCT& digitalColor, const Effects::ColorRGB& analogColor) = 0;

    // Brilho mestre
    virtual void setBrightness(uint8_t brightness) = 0;
    virtual uint8_t getBrightness() const = 0;

    // Quantidade de LEDs
    virtual uint16_t getLeftCount() const = 0;
    virtual uint16_t getRightCount() const = 0;
};

// -------------------------------------------------------------
// Implementação concreta Master que encapsula o hardware real
// -------------------------------------------------------------
class MasterLedController : public ILedController {
public:
    MasterLedController();

    void begin() override;
    void clear() override;
    void show() override;

    void setAnalogRgb(const Effects::ColorRGB& color) override;
    Effects::ColorRGB getAnalogRgb() const override;

    void setLeftPixel(uint16_t index, const Effects::ColorRGBCCT& color) override;
    void setRightPixel(uint16_t index, const Effects::ColorRGBCCT& color) override;
    Effects::ColorRGBCCT getLeftPixel(uint16_t index) const override;
    Effects::ColorRGBCCT getRightPixel(uint16_t index) const override;

    void fillLeft(const Effects::ColorRGBCCT& color) override;
    void fillRight(const Effects::ColorRGBCCT& color) override;
    void fillBoth(const Effects::ColorRGBCCT& color) override;
    void fillAll(const Effects::ColorRGBCCT& digitalColor, const Effects::ColorRGB& analogColor) override;

    void setBrightness(uint8_t brightness) override;
    uint8_t getBrightness() const override;

    uint16_t getLeftCount() const override;
    uint16_t getRightCount() const override;

    // Acesso aos controladores individuais
    Ws2805Controller& getWs2805() { return ws2805_; }
    RgbPwmController& getPwm() { return pwm_; }

private:
    Ws2805Controller ws2805_;
    RgbPwmController pwm_;
    uint8_t masterBrightness_ = 255;
};

extern MasterLedController masterLedController;

} // namespace Leds
