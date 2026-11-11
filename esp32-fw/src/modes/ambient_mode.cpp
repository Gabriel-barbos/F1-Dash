#include "ambient_mode.h"
#include <math.h>

namespace Modes {

AmbientModeController::AmbientModeController(Leds::ILedController& ledController)
    : leds_(ledController) {}

void AmbientModeController::begin() {
    setBrightness(brightness_);
    setPreset(AmbientColorPreset::WARM_WHITE);
    Serial.println("[Ambient Mode] Controlador convencional ativo");
}

void AmbientModeController::setPreset(AmbientColorPreset preset) {
    currentPreset_ = preset;

    switch (preset) {
        case AmbientColorPreset::WARM_WHITE:
            activeDigitalColor_ = Effects::ColorRGBCCT::WarmWhite(255); // Diodos físicos WW de alto CRI
            activeAnalogColor_  = Effects::ColorRGB(255, 85, 0);         // Backlight laranja/âmbar em potência máxima
            break;
        case AmbientColorPreset::COLD_WHITE:
            activeDigitalColor_ = Effects::ColorRGBCCT::ColdWhite(255); // Diodos físicos CW de alto CRI
            activeAnalogColor_  = Effects::ColorRGB(0, 85, 255);         // Backlight azul claro em potência máxima
            break;
        case AmbientColorPreset::NATURAL_WHITE:
            activeDigitalColor_ = Effects::ColorRGBCCT::NeutralWhite(255); // WW + CW equilibrados
            activeAnalogColor_  = Effects::ColorRGB(255, 95, 0);           // Backlight âmbar em potência máxima
            break;
        case AmbientColorPreset::SUNSET_GOLD:
            activeDigitalColor_ = Effects::ColorRGBCCT(255, 120, 10, 180, 0);
            activeAnalogColor_  = Effects::ColorRGB(255, 100, 5);
            break;
        case AmbientColorPreset::CYAN_CHILL:
            activeDigitalColor_ = Effects::ColorRGBCCT(0, 180, 240, 0, 160);
            activeAnalogColor_  = Effects::ColorRGB(0, 180, 240);
            break;
        case AmbientColorPreset::DEEP_PURPLE:
            activeDigitalColor_ = Effects::ColorRGBCCT(180, 0, 255, 0, 0);
            activeAnalogColor_  = Effects::ColorRGB(180, 0, 255);
            break;
        case AmbientColorPreset::CUSTOM:
            break;
        case AmbientColorPreset::OFF:
            activeDigitalColor_ = Effects::ColorRGBCCT::Black();
            activeAnalogColor_  = Effects::ColorRGB::Black();
            break;
    }
}

void AmbientModeController::setCustomColor(const Effects::ColorRGBCCT& digitalColor, const Effects::ColorRGB& analogColor) {
    currentPreset_ = AmbientColorPreset::CUSTOM;
    activeDigitalColor_ = digitalColor;
    activeAnalogColor_  = analogColor;
}

void AmbientModeController::setBrightness(uint8_t brightness) {
    brightness_ = brightness;
    leds_.setBrightness(brightness);
}

void AmbientModeController::update(uint32_t nowMs, float transitionProgress) {
    (void)nowMs;
    if (currentPreset_ == AmbientColorPreset::OFF) {
        leds_.clear();
        leds_.show();
        return;
    }

    Effects::ColorRGBCCT digitalScaled = activeDigitalColor_;
    Effects::ColorRGB analogScaled     = activeAnalogColor_;

    // Se estiver em transição (crossfade), interpola a partir do preto
    if (transitionProgress < 1.0f) {
        digitalScaled = Effects::ColorRGBCCT::lerp(Effects::ColorRGBCCT::Black(), digitalScaled, transitionProgress);
        analogScaled  = Effects::ColorRGB::lerp(Effects::ColorRGB::Black(), analogScaled, transitionProgress);
    }

    leds_.fillLeft(digitalScaled);
    leds_.fillRight(digitalScaled);
    leds_.setAnalogRgb(analogScaled);
    leds_.show();
}

} // namespace Modes
