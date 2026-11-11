#pragma once
#include <Arduino.h>

namespace Config {
namespace Network {

    // Configuração Wi-Fi: lista de redes conhecidas do setup
    struct KnownNetwork {
        const char* ssid;
        const char* password;
    };

    constexpr KnownNetwork KNOWN_NETWORKS[] = {
        { "Castelo_5G",    "16240205" },
        { "Castelo",       "16240205" },
        { "Castelo_2.4G",  "16240205" },
        { "Toca do Hulk",  "16240205" },
        { "Toca do Hulk",  "16240105" },
        { "Toca do hulk 5g", "16240205" }
    };

    constexpr size_t KNOWN_NETWORKS_COUNT = sizeof(KNOWN_NETWORKS) / sizeof(KNOWN_NETWORKS[0]);

    // Ponto de Acesso (AP) de Contingência
    constexpr const char* AP_SSID = "G7-F1-LIGHTING-AP";
    constexpr const char* AP_PASS = "12345678";

    // Porta UDP para o protocolo de telemetria do F1-Dash
    constexpr uint16_t F1_UDP_PORT = 4210;

    // Hostname mDNS para descoberta na rede local
    constexpr const char* MDNS_HOSTNAME = "g7-desk-lighting";

    // Porta HTTP do servidor Web de Ambient Mode / API
    constexpr uint16_t HTTP_PORT = 80;

} // namespace Network
} // namespace Config
