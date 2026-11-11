#pragma once
#include <Arduino.h>
#include "../state/race_state.h"

namespace Communication {

class PayloadParser {
public:
    // Faz o parse do buffer JSON recebido por UDP.
    // Retorna true se o pacote for um JSON válido e contiver os campos essenciais.
    // Não lança exceções e não causa travamento em campos ausentes ou tipos inválidos.
    static bool parse(const char* jsonBuffer, size_t length, State::RaceStateSnapshot& outSnapshot);

    // Helpers de conversão de string para enumeração com fallback seguro
    static State::AmbientMode parseAmbient(const char* str);
    static State::WeatherMode parseWeather(const char* str);
    static State::TrackStatus parseTrackStatus(const char* str);
    static State::ActiveAeroMode parseActiveAero(const char* str);
};

} // namespace Communication
