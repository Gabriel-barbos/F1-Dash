#pragma once
#include <Arduino.h>

namespace Effects {

// -------------------------------------------------------------
// Representação de Cor de 5 Canais para WS2805 (RGBCCT)
// -------------------------------------------------------------
struct ColorRGBCCT {
    uint8_t r;
    uint8_t g;
    uint8_t b;
    uint8_t ww; // Warm White (Branco Quente ~2700K)
    uint8_t cw; // Cold White (Branco Frio ~6500K)

    constexpr ColorRGBCCT() : r(0), g(0), b(0), ww(0), cw(0) {}
    constexpr ColorRGBCCT(uint8_t r_, uint8_t g_, uint8_t b_, uint8_t ww_ = 0, uint8_t cw_ = 0)
        : r(r_), g(g_), b(b_), ww(ww_), cw(cw_) {}

    static constexpr ColorRGBCCT Black() { return ColorRGBCCT(0, 0, 0, 0, 0); }
    static constexpr ColorRGBCCT Red(uint8_t v = 255) { return ColorRGBCCT(v, 0, 0, 0, 0); }
    static constexpr ColorRGBCCT Green(uint8_t v = 255) { return ColorRGBCCT(0, v, 0, 0, 0); }
    static constexpr ColorRGBCCT Blue(uint8_t v = 255) { return ColorRGBCCT(0, 0, v, 0, 0); }
    static constexpr ColorRGBCCT Yellow(uint8_t v = 255) { return ColorRGBCCT(v, (v * 180) / 255, 0, 0, 0); }
    static constexpr ColorRGBCCT Purple(uint8_t v = 255) { return ColorRGBCCT(v, 0, v, 0, 0); }
    static constexpr ColorRGBCCT Amber(uint8_t v = 255) { return ColorRGBCCT(v, (v * 100) / 255, 0, 0, 0); }
    
    // Iluminação Branca de Alta Fidelidade usando os canais dedicados CCT
    static constexpr ColorRGBCCT WarmWhite(uint8_t v = 255) { return ColorRGBCCT(0, 0, 0, v, 0); }
    static constexpr ColorRGBCCT ColdWhite(uint8_t v = 255) { return ColorRGBCCT(0, 0, 0, 0, v); }
    static constexpr ColorRGBCCT NeutralWhite(uint8_t v = 255) { return ColorRGBCCT(0, 0, 0, v / 2, v / 2); }

    // Interpolação linear de cores para transições suaves
    static ColorRGBCCT lerp(const ColorRGBCCT& a, const ColorRGBCCT& b, float t) {
        if (t <= 0.0f) return a;
        if (t >= 1.0f) return b;
        return ColorRGBCCT(
            static_cast<uint8_t>(a.r  + (b.r  - a.r)  * t),
            static_cast<uint8_t>(a.g  + (b.g  - a.g)  * t),
            static_cast<uint8_t>(a.b  + (b.b  - a.b)  * t),
            static_cast<uint8_t>(a.ww + (b.ww - a.ww) * t),
            static_cast<uint8_t>(a.cw + (b.cw - a.cw) * t)
        );
    }

    ColorRGBCCT scaled(uint8_t brightness) const {
        return ColorRGBCCT(
            (static_cast<uint16_t>(r)  * brightness) / 255,
            (static_cast<uint16_t>(g)  * brightness) / 255,
            (static_cast<uint16_t>(b)  * brightness) / 255,
            (static_cast<uint16_t>(ww) * brightness) / 255,
            (static_cast<uint16_t>(cw) * brightness) / 255
        );
    }
};

// -------------------------------------------------------------
// Representação de Cor RGB para a Fita Analógica (MOSFET 12V)
// -------------------------------------------------------------
struct ColorRGB {
    uint8_t r;
    uint8_t g;
    uint8_t b;

    constexpr ColorRGB() : r(0), g(0), b(0) {}
    constexpr ColorRGB(uint8_t r_, uint8_t g_, uint8_t b_) : r(r_), g(g_), b(b_) {}

    static constexpr ColorRGB Black() { return ColorRGB(0, 0, 0); }
    static constexpr ColorRGB Red(uint8_t v = 255) { return ColorRGB(v, 0, 0); }
    static constexpr ColorRGB Green(uint8_t v = 255) { return ColorRGB(0, v, 0); }
    static constexpr ColorRGB Blue(uint8_t v = 255) { return ColorRGB(0, 0, v); }
    // Para a fita antiga analógica (RGB 12V), nunca sintetizar branco combinando R+G+B
    // pois causa aberração cromática (arco-íris). Em vez disso, utilizar backlight monocromático suave:
    static constexpr ColorRGB WarmWhite(uint8_t v = 255) { return ColorRGB(v, (v * 80) / 255, 0); }       // Laranja/âmbar suave
    static constexpr ColorRGB ColdWhite(uint8_t v = 255) { return ColorRGB(0, (v * 80) / 255, v); }       // Azul claro suave

    static ColorRGB lerp(const ColorRGB& a, const ColorRGB& b, float t) {
        if (t <= 0.0f) return a;
        if (t >= 1.0f) return b;
        return ColorRGB(
            static_cast<uint8_t>(a.r + (b.r - a.r) * t),
            static_cast<uint8_t>(a.g + (b.g - a.g) * t),
            static_cast<uint8_t>(a.b + (b.b - a.b) * t)
        );
    }

    ColorRGB scaled(uint8_t brightness) const {
        return ColorRGB(
            (static_cast<uint16_t>(r) * brightness) / 255,
            (static_cast<uint16_t>(g) * brightness) / 255,
            (static_cast<uint16_t>(b) * brightness) / 255
        );
    }
};

// -------------------------------------------------------------
// Identificadores de Efeitos Visuais
// -------------------------------------------------------------
enum class EffectId : uint8_t {
    NONE = 0,
    AMBIENT_DAY,
    AMBIENT_NIGHT,
    AMBIENT_WAITING,
    WEATHER_RAIN,
    WEATHER_STORM,
    SAFETY_CAR,
    VSC,
    FLAG_YELLOW,
    FLAG_RED,
    FLAG_GREEN_SURGE,
    PIT_LANE,
    OVERTAKE_BOOST,
    ACTIVE_AERO_STRAIGHT,
    INCIDENT_CRASH,
    INCIDENT_ENGINE_BLOWN,
    CHEQUERED_VICTORY,
    SHIFT_FLASH,
    CUSTOM_TEST_PATTERN
};

} // namespace Effects
