#include "diagnostics.h"
#include <WiFi.h>
#include "../config/pins.h"
#include "../config/network_config.h"
#include "../config/firmware_config.h"

namespace Diagnostics {

SystemDiagnostics systemDiagnostics;

SystemDiagnostics::SystemDiagnostics() {}

void SystemDiagnostics::begin() {
    printBootBanner();
}

void SystemDiagnostics::printBootBanner() {
    Serial.println("\n========================================================");
    Serial.println("         G7 DESK F1 SMART LIGHTING - ESP32 FIRMWARE     ");
    Serial.println("========================================================");
    Serial.printf("MCU: ESP32 | Freq: %lu MHz | SDK: %s\n", 
                  static_cast<unsigned long>(ESP.getCpuFreqMHz()), 
                  ESP.getSdkVersion());
    Serial.printf("Memória Heap Livre: %lu bytes | Min Heap: %lu bytes\n", 
                  static_cast<unsigned long>(ESP.getFreeHeap()), 
                  static_cast<unsigned long>(ESP.getMinFreeHeap()));
    Serial.println("--------------------------------------------------------");
    Serial.println("Mapeamento de Hardware Confirmado:");
    Serial.printf("  - Fita Analógica 12V (PWM): R=GPIO%u, G=GPIO%u, B=GPIO%u\n", 
                  Config::Pins::RGB_RED_PIN, Config::Pins::RGB_GREEN_PIN, Config::Pins::RGB_BLUE_PIN);
    Serial.printf("  - Fita WS2805 Esquerda:     DATA=GPIO%u (via Level Shifter 74AHCT125)\n", 
                  Config::Pins::WS2805_LEFT_DATA_PIN);
    Serial.printf("  - Fita WS2805 Direita:      DATA=GPIO%u (via Level Shifter 74AHCT125)\n", 
                  Config::Pins::WS2805_RIGHT_DATA_PIN);
    Serial.printf("  - Porta de Telemetria F1:   %u/UDP (Heartbeat 5Hz / Event-Driven)\n", 
                  Config::Network::F1_UDP_PORT);
    Serial.printf("  - Taxa Alvo de Render:      %lu FPS (%lu ms/frame)\n", 
                  static_cast<unsigned long>(Config::Firmware::TARGET_FPS), 
                  static_cast<unsigned long>(Config::Firmware::FRAME_INTERVAL_MS));
    Serial.println("========================================================\n");
}

void SystemDiagnostics::printHeapStatus() {
    Serial.printf("[Diagnóstico] Heap Livre: %lu bytes\n", 
                  static_cast<unsigned long>(ESP.getFreeHeap()));
}

void SystemDiagnostics::update(uint32_t nowMs, Modes::SystemMode currentMode) {
    if (nowMs - lastPrintMs_ < PRINT_INTERVAL_MS) return;
    lastPrintMs_ = nowMs;

    const char* modeName = (currentMode == Modes::SystemMode::AMBIENT_MODE) ? "AMBIENT" :
                           (currentMode == Modes::SystemMode::F1_MODE) ? "F1_GAME" :
                           (currentMode == Modes::SystemMode::F1_DISCONNECTED) ? "F1_DISCONNECTED" : "BOOT";

    bool wifiOk = (WiFi.status() == WL_CONNECTED);
    String ipStr = wifiOk ? WiFi.localIP().toString() : "Desconectado";

    uint32_t validPkts = Communication::f1UdpReceiver.getValidPackets();
    uint32_t invalidPkts = Communication::f1UdpReceiver.getInvalidPackets();
    uint32_t lastPacketAge = (Communication::f1UdpReceiver.getLastPacketMillis() > 0) ?
                             (nowMs - Communication::f1UdpReceiver.getLastPacketMillis()) : 0;

    Serial.printf("[Status] Modo: %-15s | Wi-Fi: %-15s | F1 UDP: %lu válidos, %lu inválidos | Último pacote: %lu ms atrás | Heap: %lu B\n",
                  modeName, ipStr.c_str(), 
                  static_cast<unsigned long>(validPkts), 
                  static_cast<unsigned long>(invalidPkts), 
                  static_cast<unsigned long>(lastPacketAge), 
                  static_cast<unsigned long>(ESP.getFreeHeap()));
}

} // namespace Diagnostics
