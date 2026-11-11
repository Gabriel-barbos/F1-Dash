#include "f1_mode.h"

namespace Modes {

F1ModeController::F1ModeController(Leds::ILedController& ledController)
    : leds_(ledController), effectEngine_(ledController) {}

void F1ModeController::begin() {
    effectEngine_.begin();
    State::eventManager.reset();
    demoActive_ = false;
    Serial.println("[F1 Mode] Modo imersivo de corrida F1 ativo");
}

void F1ModeController::update(uint32_t nowMs, float transitionProgress) {
    updateDemo(nowMs);
    State::RaceStateSnapshot telemetry = State::raceStateManager.getSnapshot();
    lastEventState_ = State::eventManager.evaluate(telemetry, nowMs);

    // Renderiza o quadro de animação da corrida
    effectEngine_.render(nowMs, telemetry, lastEventState_);
}

void F1ModeController::onExit() {
    Serial.println("[F1 Mode] Encerrando modo F1, limpando estados");
    demoActive_ = false;
    State::eventManager.clearForcedEffect();
    State::eventManager.reset();
}

void F1ModeController::triggerEffect(Effects::EffectId effect, uint32_t durationMs) {
    demoActive_ = false;
    State::eventManager.forceEffect(effect, durationMs);
    Serial.printf("[F1 Mode] Efeito manual ativado: %s\n", getActiveEffectName());
}

void F1ModeController::triggerShiftFlash(uint32_t durationMs) {
    State::eventManager.triggerShiftFlash(durationMs);
    Serial.println("[F1 Mode] Shift flash acionado");
}

void F1ModeController::clearForcedEffect() {
    demoActive_ = false;
    State::eventManager.clearForcedEffect();
    Serial.println("[F1 Mode] Efeito forçado cancelado");
}

void F1ModeController::startDemo() {
    demoActive_ = true;
    demoStep_ = 0;
    demoStepStartMs_ = millis() - 6000;
    State::eventManager.clearForcedEffect();
    Serial.println("[F1 Mode] Modo demonstração (DEMO SHOW) iniciado!");
}

void F1ModeController::stopDemo() {
    demoActive_ = false;
    State::eventManager.clearForcedEffect();
    Serial.println("[F1 Mode] Modo demonstração desativado");
}

void F1ModeController::updateDemo(uint32_t nowMs) {
    if (!demoActive_) return;

    if (nowMs - demoStepStartMs_ >= 5000) {
        demoStepStartMs_ = nowMs;
        demoStep_ = (demoStep_ + 1) % 11;

        switch (demoStep_) {
            case 0:
                State::eventManager.forceEffect(Effects::EffectId::OVERTAKE_BOOST);
                break;
            case 1:
                State::eventManager.forceEffect(Effects::EffectId::ACTIVE_AERO_STRAIGHT);
                break;
            case 2:
                State::eventManager.forceEffect(Effects::EffectId::WEATHER_RAIN);
                break;
            case 3:
                State::eventManager.forceEffect(Effects::EffectId::WEATHER_STORM);
                break;
            case 4:
                State::eventManager.forceEffect(Effects::EffectId::SAFETY_CAR);
                break;
            case 5:
                State::eventManager.forceEffect(Effects::EffectId::VSC);
                break;
            case 6:
                State::eventManager.forceEffect(Effects::EffectId::PIT_LANE);
                break;
            case 7:
                State::eventManager.forceEffect(Effects::EffectId::FLAG_RED);
                break;
            case 8:
                State::eventManager.forceEffect(Effects::EffectId::INCIDENT_CRASH);
                break;
            case 9:
                State::eventManager.forceEffect(Effects::EffectId::CHEQUERED_VICTORY);
                break;
            case 10:
                State::eventManager.forceEffect(Effects::EffectId::CUSTOM_TEST_PATTERN);
                break;
        }
        Serial.printf("[DEMO SHOW %u/11] -> %s\n", demoStep_ + 1, getActiveEffectName());
    }
}

Effects::EffectId F1ModeController::getActiveEffectId() const {
    if (State::eventManager.isEffectForced()) {
        return State::eventManager.getForcedEffect();
    }
    return lastEventState_.primaryEffect;
}

const char* F1ModeController::getActiveEffectName() const {
    Effects::EffectId id = getActiveEffectId();
    switch (id) {
        case Effects::EffectId::NONE: return "Nenhum";
        case Effects::EffectId::AMBIENT_DAY: return "F1 Pista Dia";
        case Effects::EffectId::AMBIENT_NIGHT: return "F1 Pista Noite";
        case Effects::EffectId::AMBIENT_WAITING: return "F1 Aguardando Corrida (Waiting)";
        case Effects::EffectId::WEATHER_RAIN: return "Chuva Dinâmica";
        case Effects::EffectId::WEATHER_STORM: return "Tempestade & Raios";
        case Effects::EffectId::SAFETY_CAR: return "Safety Car (SC)";
        case Effects::EffectId::VSC: return "Virtual Safety Car (VSC)";
        case Effects::EffectId::FLAG_YELLOW: return "Bandeira Amarela";
        case Effects::EffectId::FLAG_RED: return "Bandeira Vermelha";
        case Effects::EffectId::FLAG_GREEN_SURGE: return "Bandeira Verde (Relargada)";
        case Effects::EffectId::PIT_LANE: return "Pit Lane / Boxes";
        case Effects::EffectId::OVERTAKE_BOOST: return "Overtake / ERS Boost";
        case Effects::EffectId::ACTIVE_AERO_STRAIGHT: return "Active Aero (X-Mode)";
        case Effects::EffectId::INCIDENT_CRASH: return "Batida Violenta (Crash)";
        case Effects::EffectId::INCIDENT_ENGINE_BLOWN: return "Falha de Motor";
        case Effects::EffectId::CHEQUERED_VICTORY: return "Bandeira Quadriculada";
        case Effects::EffectId::SHIFT_FLASH: return "Shift Flash (Subida de Giro)";
        case Effects::EffectId::CUSTOM_TEST_PATTERN: return "Diagnóstico de Hardware";
        default: return "Efeito Desconhecido";
    }
}

} // namespace Modes
