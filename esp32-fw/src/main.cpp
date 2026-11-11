#include <Arduino.h>
#include <WiFi.h>
#include <WiFiMulti.h>
#include <ESPmDNS.h>
#include <esp_wifi.h>

#include "config/pins.h"
#include "config/network_config.h"
#include "config/firmware_config.h"
#include "leds/led_controller.h"
#include "communication/f1_udp_receiver.h"
#include "state/race_state.h"
#include "state/event_manager.h"
#include "modes/mode_manager.h"
#include "modes/ambient_mode.h"
#include "modes/f1_mode.h"
#include "diagnostics/diagnostics.h"
#include "modes/ambient_server.h"

// -------------------------------------------------------------
// Instâncias Globais dos Controladores de Modo e Rede
// -------------------------------------------------------------
static Modes::AmbientModeController ambientController(Leds::masterLedController);
static Modes::F1ModeController f1Controller(Leds::masterLedController);
static Modes::AmbientServer ambientServer(ambientController, f1Controller);
static WiFiMulti wifiMulti;

// Timers de controle não bloqueantes
static uint32_t lastFrameMs = 0;
static uint32_t lastWifiCheckMs = 0;
static bool wasConnected = false;

void handleSerialCommands(uint32_t now) {
    if (Serial.available()) {
        String cmd = Serial.readStringUntil('\n');
        cmd.trim();
        cmd.toLowerCase();
        if (cmd.length() == 0) return;

        if (cmd == "demo") {
            f1Controller.startDemo();
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
            return;
        }

        if (cmd == "overtake" || cmd == "boost") {
            f1Controller.triggerEffect(Effects::EffectId::OVERTAKE_BOOST);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "rain") {
            f1Controller.triggerEffect(Effects::EffectId::WEATHER_RAIN);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "storm") {
            f1Controller.triggerEffect(Effects::EffectId::WEATHER_STORM);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "speed" || cmd == "aero" || cmd == "drs") {
            f1Controller.triggerEffect(Effects::EffectId::ACTIVE_AERO_STRAIGHT);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "safetycar" || cmd == "sc") {
            f1Controller.triggerEffect(Effects::EffectId::SAFETY_CAR);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "vsc") {
            f1Controller.triggerEffect(Effects::EffectId::VSC);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "yellow") {
            f1Controller.triggerEffect(Effects::EffectId::FLAG_YELLOW);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "red" || cmd == "redflag") {
            f1Controller.triggerEffect(Effects::EffectId::FLAG_RED);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "green") {
            f1Controller.triggerEffect(Effects::EffectId::FLAG_GREEN_SURGE);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "pit" || cmd == "boxes") {
            f1Controller.triggerEffect(Effects::EffectId::PIT_LANE);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "crash") {
            f1Controller.triggerEffect(Effects::EffectId::INCIDENT_CRASH, Config::Firmware::CRASH_EFFECT_DURATION_MS);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "engine") {
            f1Controller.triggerEffect(Effects::EffectId::INCIDENT_ENGINE_BLOWN);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "victory" || cmd == "chequered") {
            f1Controller.triggerEffect(Effects::EffectId::CHEQUERED_VICTORY);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "shift" || cmd == "shiftflash") {
            f1Controller.triggerEffect(Effects::EffectId::SHIFT_FLASH);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "test" || cmd == "diag") {
            f1Controller.triggerEffect(Effects::EffectId::CUSTOM_TEST_PATTERN);
            Modes::modeManager.forceMode(Modes::SystemMode::F1_MODE);
        } else if (cmd == "ambient" || cmd == "stop") {
            f1Controller.clearForcedEffect();
            Modes::modeManager.releaseForcedMode();
            Modes::modeManager.forceMode(Modes::SystemMode::AMBIENT_MODE);
            Serial.println("[TESTE MANUAL] Retornando ao Modo Ambiente");
        } else if (cmd == "warm") {
            f1Controller.clearForcedEffect();
            Modes::modeManager.releaseForcedMode();
            Modes::modeManager.forceMode(Modes::SystemMode::AMBIENT_MODE);
            ambientController.setPreset(Modes::AmbientColorPreset::WARM_WHITE);
        } else if (cmd == "cold") {
            f1Controller.clearForcedEffect();
            Modes::modeManager.releaseForcedMode();
            Modes::modeManager.forceMode(Modes::SystemMode::AMBIENT_MODE);
            ambientController.setPreset(Modes::AmbientColorPreset::COLD_WHITE);
        } else if (cmd == "sunset") {
            f1Controller.clearForcedEffect();
            Modes::modeManager.releaseForcedMode();
            Modes::modeManager.forceMode(Modes::SystemMode::AMBIENT_MODE);
            ambientController.setPreset(Modes::AmbientColorPreset::SUNSET_GOLD);
        } else if (cmd == "cyan") {
            f1Controller.clearForcedEffect();
            Modes::modeManager.releaseForcedMode();
            Modes::modeManager.forceMode(Modes::SystemMode::AMBIENT_MODE);
            ambientController.setPreset(Modes::AmbientColorPreset::CYAN_CHILL);
        } else if (cmd == "purple") {
            f1Controller.clearForcedEffect();
            Modes::modeManager.releaseForcedMode();
            Modes::modeManager.forceMode(Modes::SystemMode::AMBIENT_MODE);
            ambientController.setPreset(Modes::AmbientColorPreset::DEEP_PURPLE);
        } else if (cmd == "off") {
            f1Controller.clearForcedEffect();
            Modes::modeManager.releaseForcedMode();
            Modes::modeManager.forceMode(Modes::SystemMode::AMBIENT_MODE);
            ambientController.setPreset(Modes::AmbientColorPreset::OFF);
        } else {
            Serial.printf("[Comando: '%s']. Comandos: warm, cold, sunset, cyan, purple, off, demo, overtake, rain, storm, speed, safetycar, vsc, red, green, pit, crash, engine, victory, shift, test, ambient\n", cmd.c_str());
        }
    }
}

