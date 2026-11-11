#pragma once
#include <Arduino.h>
#include "../modes/mode_manager.h"
#include "../communication/f1_udp_receiver.h"
#include "../state/race_state.h"

namespace Diagnostics {

class SystemDiagnostics {
public:
    SystemDiagnostics();

    void begin();
    // Exibe resumo de saúde do sistema a cada intervalo definido (ex: a cada 5 segundos)
    void update(uint32_t nowMs, Modes::SystemMode currentMode);

    void printBootBanner();
    void printHeapStatus();

private:
    uint32_t lastPrintMs_ = 0;
    static constexpr uint32_t PRINT_INTERVAL_MS = 5000;
};

extern SystemDiagnostics systemDiagnostics;

} // namespace Diagnostics
