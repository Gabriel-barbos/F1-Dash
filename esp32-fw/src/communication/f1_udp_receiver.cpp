#include "f1_udp_receiver.h"
#include "payload_parser.h"

namespace Communication {

F1UdpReceiver f1UdpReceiver;

F1UdpReceiver::F1UdpReceiver() {}

bool F1UdpReceiver::begin(uint16_t port) {
    port_ = port;
    if (udp_.begin(port_)) {
        listening_ = true;
        Serial.printf("[UDP Receiver] Ouvindo pacotes F1 na porta %u/UDP\n", port_);
        return true;
    }
    Serial.printf("[UDP Receiver] Falha ao vincular porta %u/UDP\n", port_);
    listening_ = false;
    return false;
}

void F1UdpReceiver::stop() {
    if (listening_) {
        udp_.stop();
        listening_ = false;
        Serial.println("[UDP Receiver] Socket encerrado");
    }
}

void F1UdpReceiver::update() {
    if (!listening_) return;

    int packetSize = udp_.parsePacket();
    while (packetSize > 0) {
        if (packetSize >= static_cast<int>(BUFFER_SIZE)) {
            // Descarta pacotes que ultrapassem o tamanho do buffer de segurança
            while (udp_.read() >= 0) {}
            invalidPackets_++;
            packetSize = udp_.parsePacket();
            continue;
        }

        int len = udp_.read(incomingBuffer_, BUFFER_SIZE - 1);
        if (len > 0) {
            incomingBuffer_[len] = '\0';
            processExternalPayload(incomingBuffer_, static_cast<size_t>(len));
        }

        packetSize = udp_.parsePacket();
    }
}

bool F1UdpReceiver::processExternalPayload(const char* data, size_t len) {
    if (!data || len == 0) {
        invalidPackets_++;
        return false;
    }

    State::RaceStateSnapshot snapshot = State::raceStateManager.getSnapshot();
    bool success = PayloadParser::parse(data, len, snapshot);

    if (success) {
        State::raceStateManager.update(snapshot);
        validPackets_++;
        lastPacketMillis_ = millis();
        return true;
    } else {
        invalidPackets_++;
        return false;
    }
}

} // namespace Communication