void setup() {
    Serial.begin(115200);
    delay(500);

    // 1. Diagnóstico e Banner Inicial
    Diagnostics::systemDiagnostics.begin();

    // 2. Inicialização dos Barramentos Físicos de LED
    Leds::masterLedController.begin();

    // 3. Inicialização dos Controladores de Modo
    Modes::modeManager.begin();
    ambientController.begin();
    f1Controller.begin();

    // 4. Conexão Wi-Fi Inteligente com Lista de Redes Conhecidas (Sem Modem Sleep para Latência Zero)
    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false);
    esp_wifi_set_ps(WIFI_PS_NONE);
    WiFi.disconnect();
    delay(100);

    for (size_t i = 0; i < Config::Network::KNOWN_NETWORKS_COUNT; ++i) {
        wifiMulti.addAP(Config::Network::KNOWN_NETWORKS[i].ssid, 
                        Config::Network::KNOWN_NETWORKS[i].password);
    }

    Serial.print("[Wi-Fi] Conectando");
    uint32_t startAttempt = millis();
    while (wifiMulti.run() != WL_CONNECTED && millis() - startAttempt < 4000) {
        delay(250);
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        WiFi.setSleep(false);
        esp_wifi_set_ps(WIFI_PS_NONE);
        wasConnected = true;
        Serial.printf("[Wi-Fi] Conectado! SSID: %s | IP: %s | RSSI: %d dBm (PowerSave: OFF)\n",
                      WiFi.SSID().c_str(), WiFi.localIP().toString().c_str(), WiFi.RSSI());

        if (MDNS.begin(Config::Network::MDNS_HOSTNAME)) {
            Serial.printf("[mDNS] Responder iniciado: http://%s.local/\n", Config::Network::MDNS_HOSTNAME);
        }
        ambientServer.begin();
    }

    // 5. Inicialização do Socket UDP na porta 4210
    Communication::f1UdpReceiver.begin(Config::Network::F1_UDP_PORT);
}

