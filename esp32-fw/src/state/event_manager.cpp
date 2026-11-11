#include "event_manager.h"

namespace State {

EventManager eventManager;

EventManager::EventManager() {}

void EventManager::reset() {
    hasPrevious_ = false;
    crashUntilMs_ = 0;
    greenSurgeUntilMs_ = 0;
    shiftFlashUntilMs_ = 0;
    lastSelectedEffect_ = Effects::EffectId::NONE;
    effectStartTimeMs_ = 0;
    forcedEffect_ = Effects::EffectId::NONE;
    forcedUntilMs_ = 0;
}

void EventManager::forceEffect(Effects::EffectId effect, uint32_t durationMs) {
    forcedEffect_ = effect;
    forcedUntilMs_ = (durationMs > 0) ? (millis() + durationMs) : 0;
    effectStartTimeMs_ = millis();
    lastSelectedEffect_ = effect;
}

void EventManager::triggerShiftFlash(uint32_t durationMs) {
    shiftFlashUntilMs_ = millis() + durationMs;
}

void EventManager::clearForcedEffect() {
    forcedEffect_ = Effects::EffectId::NONE;
    forcedUntilMs_ = 0;
}

ActiveEventState EventManager::evaluate(const RaceStateSnapshot& telemetry, uint32_t nowMs) {
    // 0. Efeito manual forçado (Laboratório Web / Testes)
    if (forcedEffect_ != Effects::EffectId::NONE) {
        if (forcedUntilMs_ > 0 && nowMs >= forcedUntilMs_) {
            forcedEffect_ = Effects::EffectId::NONE;
            forcedUntilMs_ = 0;
        } else {
            ActiveEventState res;
            res.primaryEffect = forcedEffect_;
            res.overlayShiftFlash = (nowMs < shiftFlashUntilMs_) && (((nowMs / 80) % 2) == 0);
            res.effectStartTimeMs = effectStartTimeMs_;
            return res;
        }
    }

    if (!hasPrevious_) {
        prevTelemetry_ = telemetry;
        hasPrevious_ = true;
    }

    // -------------------------------------------------------------
    // 1. Detecção de Bordas (Transições de Estado)
    // -------------------------------------------------------------
    
    // Borda de subida de batida violenta: false -> true
    if (telemetry.isCrash && !prevTelemetry_.isCrash) {
        crashUntilMs_ = nowMs + Config::Firmware::CRASH_EFFECT_DURATION_MS;
    }

    // Borda de transição para bandeira verde APENAS quando saindo de Safety Car / VSC / Amarela
    bool wasCaution = (prevTelemetry_.trackStatus == TrackStatus::SAFETY_CAR ||
                       prevTelemetry_.trackStatus == TrackStatus::VSC ||
                       prevTelemetry_.trackStatus == TrackStatus::YELLOW);
    if (wasCaution && (telemetry.trackStatus == TrackStatus::GREEN || telemetry.trackStatus == TrackStatus::CLEAR)) {
        greenSurgeUntilMs_ = nowMs + Config::Firmware::GREEN_FLAG_SURGE_DURATION_MS;
    }

    // Flash de troca de marcha (shift flash)
    if (telemetry.shiftFlash && !prevTelemetry_.shiftFlash) {
        shiftFlashUntilMs_ = nowMs + Config::Firmware::SHIFT_FLASH_DURATION_MS;
    }

    // Atualiza estado anterior para o próximo ciclo
    prevTelemetry_ = telemetry;

    // -------------------------------------------------------------
    // 2. Resolução da Hierarquia Estrita de Prioridades
    // -------------------------------------------------------------
    Effects::EffectId selected = Effects::EffectId::AMBIENT_DAY;

    // Prioridade 1: Impacto / Batida Violenta (Transitório de alta prioridade)
    if (nowMs < crashUntilMs_ || telemetry.isCrash) {
        selected = Effects::EffectId::INCIDENT_CRASH;
    }
    // Prioridade 2: Bandeira Vermelha ou Motor Estourado (Persistente de emergência)
    else if (telemetry.trackStatus == TrackStatus::RED) {
        selected = Effects::EffectId::FLAG_RED;
    }
    else if (telemetry.engineBlown) {
        selected = Effects::EffectId::INCIDENT_ENGINE_BLOWN;
    }
    // Prioridade 3: Condições de Pista / Safety Car / VSC / Amarela
    else if (telemetry.trackStatus == TrackStatus::SAFETY_CAR) {
        selected = Effects::EffectId::SAFETY_CAR;
    }
    else if (telemetry.trackStatus == TrackStatus::VSC) {
        selected = Effects::EffectId::VSC;
    }
    else if (telemetry.trackStatus == TrackStatus::YELLOW) {
        selected = Effects::EffectId::FLAG_YELLOW;
    }
    // Prioridade 4: Boxes (Pit Limiter ou no Pit Lane)
    else if (telemetry.pitLimiter || telemetry.inPits) {
        selected = Effects::EffectId::PIT_LANE;
    }
    // Prioridade 5: Modo Ultrapassagem / Overtake Boost (Imediato!)
    else if (telemetry.overtake) {
        selected = Effects::EffectId::OVERTAKE_BOOST;
    }
    // Prioridade 6: Modo Reta / Active Aero X-Mode / DRS (Imediato!)
    else if (telemetry.activeAero == ActiveAeroMode::X_MODE_STRAIGHT || telemetry.drsActive) {
        selected = Effects::EffectId::ACTIVE_AERO_STRAIGHT;
    }
    // Prioridade 6.5: Pulso Transitório de Bandeira Verde (pós-SC/Amarela)
    else if (nowMs < greenSurgeUntilMs_) {
        selected = Effects::EffectId::FLAG_GREEN_SURGE;
    }
    // Prioridade 7: Bandeira Quadriculada / Vitória
    else if (telemetry.chequeredFlag || telemetry.trackStatus == TrackStatus::CHEQUERED) {
        selected = Effects::EffectId::CHEQUERED_VICTORY;
    }
    // Prioridade 8: Modo Waiting / Loading (Celular & PS5 conectados aguardando início da corrida)
    else if (telemetry.waiting || telemetry.ambient == AmbientMode::WAITING) {
        selected = Effects::EffectId::AMBIENT_WAITING;
    }
    // Prioridade 9: Condições Climáticas (Chuva ou Tempestade)
    else if (telemetry.weather == WeatherMode::STORM) {
        selected = Effects::EffectId::WEATHER_STORM;
    }
    else if (telemetry.weather == WeatherMode::RAIN) {
        selected = Effects::EffectId::WEATHER_RAIN;
    }
    // Prioridade 10: Iluminação Ambiente Base de Corrida
    else {
        if (telemetry.ambient == AmbientMode::NIGHT) {
            selected = Effects::EffectId::AMBIENT_NIGHT;
        } else {
            selected = Effects::EffectId::AMBIENT_DAY;
        }
    }

    // Rastreia início do efeito selecionado para cálculos temporais relativos
    if (selected != lastSelectedEffect_) {
        lastSelectedEffect_ = selected;
        effectStartTimeMs_ = nowMs;
    }

    ActiveEventState result;
    result.primaryEffect = selected;
    result.overlayShiftFlash = (nowMs < shiftFlashUntilMs_);
    result.effectStartTimeMs = effectStartTimeMs_;
    return result;
}

} // namespace State
