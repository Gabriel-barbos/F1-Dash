#pragma once
#include <Arduino.h>
#include "../effects/effect_engine.h"
#include "../leds/led_controller.h"
#include "../state/race_state.h"
#include "../state/event_manager.h"

namespace Modes {

class F1ModeController {
public:
    F1ModeController(Leds::ILedController& ledController);

    void begin();
    void update(uint32_t nowMs, float transitionProgress);
    void onExit();

    void triggerEffect(Effects::EffectId effect, uint32_t durationMs = 0);
    void triggerShiftFlash(uint32_t durationMs = 1500);
    void clearForcedEffect();

    void startDemo();
    void stopDemo();
    bool isDemoActive() const { return demoActive_; }

    Effects::EffectEngine& getEngine() { return effectEngine_; }
    Effects::EffectId getActiveEffectId() const;
    const char* getActiveEffectName() const;

private:
    void updateDemo(uint32_t nowMs);

    Leds::ILedController& leds_;
    Effects::EffectEngine effectEngine_;
    State::ActiveEventState lastEventState_;

    bool demoActive_ = false;
    uint8_t demoStep_ = 0;
    uint32_t demoStepStartMs_ = 0;
};

} // namespace Modes
