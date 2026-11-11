#include "ws2805_controller.h"
#include <driver/gpio.h>

namespace Leds {

Ws2805Controller::Ws2805Controller() {
    leftBuffer_ = new Effects::ColorRGBCCT[leftCount_];
    rightBuffer_ = new Effects::ColorRGBCCT[rightCount_];
}

Ws2805Controller::~Ws2805Controller() {
    delete stripLeft_;
    delete stripRight_;
    delete[] leftBuffer_;
    delete[] rightBuffer_;
}

void Ws2805Controller::begin() {
    stripLeft_ = new NeoPixelBus<NeoGrbwwFeature, NeoEsp32Rmt0Ws2805Method>(leftCount_, Config::Pins::WS2805_LEFT_DATA_PIN);
    stripRight_ = new NeoPixelBus<NeoGrbwwFeature, NeoEsp32Rmt1Ws2805Method>(rightCount_, Config::Pins::WS2805_RIGHT_DATA_PIN);

    stripLeft_->Begin();
    stripRight_->Begin();

    // Suaviza o slew-rate / corrente de borda dos GPIOs de dados (reduz ringing/reflexão no 1º grupo de LEDs)
    gpio_set_drive_capability(static_cast<gpio_num_t>(Config::Pins::WS2805_LEFT_DATA_PIN), GPIO_DRIVE_CAP_1);
    gpio_set_drive_capability(static_cast<gpio_num_t>(Config::Pins::WS2805_RIGHT_DATA_PIN), GPIO_DRIVE_CAP_1);

    clear();
    stripLeft_->Dirty();
    stripRight_->Dirty();
    show();

    Serial.printf("[WS2805 Controller] Fita Esquerda inicializada no GPIO %u (%u pixels GRBWW via RMT0)\n", 
                  Config::Pins::WS2805_LEFT_DATA_PIN, leftCount_);
    Serial.printf("[WS2805 Controller] Fita Direita inicializada no GPIO %u (%u pixels GRBWW via RMT1)\n", 
                  Config::Pins::WS2805_RIGHT_DATA_PIN, rightCount_);
}

uint16_t Ws2805Controller::mapLeftIndex(uint16_t idx) const {
    if (idx >= leftCount_) idx = leftCount_ - 1;
    return invertLeft_ ? (leftCount_ - 1 - idx) : idx;
}

uint16_t Ws2805Controller::mapRightIndex(uint16_t idx) const {
    if (idx >= rightCount_) idx = rightCount_ - 1;
    return invertRight_ ? (rightCount_ - 1 - idx) : idx;
}

void Ws2805Controller::setLeftPixel(uint16_t index, const Effects::ColorRGBCCT& color) {
    if (index >= leftCount_ || !stripLeft_) return;
    leftBuffer_[index] = color;

    Effects::ColorRGBCCT scaled = color.scaled(brightness_);
    uint16_t physicalIdx = mapLeftIndex(index);
    RgbwwColor target(scaled.r, scaled.g, scaled.b, scaled.ww, scaled.cw);

    // Só marca o barramento como Dirty se a cor física do pixel realmente mudou
    if (stripLeft_->GetPixelColor(physicalIdx) != target) {
        stripLeft_->SetPixelColor(physicalIdx, target);
    }
}

void Ws2805Controller::setRightPixel(uint16_t index, const Effects::ColorRGBCCT& color) {
    if (index >= rightCount_ || !stripRight_) return;
    rightBuffer_[index] = color;

    Effects::ColorRGBCCT scaled = color.scaled(brightness_);
    uint16_t physicalIdx = mapRightIndex(index);
    RgbwwColor target(scaled.r, scaled.g, scaled.b, scaled.ww, scaled.cw);

    // Só marca o barramento como Dirty se a cor física do pixel realmente mudou
    if (stripRight_->GetPixelColor(physicalIdx) != target) {
        stripRight_->SetPixelColor(physicalIdx, target);
    }
}

Effects::ColorRGBCCT Ws2805Controller::getLeftPixel(uint16_t index) const {
    if (index >= leftCount_) return Effects::ColorRGBCCT::Black();
    return leftBuffer_[index];
}

Effects::ColorRGBCCT Ws2805Controller::getRightPixel(uint16_t index) const {
    if (index >= rightCount_) return Effects::ColorRGBCCT::Black();
    return rightBuffer_[index];
}

void Ws2805Controller::fillLeft(const Effects::ColorRGBCCT& color) {
    for (uint16_t i = 0; i < leftCount_; ++i) {
        setLeftPixel(i, color);
    }
}

void Ws2805Controller::fillRight(const Effects::ColorRGBCCT& color) {
    for (uint16_t i = 0; i < rightCount_; ++i) {
        setRightPixel(i, color);
    }
}

void Ws2805Controller::fillBoth(const Effects::ColorRGBCCT& color) {
    fillLeft(color);
    fillRight(color);
}

void Ws2805Controller::clear() {
    fillBoth(Effects::ColorRGBCCT::Black());
}

void Ws2805Controller::show() {
    uint32_t now = millis();
    // Refresh periódico de segurança a cada 2.5s caso o barramento esteja estático
    if (now - lastForceRefreshMs_ >= 2500) {
        lastForceRefreshMs_ = now;
        if (stripLeft_) stripLeft_->Dirty();
        if (stripRight_) stripRight_->Dirty();
    }

    // Transmissão sequencial: evita que RMT0 e RMT1 chaveiem o 74AHCT125 simultaneamente,
    // eliminando ruído de terra (ground bounce) e colisão de interrupções no 1º grupo da fita direita.
    if (stripLeft_ && stripLeft_->IsDirty()) {
        while (!stripLeft_->CanShow()) {}
        stripLeft_->Show();
    }
    if (stripRight_ && stripRight_->IsDirty()) {
        if (stripLeft_) {
            while (!stripLeft_->CanShow()) {}
        }
        while (!stripRight_->CanShow()) {}
        stripRight_->Show();
    }
}

void Ws2805Controller::setBrightness(uint8_t brightness) {
    if (brightness_ == brightness) return;
    brightness_ = brightness;

    // Reaplica os buffers com a nova escala de brilho
    for (uint16_t i = 0; i < leftCount_; ++i) {
        setLeftPixel(i, leftBuffer_[i]);
    }
    for (uint16_t i = 0; i < rightCount_; ++i) {
        setRightPixel(i, rightBuffer_[i]);
    }
}

} // namespace Leds
