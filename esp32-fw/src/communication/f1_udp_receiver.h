#pragma once
#include <Arduino.h>
#include <WiFiUdp.h>
#include "../state/race_state.h"

namespace Communication {

class F1UdpReceiver {
public:
    F1UdpReceiver();

    bool begin(uint16_t port);
    void stop();

    // Processa pacotes pendentes (deve ser chamado periodicamente no loop principal)
    void update();

    // Processa payload JSON vindo de UDP ou HTTP fallback (/api/f1-state)
    bool processExternalPayload(const char* data, size_t len);

    bool isListening() const { return listening_; }
    uint32_t getValidPackets() const { return validPackets_; }
    uint32_t getInvalidPackets() const { return invalidPackets_; }
    uint32_t getLastPacketMillis() const { return lastPacketMillis_; }

private:
    WiFiUDP udp_;
    uint16_t port_ = 4210;
    bool listening_ = false;

    uint32_t validPackets_ = 0;
    uint32_t invalidPackets_ = 0;
    uint32_t lastPacketMillis_ = 0;

    // Buffer estático para evitar alocação dinâmica na heap a cada pacote
    static constexpr size_t BUFFER_SIZE = 1500;
    char incomingBuffer_[BUFFER_SIZE];
};

extern F1UdpReceiver f1UdpReceiver;

} // namespace Communication
