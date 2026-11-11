#pragma once
#include <Arduino.h>

namespace Modes {

enum class SystemMode : uint8_t {
    BOOT = 0,
    AMBIENT_MODE,
    F1_MODE,
    F1_DISCONNECTED,
    SYSTEM_ERROR
};

class ModeManager {
public:
    ModeManager();

    void begin();
    void update(uint32_t nowMs, bool hasF1Telemetry, uint32_t lastPacketAgeMs);

    SystemMode getCurrentMode() const { return currentMode_; }
    SystemMode getPreviousMode() const { return previousMode_; }
    const char* getModeName() const;

    // Forçar modo manualmente (ex: via botão físico ou endpoint Web)
    void forceMode(SystemMode mode);
    void releaseForcedMode();
    bool isForced() const { return isForced_; }

    // Rastreamento de transição para crossfade suave
    bool isTransitioning() const { return isTransitioning_; }
    float getTransitionProgress() const;

private:
    void switchMode(SystemMode newMode, uint32_t nowMs);

    SystemMode currentMode_ = SystemMode::BOOT;
    SystemMode previousMode_ = SystemMode::BOOT;
    SystemMode forcedMode_ = SystemMode::BOOT;
    bool isForced_ = false;

    // Controle de transição e fade
    bool isTransitioning_ = false;
    uint32_t transitionStartMs_ = 0;
    uint32_t modeEnteredMs_ = 0;
};

extern ModeManager modeManager;

} // namespace Modes
