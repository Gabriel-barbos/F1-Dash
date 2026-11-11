#include "race_state.h"

namespace State {

RaceStateManager raceStateManager;

RaceStateManager::RaceStateManager() {
    currentSnapshot_.localReceiveTimeMs = 0;
}

void RaceStateManager::update(const RaceStateSnapshot& newState) {
    portENTER_CRITICAL(&spinlock_);
    currentSnapshot_ = newState;
    currentSnapshot_.localReceiveTimeMs = millis();
    packetCount_++;
    portEXIT_CRITICAL(&spinlock_);
}

RaceStateSnapshot RaceStateManager::getSnapshot() const {
    RaceStateSnapshot copy;
    portENTER_CRITICAL(&spinlock_);
    copy = currentSnapshot_;
    portEXIT_CRITICAL(&spinlock_);
    return copy;
}

uint32_t RaceStateManager::getLastPacketTimeMs() const {
    portENTER_CRITICAL(&spinlock_);
    uint32_t t = currentSnapshot_.localReceiveTimeMs;
    portEXIT_CRITICAL(&spinlock_);
    return t;
}

uint32_t RaceStateManager::getPacketCount() const {
    portENTER_CRITICAL(&spinlock_);
    uint32_t count = packetCount_;
    portEXIT_CRITICAL(&spinlock_);
    return count;
}

bool RaceStateManager::isConnected(uint32_t timeoutMs) const {
    portENTER_CRITICAL(&spinlock_);
    uint32_t last = currentSnapshot_.localReceiveTimeMs;
    portEXIT_CRITICAL(&spinlock_);

    if (last == 0) return false;
    return (millis() - last) < timeoutMs;
}

void RaceStateManager::reset() {
    portENTER_CRITICAL(&spinlock_);
    currentSnapshot_ = RaceStateSnapshot();
    currentSnapshot_.localReceiveTimeMs = 0;
    portEXIT_CRITICAL(&spinlock_);
}

} // namespace State
