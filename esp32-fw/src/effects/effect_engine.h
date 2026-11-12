#pragma once
#include <Arduino.h>
#include "effect_types.h"
#include "../leds/led_controller.h"
#include "../state/race_state.h"
#include "../state/event_manager.h"

namespace Effects {

class EffectEngine {
public:
    EffectEngine(Leds::ILedController& ledController);

    void begin();
    void render(uint32_t nowMs, const State::RaceStateSnapshot& telemetry, const State::ActiveEventState& eventState);

    // Efeitos específicos
    void renderAmbientDay(uint32_t nowMs, uint32_t effectStartMs);
    void renderAmbientNight(uint32_t nowMs, uint32_t effectStartMs);
    void renderAmbientWaiting(uint32_t nowMs, uint32_t effectStartMs);
    void renderRain(uint32_t nowMs, uint32_t effectStartMs, bool isStorm);
    void renderOvertake(uint32_t nowMs, uint32_t effectStartMs);
    void renderActiveAero(uint32_t nowMs, uint32_t effectStartMs, uint8_t rpmPercent);
    void renderSafetyCar(uint32_t nowMs, uint32_t effectStartMs, bool isVsc);
    void renderFlagYellow(uint32_t nowMs, uint32_t effectStartMs);
    void renderFlagRed(uint32_t nowMs, uint32_t effectStartMs);
    void renderGreenSurge(uint32_t nowMs, uint32_t effectStartMs);
    void renderPitLane(uint32_t nowMs, uint32_t effectStartMs);
    void renderCrash(uint32_t nowMs, uint32_t effectStartMs);
    void renderEngineBlown(uint32_t nowMs, uint32_t effectStartMs);
    void renderChequeredVictory(uint32_t nowMs, uint32_t effectStartMs);
    void renderShiftFlash(uint32_t nowMs, uint32_t effectStartMs);

    // Modo de teste / diagnóstico visual sem telemetria
    void renderDiagnosticPattern(uint32_t nowMs);

private:
    void applyShiftFlashOverlay(uint32_t nowMs);
    uint32_t getTransitionDuration(EffectId from, EffectId to);
    void applyTransitionBlend(uint32_t nowMs);

    Leds::ILedController& leds_;

    // Controle de transições suaves (Cross-Fade Inteligente entre efeitos)
    static constexpr size_t MAX_STRIP_SNAPSHOT_LEDS = 100;
    EffectId currentEffect_ = EffectId::NONE;
    bool inTransition_ = false;
    uint32_t transitionStartTimeMs_ = 0;
    uint32_t transitionDurationMs_ = 0;
    ColorRGBCCT snapshotLeft_[MAX_STRIP_SNAPSHOT_LEDS];
    ColorRGBCCT snapshotRight_[MAX_STRIP_SNAPSHOT_LEDS];
    ColorRGB snapshotAnalog_;

    // Variáveis internas para animação de chuva orgânica (fade-in / pico / fade-out)
    static constexpr size_t MAX_RAINDROPS = 12;
    struct Raindrop {
        int16_t centerIndex = 0;
        uint32_t spawnTimeMs = 0;
        uint32_t durationMs = 2000;
        uint8_t maxBrightness = 200;
        bool active = false;
    };
    Raindrop leftDrops_[MAX_RAINDROPS];
    Raindrop rightDrops_[MAX_RAINDROPS];
    uint32_t lastRainSpawnMs_ = 0;

    // Controle de relâmpagos suaves para tempestade
    uint32_t lightningStartMs_ = 0;
    uint32_t nextLightningMs_ = 0;
    bool lightningActive_ = false;
};

} // namespace Effects
