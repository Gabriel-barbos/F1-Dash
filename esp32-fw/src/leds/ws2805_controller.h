#pragma once
#include <Arduino.h>
#include <NeoPixelBus.h>
#include "../effects/effect_types.h"
#include "../config/pins.h"
#include "../config/firmware_config.h"

namespace Leds {

class Ws2805Controller {
public:
    Ws2805Controller();
    ~Ws2805Controller();

    void begin();
    void clear();
    void show();

    // Controle individual por fita
    void setLeftPixel(uint16_t index, const Effects::ColorRGBCCT& color);
    void setRightPixel(uint16_t index, const Effects::ColorRGBCCT& color);

    Effects::ColorRGBCCT getLeftPixel(uint16_t index) const;
    Effects::ColorRGBCCT getRightPixel(uint16_t index) const;

    void fillLeft(const Effects::ColorRGBCCT& color);
    void fillRight(const Effects::ColorRGBCCT& color);
    void fillBoth(const Effects::ColorRGBCCT& color);

    void setBrightness(uint8_t brightness);
    uint8_t getBrightness() const { return brightness_; }

    uint16_t getLeftCount() const { return leftCount_; }
    uint16_t getRightCount() const { return rightCount_; }

    // Helpers de mapeamento espacial
    void setInvertLeft(bool invert) { invertLeft_ = invert; }
    void setInvertRight(bool invert) { invertRight_ = invert; }

private:
    uint16_t mapLeftIndex(uint16_t idx) const;
    uint16_t mapRightIndex(uint16_t idx) const;

    uint16_t leftCount_  = Config::Firmware::DEFAULT_LEFT_LEDS_COUNT;
    uint16_t rightCount_ = Config::Firmware::DEFAULT_RIGHT_LEDS_COUNT;

    bool invertLeft_  = Config::Firmware::INVERT_LEFT_DIRECTION;
    bool invertRight_ = Config::Firmware::INVERT_RIGHT_DIRECTION;

    uint8_t brightness_ = Config::Firmware::DEFAULT_BRIGHTNESS;

    // Instâncias do NeoPixelBus utilizando canais RMT dedicados independentes (Ordem física WS2805: GRB + WW + CW)
    NeoPixelBus<NeoGrbwwFeature, NeoEsp32Rmt0Ws2805Method>* stripLeft_ = nullptr;
    NeoPixelBus<NeoGrbwwFeature, NeoEsp32Rmt1Ws2805Method>* stripRight_ = nullptr;

    // Buffers em memória para consulta e pré-escala
    Effects::ColorRGBCCT* leftBuffer_ = nullptr;
    Effects::ColorRGBCCT* rightBuffer_ = nullptr;
    uint32_t lastForceRefreshMs_ = 0;
};

} // namespace Leds