void loop() {
    uint32_t now = millis();

    // -------------------------------------------------------------
    // 1. Processamento de Comunicação UDP & Servidor Web / Alexa
    // -------------------------------------------------------------
    Communication::f1UdpReceiver.update();
    ambientServer.update();

    // -------------------------------------------------------------
    // 2. Comandos Seriais Interativos
    // -------------------------------------------------------------
    handleSerialCommands(now);

    // -------------------------------------------------------------
    // 3. Máquina de Estados e Gerenciamento de Modos
    // -------------------------------------------------------------
    uint32_t lastPktTime = Communication::f1UdpReceiver.getLastPacketMillis();
    uint32_t lastPacketAge = (lastPktTime > 0) ? (now - lastPktTime) : 999999;
    bool hasRecentTelemetry = (lastPacketAge < Config::Firmware::F1_TELEMETRY_TIMEOUT_MS);

    // Se receber pacote real do F1-Dash, cancela testes forçados para assumir telemetria viva
    if (hasRecentTelemetry) {
        if (f1Controller.isDemoActive() || State::eventManager.isEffectForced() || Modes::modeManager.isForced()) {
            f1Controller.clearForcedEffect();
            Modes::modeManager.releaseForcedMode();
            Serial.println("\n>>> [F1-DASH CONECTADO] Pacotes recebidos, assumindo telemetria real em F1_MODE! <<<");
        }
    }

    Modes::modeManager.update(now, hasRecentTelemetry, lastPacketAge);

    // -------------------------------------------------------------
    // 4. Renderização Não Bloqueante na Taxa Alvo (50 FPS)
    // -------------------------------------------------------------
    if (now - lastFrameMs >= Config::Firmware::FRAME_INTERVAL_MS) {
        lastFrameMs = now;
        float progress = Modes::modeManager.getTransitionProgress();

        switch (Modes::modeManager.getCurrentMode()) {
            case Modes::SystemMode::AMBIENT_MODE:
                ambientController.update(now, progress);
                break;

            case Modes::SystemMode::F1_MODE:
                f1Controller.update(now, progress);
                break;

            case Modes::SystemMode::F1_DISCONNECTED: {
                Effects::ColorRGBCCT calm(0, 0, 0, 150, 0);
                Leds::masterLedController.fillLeft(calm);
                Leds::masterLedController.fillRight(calm);
                Leds::masterLedController.setAnalogRgb(Effects::ColorRGB::WarmWhite(80));
                Leds::masterLedController.show();
                break;
            }

            default:
                break;
        }
    }

    // -------------------------------------------------------------
    // 5. Manutenção de Conexão Wi-Fi em Segundo Plano (Sem Travar Render)
    // -------------------------------------------------------------
    Communication::f1UdpReceiver.update();

    if (now - lastWifiCheckMs >= 3000) {
        lastWifiCheckMs = now;
        if (WiFi.status() != WL_CONNECTED) {
            wasConnected = false;
            wifiMulti.run();
        } else if (!wasConnected) {
            WiFi.setSleep(false);
            esp_wifi_set_ps(WIFI_PS_NONE);
            wasConnected = true;
            Serial.printf("[Wi-Fi] Conectado com sucesso! SSID: %s | IP: %s | RSSI: %d dBm (PowerSave: OFF)\n",
                          WiFi.SSID().c_str(), WiFi.localIP().toString().c_str(), WiFi.RSSI());
            if (MDNS.begin(Config::Network::MDNS_HOSTNAME)) {
                Serial.printf("[mDNS] Responder iniciado: http://%s.local/\n", Config::Network::MDNS_HOSTNAME);
            }
        }
    }

    // -------------------------------------------------------------
    // 6. Diagnóstico Periódico (A cada 5 segundos no Monitor Serial)
    // -------------------------------------------------------------
    Diagnostics::systemDiagnostics.update(now, Modes::modeManager.getCurrentMode());
}
