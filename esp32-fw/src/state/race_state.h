#pragma once
#include <Arduino.h>

namespace State {

enum class AmbientMode : uint8_t {
    DAY = 0,
    NIGHT,
    WAITING
};

enum class WeatherMode : uint8_t {
    CLEAR = 0,
    CLOUDY,
    RAIN,
    STORM
};

enum class TrackStatus : uint8_t {
    CLEAR = 0,
    GREEN,
    YELLOW,
    RED,
    SAFETY_CAR,
    VSC,
    CHEQUERED
};

enum class ActiveAeroMode : uint8_t {
    OFF = 0,
    Z_MODE_CORNER,
    X_MODE_STRAIGHT
};

// -------------------------------------------------------------
// Snapshot imutável da telemetria de corrida
// -------------------------------------------------------------
struct RaceStateSnapshot {
    AmbientMode    ambient          = AmbientMode::DAY;
    bool           waiting          = false;
    WeatherMode    weather          = WeatherMode::CLEAR;
    TrackStatus    trackStatus      = TrackStatus::CLEAR;
    ActiveAeroMode activeAero       = ActiveAeroMode::OFF;
    
    int16_t        trackTempCelsius = 30;
    bool           chequeredFlag    = false;
    bool           overtake         = false;
    bool           drsActive        = false;
    bool           drsAllowed       = false;
    bool           pitLimiter       = false;
    bool           inPits           = false;
    bool           isCrash          = false;
    bool           engineBlown      = false;
    
    uint8_t        rpmPercent       = 0;
    uint8_t        revLightsPercent = 0;
    bool           shiftFlash       = false;
    
    uint64_t       timestamp        = 0;
    uint32_t       localReceiveTimeMs = 0;
};

// -------------------------------------------------------------
// Armazenamento centralizado com proteção de concorrência
// -------------------------------------------------------------
class RaceStateManager {
public:
    RaceStateManager();

    void update(const RaceStateSnapshot& newState);
    RaceStateSnapshot getSnapshot() const;

    // Métricas de recepção
    uint32_t getLastPacketTimeMs() const;
    uint32_t getPacketCount() const;
    bool isConnected(uint32_t timeoutMs) const;
    void reset();

private:
    RaceStateSnapshot currentSnapshot_;
    mutable portMUX_TYPE spinlock_ = portMUX_INITIALIZER_UNLOCKED;
    uint32_t packetCount_ = 0;
};

extern RaceStateManager raceStateManager;

} // namespace State
