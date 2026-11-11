#include "payload_parser.h"
#include <ArduinoJson.h>

namespace Communication {

State::AmbientMode PayloadParser::parseAmbient(const char* str) {
    if (!str) return State::AmbientMode::DAY;
    if (strcmp(str, "NIGHT") == 0) return State::AmbientMode::NIGHT;
    if (strcmp(str, "WAITING") == 0) return State::AmbientMode::WAITING;
    return State::AmbientMode::DAY;
}

State::WeatherMode PayloadParser::parseWeather(const char* str) {
    if (!str) return State::WeatherMode::CLEAR;
    if (strcmp(str, "RAIN") == 0) return State::WeatherMode::RAIN;
    if (strcmp(str, "STORM") == 0) return State::WeatherMode::STORM;
    if (strcmp(str, "CLOUDY") == 0) return State::WeatherMode::CLOUDY;
    return State::WeatherMode::CLEAR;
}

State::TrackStatus PayloadParser::parseTrackStatus(const char* str) {
    if (!str) return State::TrackStatus::CLEAR;
    if (strcmp(str, "GREEN") == 0) return State::TrackStatus::GREEN;
    if (strcmp(str, "YELLOW") == 0) return State::TrackStatus::YELLOW;
    if (strcmp(str, "RED") == 0) return State::TrackStatus::RED;
    if (strcmp(str, "SAFETY_CAR") == 0) return State::TrackStatus::SAFETY_CAR;
    if (strcmp(str, "VSC") == 0) return State::TrackStatus::VSC;
    if (strcmp(str, "CHEQUERED") == 0) return State::TrackStatus::CHEQUERED;
    return State::TrackStatus::CLEAR;
}

State::ActiveAeroMode PayloadParser::parseActiveAero(const char* str) {
    if (!str) return State::ActiveAeroMode::OFF;
    if (strcmp(str, "X_MODE_STRAIGHT") == 0) return State::ActiveAeroMode::X_MODE_STRAIGHT;
    if (strcmp(str, "Z_MODE_CORNER") == 0) return State::ActiveAeroMode::Z_MODE_CORNER;
    return State::ActiveAeroMode::OFF;
}

bool PayloadParser::parse(const char* jsonBuffer, size_t length, State::RaceStateSnapshot& outSnapshot) {
    if (!jsonBuffer || length == 0 || length > 2048) {
        return false;
    }

    // Utiliza documento estático no stack do ArduinoJson v7 para alta eficiência
    JsonDocument doc;
    DeserializationError error = deserializeJson(doc, jsonBuffer, length);

    if (error) {
        return false;
    }

    // Parse resiliente: valores padrão mantidos caso a chave não exista no JSON
    if (doc.containsKey("ambient")) {
        outSnapshot.ambient = parseAmbient(doc["ambient"]);
    }
    outSnapshot.waiting = doc["waiting"] | (outSnapshot.ambient == State::AmbientMode::WAITING);
    if (doc.containsKey("weather")) {
        outSnapshot.weather = parseWeather(doc["weather"]);
    }
    if (doc.containsKey("trackStatus")) {
        outSnapshot.trackStatus = parseTrackStatus(doc["trackStatus"]);
    }
    if (doc.containsKey("activeAero")) {
        outSnapshot.activeAero = parseActiveAero(doc["activeAero"]);
    }

    outSnapshot.trackTempCelsius = doc["trackTempCelsius"] | outSnapshot.trackTempCelsius;
    outSnapshot.chequeredFlag    = doc["chequeredFlag"]    | false;
    outSnapshot.overtake         = doc["overtake"]         | false;
    outSnapshot.drsActive        = doc["drsActive"]        | false;
    outSnapshot.drsAllowed       = doc["drsAllowed"]       | false;
    outSnapshot.pitLimiter       = doc["pitLimiter"]       | false;
    outSnapshot.inPits           = doc["inPits"]           | false;
    outSnapshot.isCrash          = doc["isCrash"]          | false;
    outSnapshot.engineBlown      = doc["engineBlown"]      | false;

    outSnapshot.rpmPercent       = doc["rpmPercent"]       | uint8_t(0);
    outSnapshot.revLightsPercent = doc["revLightsPercent"] | uint8_t(0);
    outSnapshot.shiftFlash       = doc["shiftFlash"]       | false;

    if (doc.containsKey("timestamp")) {
        outSnapshot.timestamp = doc["timestamp"].as<uint64_t>();
    }

    return true;
}

} // namespace Communication
