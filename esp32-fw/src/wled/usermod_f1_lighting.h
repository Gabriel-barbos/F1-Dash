#pragma once

#ifdef WLED_ENABLE_USERMOD // Compilado apenas quando integrado à árvore de código do WLED
#include "wled.h"
#include "../communication/f1_udp_receiver.h"
#include "../state/race_state.h"
#include "../state/event_manager.h"
#include "../effects/effect_engine.h"
#include "../modes/mode_manager.h"

class F1LightingUsermod : public Usermod {
public:
    void setup() override {
        // Inicializa o receptor UDP na porta 4210
        Communication::f1UdpReceiver.begin(Config::Network::F1_UDP_PORT);
        Modes::modeManager.begin();
        enabled_ = true;
    }

    void loop() override {
        if (!enabled_) return;

        // Processa pacotes de telemetria UDP recebidos do F1-Dash
        Communication::f1UdpReceiver.update();

        uint32_t now = millis();
        uint32_t lastPacketAge = (Communication::f1UdpReceiver.getLastPacketMillis() > 0) ?
                                 (now - Communication::f1UdpReceiver.getLastPacketMillis()) : 999999;
        bool hasRecentTelemetry = (lastPacketAge < Config::Firmware::F1_TELEMETRY_TIMEOUT_MS);

        Modes::modeManager.update(now, hasRecentTelemetry, lastPacketAge);
    }

    // Hook executado antes de cada chamada strip.show() do WLED
    void handleOverlayDraw() override {
        if (!enabled_) return;

        // Se o modo F1 estiver ativo, o Usermod assume o controle exclusivo dos pixels
        if (Modes::modeManager.getCurrentMode() == Modes::SystemMode::F1_MODE) {
            uint32_t now = millis();
            State::RaceStateSnapshot telemetry = State::raceStateManager.getSnapshot();
            State::ActiveEventState eventState = State::eventManager.evaluate(telemetry, now);

            // Renderiza no buffer de pixels do WLED
            // strip.setPixelColor(...) mapeia diretamente para os barramentos WS2805 e PWM
        }
    }

    void addToConfig(JsonObject& root) override {
        JsonObject top = root.createNestedObject("F1Lighting");
        top["enabled"] = enabled_;
        top["udpPort"] = Config::Network::F1_UDP_PORT;
    }

    bool readFromConfig(JsonObject& root) override {
        JsonObject top = root["F1Lighting"];
        if (top.isNull()) return false;
        enabled_ = top["enabled"] | enabled_;
        return true;
    }

    uint16_t getId() override { return USERMOD_ID_CUSTOM; }

private:
    bool enabled_ = true;
};
#endif
