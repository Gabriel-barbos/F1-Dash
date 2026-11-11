#pragma once
#include <Arduino.h>
#include "../effects/effect_types.h"
#include "../leds/led_controller.h"

namespace Modes {

enum class AmbientColorPreset : uint8_t {
    WARM_WHITE = 0,
    COLD_WHITE,
    NATURAL_WHITE,
    SUNSET_GOLD,
    CYAN_CHILL,
    DEEP_PURPLE,
    CUSTOM,
    OFF
};

class AmbientModeController {
public:
    AmbientModeController(Leds::ILedController& ledController);

    void begin();
    void update(uint32_t nowMs, float transitionProgress);

    void setPreset(AmbientColorPreset preset);
    void setCustomColor(const Effects::ColorRGBCCT& digitalColor, const Effects::ColorRGB& analogColor);
    void setBrightness(uint8_t brightness);

    AmbientColorPreset getCurrentPreset() const { return currentPreset_; }
    uint8_t getBrightness() const { return brightness_; }

private:
    Leds::ILedController& leds_;
    AmbientColorPreset currentPreset_ = AmbientColorPreset::WARM_WHITE;

    Effects::ColorRGBCCT activeDigitalColor_ = Effects::ColorRGBCCT::WarmWhite(210);
    Effects::ColorRGB activeAnalogColor_     = Effects::ColorRGB::WarmWhite(180);

    uint8_t brightness_ = 200;
};

} // namespace Modes
