#include "mode_manager.h"
#include "../config/firmware_config.h"

namespace Modes {

ModeManager modeManager;

ModeManager::ModeManager() {}

void ModeManager::begin() {
    currentMode_ = SystemMode::AMBIENT_MODE;
    previousMode_ = SystemMode::BOOT;
    modeEnteredMs_ = millis();
    isTransitioning_ = false;
    Serial.println("[Mode Manager] Inicializado em AMBIENT_MODE");
}

const char* ModeManager::getModeName() const {
    switch (currentMode_) {
        case SystemMode::BOOT:            return "BOOT";
        case SystemMode::AMBIENT_MODE:    return "AMBIENT_MODE";
        case SystemMode::F1_MODE:         return "F1_MODE";
        case SystemMode::F1_DISCONNECTED: return "F1_DISCONNECTED";
        case SystemMode::SYSTEM_ERROR:    return "SYSTEM_ERROR";
        default:                          return "UNKNOWN";
    }
}

void ModeManager::forceMode(SystemMode mode) {
    forcedMode_ = mode;
    isForced_ = true;
    switchMode(mode, millis());
}

void ModeManager::releaseForcedMode() {
    isForced_ = false;
}

float ModeManager::getTransitionProgress() const {
    if (!isTransitioning_) return 1.0f;
    uint32_t elapsed = millis() - transitionStartMs_;
    if (elapsed >= Config::Firmware::MODE_TRANSITION_FADE_MS) {
        return 1.0f;
    }
    return static_cast<float>(elapsed) / static_cast<float>(Config::Firmware::MODE_TRANSITION_FADE_MS);
}

void ModeManager::switchMode(SystemMode newMode, uint32_t nowMs) {
    if (newMode == currentMode_) return;

    previousMode_ = currentMode_;
    currentMode_ = newMode;
    modeEnteredMs_ = nowMs;
    transitionStartMs_ = nowMs;
    isTransitioning_ = true;

    Serial.printf("[Mode Manager] Transição: %s -> %s\n", 
                  previousMode_ == SystemMode::BOOT ? "BOOT" :
                  previousMode_ == SystemMode::AMBIENT_MODE ? "AMBIENT_MODE" :
                  previousMode_ == SystemMode::F1_MODE ? "F1_MODE" : "F1_DISCONNECTED",
                  getModeName());
}

void ModeManager::update(uint32_t nowMs, bool hasF1Telemetry, uint32_t lastPacketAgeMs) {
    // Se o modo estiver forçado manualmente, não processa regras automáticas
    if (isForced_) {
        return;
    }

    // Finaliza flag de transição após o tempo de crossfade
    if (isTransitioning_ && (nowMs - transitionStartMs_ >= Config::Firmware::MODE_TRANSITION_FADE_MS)) {
        isTransitioning_ = false;
    }

    switch (currentMode_) {
        case SystemMode::AMBIENT_MODE:
            // Entrada automática no F1_MODE ao receber telemetria recente
            if (hasF1Telemetry && lastPacketAgeMs < Config::Firmware::F1_TELEMETRY_TIMEOUT_MS) {
                switchMode(SystemMode::F1_MODE, nowMs);
            }
            break;

        case SystemMode::F1_MODE:
            // Timeout de comunicação: F1-Dash fechou ou parou de transmitir
            if (!hasF1Telemetry || lastPacketAgeMs >= Config::Firmware::F1_TELEMETRY_TIMEOUT_MS) {
                switchMode(SystemMode::F1_DISCONNECTED, nowMs);
            }
            break;

        case SystemMode::F1_DISCONNECTED:
            // Se a telemetria do F1 voltar, reativa F1_MODE imediatamente
            if (hasF1Telemetry && lastPacketAgeMs < Config::Firmware::F1_TELEMETRY_TIMEOUT_MS) {
                switchMode(SystemMode::F1_MODE, nowMs);
            }
            // Se passar mais de 5 segundos desconectado, retorna suavemente para AMBIENT_MODE
            else if (nowMs - modeEnteredMs_ > 5000) {
                switchMode(SystemMode::AMBIENT_MODE, nowMs);
            }
            break;

        default:
            break;
    }
}

} // namespace Modes
