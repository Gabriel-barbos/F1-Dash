#pragma once
#include <Arduino.h>
#include <WebServer.h>
#include <Espalexa.h>
#include "ambient_mode.h"
#include "f1_mode.h"

namespace Modes {

class AmbientServer {
public:
    AmbientServer(AmbientModeController& ambientCtrl, F1ModeController& f1Ctrl);

    void begin();
    void update();

    bool isStarted() const { return started_; }
    WebServer& getWebServer() { return server_; }
    Espalexa& getEspalexa() { return espalexa_; }

private:
    void setupWebRoutes();
    void handleRoot();
    void handleJsonState();
    void handleApiStatus();
    void handleApiEffect();

    static void onAlexaChanged(EspalexaDevice* dev);

    WebServer server_{80};
    Espalexa espalexa_;
    AmbientModeController& ambientCtrl_;
    F1ModeController& f1Ctrl_;
    static AmbientServer* instance_;
    bool started_ = false;
};

} // namespace Modes
