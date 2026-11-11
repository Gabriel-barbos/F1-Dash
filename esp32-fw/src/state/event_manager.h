#pragma once
#include <Arduino.h>
#include "race_state.h"
#include "../effects/effect_types.h"
#include "../config/firmware_config.h"

namespace State {

struct ActiveEventState {
    Effects::EffectId primaryEffect = Effects::EffectId::AMBIENT_DAY;
    bool overlayShiftFlash = false;
    uint32_t effectStartTimeMs = 0;
};

class EventManager {
public:
    EventManager();

    // Processa a telemetria atual, detecta bordas de subida/descida e calcula o efeito prioritário
    ActiveEventState evaluate(const RaceStateSnapshot& telemetry, uint32_t nowMs);

    void reset();

    // Controle manual de efeitos para testes/laboratório
    void forceEffect(Effects::EffectId effect, uint32_t durationMs = 0);
    void triggerShiftFlash(uint32_t durationMs = 1500);
    void clearForcedEffect();
    Effects::EffectId getForcedEffect() const { return forcedEffect_; }
    bool isEffectForced() const { return forcedEffect_ != Effects::EffectId::NONE; }

private:
    // Estado anterior para detecção de transições
    RaceStateSnapshot prevTelemetry_;
    bool hasPrevious_ = false;

    // Timers de eventos transitórios
    uint32_t crashUntilMs_ = 0;
    uint32_t greenSurgeUntilMs_ = 0;
    uint32_t shiftFlashUntilMs_ = 0;

    // Rastreamento de efeito ativo para transição suave
    Effects::EffectId lastSelectedEffect_ = Effects::EffectId::NONE;
    uint32_t effectStartTimeMs_ = 0;

    // Controle forçado pelo servidor web
    Effects::EffectId forcedEffect_ = Effects::EffectId::NONE;
    uint32_t forcedUntilMs_ = 0;
};

extern EventManager eventManager;

} // namespace State
