#include "led_controller.h"

namespace Leds {

MasterLedController masterLedController;

MasterLedController::MasterLedController() {}

void MasterLedController::begin() {
    pwm_.begin();
    ws2805_.begin();
    clear();
    show();
    Serial.println("[Master LED Controller] Sistema completo de iluminação inicializado");
}

void MasterLedController::clear() {
    pwm_.off();
    ws2805_.clear();
}

void MasterLedController::show() {
    ws2805_.show();
}

void MasterLedController::setAnalogRgb(const Effects::ColorRGB& color) {
    pwm_.setColor(color);
}

Effects::ColorRGB MasterLedController::getAnalogRgb() const {
    return pwm_.getColor();
}

void MasterLedController::setLeftPixel(uint16_t index, const Effects::ColorRGBCCT& color) {
    ws2805_.setLeftPixel(index, color);
}

void MasterLedController::setRightPixel(uint16_t index, const Effects::ColorRGBCCT& color) {
    ws2805_.setRightPixel(index, color);
}

Effects::ColorRGBCCT MasterLedController::getLeftPixel(uint16_t index) const {
    return ws2805_.getLeftPixel(index);
}

Effects::ColorRGBCCT MasterLedController::getRightPixel(uint16_t index) const {
    return ws2805_.getRightPixel(index);
}

void MasterLedController::fillLeft(const Effects::ColorRGBCCT& color) {
    ws2805_.fillLeft(color);
}

void MasterLedController::fillRight(const Effects::ColorRGBCCT& color) {
    ws2805_.fillRight(color);
}

void MasterLedController::fillBoth(const Effects::ColorRGBCCT& color) {
    ws2805_.fillBoth(color);
}

void MasterLedController::fillAll(const Effects::ColorRGBCCT& digitalColor, const Effects::ColorRGB& analogColor) {
    fillLeft(digitalColor);
    fillRight(digitalColor);
    setAnalogRgb(analogColor);
}

void MasterLedController::setBrightness(uint8_t brightness) {
    masterBrightness_ = brightness;
    ws2805_.setBrightness(brightness);
    pwm_.setBrightness(brightness);
}

uint8_t MasterLedController::getBrightness() const {
    return masterBrightness_;
}

uint16_t MasterLedController::getLeftCount() const {
    return ws2805_.getLeftCount();
}

uint16_t MasterLedController::getRightCount() const {
    return ws2805_.getRightCount();
}

} // namespace Leds
