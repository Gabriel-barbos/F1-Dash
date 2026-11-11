#include "effect_engine.h"
#include <math.h>

namespace Effects {

EffectEngine::EffectEngine(Leds::ILedController& ledController)
    : leds_(ledController) {}

void EffectEngine::begin() {
    for (size_t i = 0; i < MAX_RAINDROPS; ++i) {
        leftDrops_[i].active = false;
        rightDrops_[i].active = false;
    }
    lightningActive_ = false;
    nextLightningMs_ = 0;
    Serial.println("[Effect Engine] Motor de efeitos F1 e ambiente inicializado (v2 Suavizado)");
}

void EffectEngine::render(uint32_t nowMs, const State::RaceStateSnapshot& telemetry, const State::ActiveEventState& eventState) {
    uint32_t startMs = eventState.effectStartTimeMs;

    switch (eventState.primaryEffect) {
        case EffectId::AMBIENT_DAY:
            renderAmbientDay(nowMs, startMs);
            break;
        case EffectId::AMBIENT_NIGHT:
            renderAmbientNight(nowMs, startMs);
            break;
        case EffectId::AMBIENT_WAITING:
            renderAmbientWaiting(nowMs, startMs);
            break;
        case EffectId::WEATHER_RAIN:
            renderRain(nowMs, startMs, false);
            break;
        case EffectId::WEATHER_STORM:
            renderRain(nowMs, startMs, true);
            break;
        case EffectId::OVERTAKE_BOOST:
            renderOvertake(nowMs, startMs);
            break;
        case EffectId::ACTIVE_AERO_STRAIGHT:
            renderActiveAero(nowMs, startMs, telemetry.rpmPercent);
            break;
        case EffectId::SAFETY_CAR:
            renderSafetyCar(nowMs, startMs, false);
            break;
        case EffectId::VSC:
            renderSafetyCar(nowMs, startMs, true);
            break;
        case EffectId::FLAG_YELLOW:
            renderFlagYellow(nowMs, startMs);
            break;
        case EffectId::FLAG_RED:
            renderFlagRed(nowMs, startMs);
            break;
        case EffectId::FLAG_GREEN_SURGE:
            renderGreenSurge(nowMs, startMs);
            break;
        case EffectId::PIT_LANE:
            renderPitLane(nowMs, startMs);
            break;
        case EffectId::INCIDENT_CRASH:
            renderCrash(nowMs, startMs);
            break;
        case EffectId::INCIDENT_ENGINE_BLOWN:
            renderEngineBlown(nowMs, startMs);
            break;
        case EffectId::CHEQUERED_VICTORY:
            renderChequeredVictory(nowMs, startMs);
            break;
        case EffectId::SHIFT_FLASH:
            renderShiftFlash(nowMs, startMs);
            break;
        case EffectId::CUSTOM_TEST_PATTERN:
            renderDiagnosticPattern(nowMs);
            break;
        default:
            renderAmbientDay(nowMs, startMs);
            break;
    }

    // Aplica o overlay de Shift Flash periférico se estiver ativo na telemetria
    if (eventState.overlayShiftFlash && eventState.primaryEffect != EffectId::SHIFT_FLASH) {
        applyShiftFlashOverlay(nowMs);
    }

    // Atualiza fisicamente os barramentos de LED
    leds_.show();
}

// -------------------------------------------------------------
// 1. Iluminação Ambiente: DAY e NIGHT (Mantidos conforme aprovado)
// -------------------------------------------------------------

void EffectEngine::renderAmbientDay(uint32_t nowMs, uint32_t effectStartMs) {
    // Respiração orgânica lenta (ciclo de 8 segundos)
    float phase = (nowMs % 8000) / 8000.0f;
    float breathe = 0.88f + 0.12f * sinf(phase * 2.0f * M_PI);
    uint8_t warmVal = static_cast<uint8_t>(210 * breathe);

    ColorRGBCCT dayColor(0, 0, 0, warmVal, 0); // Canal WW dedicado
    leds_.fillLeft(dayColor);
    leds_.fillRight(dayColor);

    // Fita analógica complementa com luz branca morna suave
    uint8_t rgbVal = static_cast<uint8_t>(180 * breathe);
    leds_.setAnalogRgb(ColorRGB::WarmWhite(rgbVal));
}

void EffectEngine::renderAmbientNight(uint32_t nowMs, uint32_t effectStartMs) {
    float phase = (nowMs % 10000) / 10000.0f;
    float breathe = 0.85f + 0.15f * sinf(phase * 2.0f * M_PI);
    uint8_t coldVal = static_cast<uint8_t>(190 * breathe);

    ColorRGBCCT nightColor(0, 0, 20, 0, coldVal); // CW com toque sutil de azul
    leds_.fillLeft(nightColor);
    leds_.fillRight(nightColor);

    uint8_t rgbVal = static_cast<uint8_t>(150 * breathe);
    leds_.setAnalogRgb(ColorRGB::ColdWhite(rgbVal));
}

void EffectEngine::renderAmbientWaiting(uint32_t nowMs, uint32_t effectStartMs) {
    // Modo Standby / Waiting F1 (Lobby & Loading):
    // Onda suave e estável em Âmbar/Vermelho F1 de Grid indicando que o celular e o PS5 estão conectados aguardando a largada
    uint16_t leftCount = leds_.getLeftCount();
    uint16_t rightCount = leds_.getRightCount();
    float elapsedSec = (nowMs - effectStartMs) / 1000.0f;

    ColorRGBCCT baseGridWarm(180, 25, 0, 60, 0);
    ColorRGBCCT pulseF1Red(230, 0, 0, 10, 0);

    for (uint16_t i = 0; i < leftCount; ++i) {
        float wave = (sinf((i * 0.08f) - (elapsedSec * 1.6f)) + 1.0f) * 0.5f;
        leds_.setLeftPixel(i, ColorRGBCCT::lerp(baseGridWarm, pulseF1Red, wave));
    }
    for (uint16_t i = 0; i < rightCount; ++i) {
        float wave = (sinf((i * 0.08f) - (elapsedSec * 1.6f)) + 1.0f) * 0.5f;
        leds_.setRightPixel(i, ColorRGBCCT::lerp(baseGridWarm, pulseF1Red, wave));
    }

    // Fita 12V analógica permanece em Vermelho F1 / Âmbar sólido (100% no canal dominante)
    leds_.setAnalogRgb(ColorRGB(254, 30, 0));
}

// -------------------------------------------------------------
// 2. Chuva Dinâmica e Tempestade (Refeito do zero: Fundo Azul Oscilante + Gotas Fade-In/Out + Relâmpagos)
// -------------------------------------------------------------

static float computeDropEnvelope(float t) {
    if (t <= 0.0f || t >= 1.0f) return 0.0f;
    // 0.00 a 0.35 -> Fade-in suave
    if (t < 0.35f) {
        return sinf((t / 0.35f) * (M_PI * 0.5f));
    }
    // 0.35 a 0.50 -> Sustentação na intensidade máxima
    if (t < 0.50f) {
        return 1.0f;
    }
    // 0.50 a 1.00 -> Fade-out lento e orgânico
    return cosf(((t - 0.50f) / 0.50f) * (M_PI * 0.5f));
}

void EffectEngine::renderRain(uint32_t nowMs, uint32_t effectStartMs, bool isStorm) {
    uint16_t leftCount = leds_.getLeftCount();
    uint16_t rightCount = leds_.getRightCount();
    float elapsedSec = nowMs / 1000.0f;

    // 1. Fundo: Fita oscilando suavemente em tons de azul
    float oscSpeed = isStorm ? 1.5f : 0.95f;
    ColorRGBCCT deepBlue = isStorm ? ColorRGBCCT(0, 12, 55, 0, 5)  : ColorRGBCCT(0, 6, 32, 0, 2);
    ColorRGBCCT midBlue  = isStorm ? ColorRGBCCT(8, 50, 140, 0, 20) : ColorRGBCCT(0, 26, 85, 0, 10);

    for (uint16_t i = 0; i < leftCount; ++i) {
        float wave = (sinf((i * 0.09f) + (elapsedSec * oscSpeed)) + 1.0f) * 0.5f;
        leds_.setLeftPixel(i, ColorRGBCCT::lerp(deepBlue, midBlue, wave));
    }
    for (uint16_t i = 0; i < rightCount; ++i) {
        float wave = (sinf((i * 0.09f) + (elapsedSec * oscSpeed) + 1.2f) + 1.0f) * 0.5f;
        leds_.setRightPixel(i, ColorRGBCCT::lerp(deepBlue, midBlue, wave));
    }

    // Fita analógica oscila em azul profundo acompanhando a atmosfera
    float analogPulse = (sinf(elapsedSec * oscSpeed) + 1.0f) * 0.5f;
    if (isStorm) {
        leds_.setAnalogRgb(ColorRGB::lerp(ColorRGB(0, 18, 65), ColorRGB(0, 50, 160), analogPulse));
    } else {
        leds_.setAnalogRgb(ColorRGB::lerp(ColorRGB(0, 10, 40), ColorRGB(0, 28, 95), analogPulse));
    }

    // 2. Spawn de novas gotas aleatórias com ciclo lento (fade-in -> pico -> fade-out)
    uint32_t spawnInterval = isStorm ? 220 : 420;
    size_t maxActiveDrops = isStorm ? MAX_RAINDROPS : 7;

    if (nowMs - lastRainSpawnMs_ >= spawnInterval) {
        lastRainSpawnMs_ = nowMs;

        // Tenta criar uma gota na fita esquerda
        for (size_t i = 0; i < maxActiveDrops; ++i) {
            if (!leftDrops_[i].active) {
                leftDrops_[i].centerIndex = random(1, leftCount > 2 ? leftCount - 1 : 1);
                leftDrops_[i].spawnTimeMs = nowMs;
                leftDrops_[i].durationMs = isStorm ? random(1300, 1900) : random(1900, 2700);
                leftDrops_[i].maxBrightness = isStorm ? random(200, 255) : random(150, 210);
                leftDrops_[i].active = true;
                break;
            }
        }

        // Tenta criar uma gota na fita direita
        for (size_t i = 0; i < maxActiveDrops; ++i) {
            if (!rightDrops_[i].active) {
                rightDrops_[i].centerIndex = random(1, rightCount > 2 ? rightCount - 1 : 1);
                rightDrops_[i].spawnTimeMs = nowMs;
                rightDrops_[i].durationMs = isStorm ? random(1300, 1900) : random(1900, 2700);
                rightDrops_[i].maxBrightness = isStorm ? random(200, 255) : random(150, 210);
                rightDrops_[i].active = true;
                break;
            }
        }
    }

    // 3. Renderiza as gotas com fade-in, intensidade máxima e fade-out suaves
    auto renderDropsOnStrip = [&](Raindrop* drops, uint16_t count, bool isLeft) {
        for (size_t i = 0; i < MAX_RAINDROPS; ++i) {
            if (!drops[i].active) continue;

            uint32_t age = nowMs - drops[i].spawnTimeMs;
            if (age >= drops[i].durationMs) {
                drops[i].active = false;
                continue;
            }

            float t = static_cast<float>(age) / static_cast<float>(drops[i].durationMs);
            float env = computeDropEnvelope(t);

            uint8_t peakBri = drops[i].maxBrightness;
            ColorRGBCCT dropColor(
                isStorm ? 50 : 20,
                isStorm ? 185 : 135,
                255,
                0,
                static_cast<uint8_t>((peakBri * (isStorm ? 80 : 55)) / 100)
            );

            // Desenha a gota com núcleo e bordas suaves (3 LEDs)
            for (int offset = -1; offset <= 1; ++offset) {
                int idx = drops[i].centerIndex + offset;
                if (idx >= 0 && idx < count) {
                    float localWeight = (offset == 0) ? 1.0f : 0.50f;
                    float blend = env * localWeight;
                    // Reconstrói a cor base daquele pixel para mesclar suavemente
                    float wave = (sinf((idx * 0.09f) + (elapsedSec * oscSpeed) + (isLeft ? 0.0f : 1.2f)) + 1.0f) * 0.5f;
                    ColorRGBCCT bg = ColorRGBCCT::lerp(deepBlue, midBlue, wave);
                    ColorRGBCCT finalCol = ColorRGBCCT::lerp(bg, dropColor, blend);
                    if (isLeft) leds_.setLeftPixel(idx, finalCol);
                    else        leds_.setRightPixel(idx, finalCol);
                }
            }
        }
    };

    renderDropsOnStrip(leftDrops_, leftCount, true);
    renderDropsOnStrip(rightDrops_, rightCount, false);

    // 4. Relâmpagos exclusivos para Tempestade (Com duplo pulso natural e fade-out suave)
    if (isStorm) {
        if (nextLightningMs_ == 0) {
            nextLightningMs_ = nowMs + random(2000, 4500);
        }
        if (!lightningActive_ && nowMs >= nextLightningMs_) {
            lightningActive_ = true;
            lightningStartMs_ = nowMs;
            nextLightningMs_ = nowMs + random(3500, 6800);
        }

        if (lightningActive_) {
            uint32_t lAge = nowMs - lightningStartMs_;
            float lEnv = 0.0f;

            if (lAge < 80) {
                // Primeiro clarão rápido
                lEnv = (lAge / 80.0f) * 0.85f;
            } else if (lAge < 150) {
                // Breve vale entre descargas
                lEnv = 0.25f;
            } else if (lAge < 230) {
                // Descarga principal máxima
                lEnv = 1.0f;
            } else if (lAge < 700) {
                // Fade-out suave do clarão no céu
                float decay = 1.0f - ((lAge - 230) / 470.0f);
                lEnv = decay * decay;
            } else {
                lightningActive_ = false;
            }

            if (lEnv > 0.01f) {
                ColorRGBCCT flashWhite(160, 210, 255, 0, 255);
                for (uint16_t i = 0; i < leftCount; ++i) {
                    leds_.setLeftPixel(i, ColorRGBCCT::lerp(midBlue, flashWhite, lEnv));
                }
                for (uint16_t i = 0; i < rightCount; ++i) {
                    leds_.setRightPixel(i, ColorRGBCCT::lerp(midBlue, flashWhite, lEnv));
                }
                leds_.setAnalogRgb(ColorRGB::lerp(ColorRGB(0, 40, 130), ColorRGB(90, 170, 255), lEnv));
            }
        }
    } else {
        lightningActive_ = false;
    }
}

// -------------------------------------------------------------
// 3. Overtake / Boost (Base Azul Sólida + Feixe Azul-Claro/Ciano <<<<<>>>>>)
// -------------------------------------------------------------

void EffectEngine::renderOvertake(uint32_t nowMs, uint32_t effectStartMs) {
    uint16_t leftCount = leds_.getLeftCount();
    uint16_t rightCount = leds_.getRightCount();

    float elapsedSec = (nowMs - effectStartMs) / 1000.0f;

    // Fita inteira acesa em Azul Royal F1 sólido (sem fade global)
    ColorRGBCCT solidBaseBlue(0, 35, 210, 0, 0);
    // Segundo tom mais claro/elétrico (Azul-Ciano Gelo) que viaja do centro para as bordas
    ColorRGBCCT speedToneCyan(25, 225, 255, 0, 100);

    // Período espacial de 8 segmentos e velocidade suave (0.55 ciclos/s -> ~4.4 segmentos/s)
    constexpr float spatialPeriod = 8.0f;
    constexpr float cycleSpeed = 0.55f;

    auto renderSpeedWave = [&](uint16_t count, bool isLeft) {
        for (uint16_t i = 0; i < count; ++i) {
            float pos = (static_cast<float>(i) / spatialPeriod) - (elapsedSec * cycleSpeed);
            float phase = pos - floorf(pos); // [0.0, 1.0)
            float dist = fabsf(phase - 0.5f) * 2.0f; // 0.0 no centro do feixe, 1.0 fora

            float pulse = 0.0f;
            if (dist < 0.45f) {
                float norm = dist / 0.45f;
                pulse = 0.5f * (1.0f + cosf(norm * M_PI)); // Sino suave que desliza pelos pixels
            }

            ColorRGBCCT col = ColorRGBCCT::lerp(solidBaseBlue, speedToneCyan, pulse);
            if (isLeft) leds_.setLeftPixel(i, col);
            else        leds_.setRightPixel(i, col);
        }
    };

    renderSpeedWave(leftCount, true);
    renderSpeedWave(rightCount, false);

    // Fita analógica 12V mantém o azul sólido de base com leve toque constante
    leds_.setAnalogRgb(ColorRGB(0, 45, 205));
}

// -------------------------------------------------------------
// 4. Active Aero X-Mode / Straight (Base Roxa Sólida + Feixe Lilás/Magenta <<<<<>>>>>)
// -------------------------------------------------------------

void EffectEngine::renderActiveAero(uint32_t nowMs, uint32_t effectStartMs, uint8_t rpmPercent) {
    uint16_t leftCount = leds_.getLeftCount();
    uint16_t rightCount = leds_.getRightCount();

    float elapsedSec = (nowMs - effectStartMs) / 1000.0f;

    // Fita inteira acesa em Roxo Profundo sólido (sem apagar nem fazer fade global)
    ColorRGBCCT solidBasePurple(125, 0, 205, 0, 0);
    // Segundo tom mais claro da mesma família (Lilás / Magenta Aero) viajando do centro às bordas
    ColorRGBCCT speedToneLilac(255, 65, 255, 0, 95);

    constexpr float spatialPeriod = 8.0f;
    float cycleSpeed = 0.60f + (rpmPercent / 100.0f) * 0.20f; // Velocidade suave e fluida

    auto renderAeroWave = [&](uint16_t count, bool isLeft) {
        for (uint16_t i = 0; i < count; ++i) {
            float pos = (static_cast<float>(i) / spatialPeriod) - (elapsedSec * cycleSpeed);
            float phase = pos - floorf(pos);
            float dist = fabsf(phase - 0.5f) * 2.0f;

            float pulse = 0.0f;
            if (dist < 0.45f) {
                float norm = dist / 0.45f;
                pulse = 0.5f * (1.0f + cosf(norm * M_PI));
            }

            ColorRGBCCT col = ColorRGBCCT::lerp(solidBasePurple, speedToneLilac, pulse);
            if (isLeft) leds_.setLeftPixel(i, col);
            else        leds_.setRightPixel(i, col);
        }
    };

    renderAeroWave(leftCount, true);
    renderAeroWave(rightCount, false);

    // Fita analógica 12V permanece acesa em roxo sólido
    leds_.setAnalogRgb(ColorRGB(130, 0, 205));
}

// -------------------------------------------------------------
// 5. Safety Car / VSC / Bandeira Amarela (Pulsar Suave e Confortável)
// -------------------------------------------------------------

void EffectEngine::renderSafetyCar(uint32_t nowMs, uint32_t effectStartMs, bool isVsc) {
    // Período mais lento e sem saltos de fase:
    // Safety Car = 2800ms (~0.36 Hz), VSC = 2100ms (~0.48 Hz, mesmo conforto do falha de motor)
    uint32_t periodMs = isVsc ? 2100 : 2800;
    float phase = ((nowMs - effectStartMs) % periodMs) / static_cast<float>(periodMs);
    float pulse = (sinf(phase * 2.0f * M_PI) + 1.0f) * 0.5f;

    uint8_t intensity = static_cast<uint8_t>(45 + 165 * pulse);
    ColorRGBCCT yellow = ColorRGBCCT::Yellow(intensity);

    leds_.fillBoth(yellow);
    leds_.setAnalogRgb(ColorRGB(intensity, (intensity * 170) / 255, 0));
}

void EffectEngine::renderFlagYellow(uint32_t nowMs, uint32_t effectStartMs) {
    // Pulsar amarelo suave para ambientar a bandeira na medida certa (ciclo de 2200ms)
    uint32_t periodMs = 2200;
    float phase = ((nowMs - effectStartMs) % periodMs) / static_cast<float>(periodMs);
    float pulse = (sinf(phase * 2.0f * M_PI) + 1.0f) * 0.5f;

    uint8_t intensity = static_cast<uint8_t>(50 + 165 * pulse);
    leds_.fillBoth(ColorRGBCCT::Yellow(intensity));
    leds_.setAnalogRgb(ColorRGB(intensity, (intensity * 165) / 255, 0));
}

// -------------------------------------------------------------
// 6. Bandeira Vermelha (Pulsar Suave) e Motor Quebrado (Mantido Intacto)
// -------------------------------------------------------------

void EffectEngine::renderFlagRed(uint32_t nowMs, uint32_t effectStartMs) {
    // Substituído o strobe rápido por um pulsar senoidal suave e imponente (ciclo de 1800ms)
    uint32_t periodMs = 1800;
    float phase = ((nowMs - effectStartMs) % periodMs) / static_cast<float>(periodMs);
    float pulse = (sinf(phase * 2.0f * M_PI) + 1.0f) * 0.5f;

    uint8_t intensity = static_cast<uint8_t>(40 + 190 * pulse);
    leds_.fillBoth(ColorRGBCCT::Red(intensity));
    leds_.setAnalogRgb(ColorRGB(intensity, 0, 0));
}

void EffectEngine::renderEngineBlown(uint32_t nowMs, uint32_t effectStartMs) {
    // Mantido exatamente como aprovado: pulsação profunda e lenta de motor danificado (0.5 Hz / 2000ms)
    float phase = ((nowMs - effectStartMs) % 2000) / 2000.0f;
    float pulse = (sinf(phase * 2.0f * M_PI) + 1.0f) * 0.5f;

    uint8_t intensity = static_cast<uint8_t>(30 + 150 * pulse);
    leds_.fillBoth(ColorRGBCCT::Red(intensity));
    leds_.setAnalogRgb(ColorRGB(intensity, 0, 0));
}

// -------------------------------------------------------------
// 7. Green Flag Surge (Pulso Suave de Bandeira Verde)
// -------------------------------------------------------------

void EffectEngine::renderGreenSurge(uint32_t nowMs, uint32_t effectStartMs) {
    uint32_t dur = Config::Firmware::GREEN_FLAG_SURGE_DURATION_MS;
    uint32_t elapsed = (dur > 0) ? ((nowMs - effectStartMs) % dur) : (nowMs - effectStartMs);
    float progress = elapsed / static_cast<float>(dur);
    if (progress > 1.0f) progress = 1.0f;

    // Fade-in rápido nos primeiros 15% e fade-out macio no restante
    float env = (progress < 0.15f) ? (progress / 0.15f) : cosf(((progress - 0.15f) / 0.85f) * (M_PI * 0.5f));
    uint8_t intensity = static_cast<uint8_t>(30 + 215 * env);
    ColorRGBCCT green = ColorRGBCCT::Green(intensity);

    leds_.fillBoth(green);
    leds_.setAnalogRgb(ColorRGB::Green(intensity));
}

// -------------------------------------------------------------
// 8. Boxes (Pit Limiter e In Pits - Mais Lento e com Transição Suave)
// -------------------------------------------------------------

void EffectEngine::renderPitLane(uint32_t nowMs, uint32_t effectStartMs) {
    // Ciclo reduzido de 320ms para 1400ms com crossfade suave entre os blocos âmbar e magenta
    uint32_t cycleMs = 1400;
    float phase = ((nowMs - effectStartMs) % cycleMs) / static_cast<float>(cycleMs);
    float blend = (sinf(phase * 2.0f * M_PI) + 1.0f) * 0.5f;
    // Curva smoothstep para alternância cadenciada mas sem corte seco
    blend = blend * blend * (3.0f - 2.0f * blend);

    ColorRGBCCT colAmber = ColorRGBCCT::Amber(210);
    ColorRGBCCT colMagenta = ColorRGBCCT(170, 0, 65);

    ColorRGBCCT stateA = ColorRGBCCT::lerp(colAmber, colMagenta, blend);
    ColorRGBCCT stateB = ColorRGBCCT::lerp(colMagenta, colAmber, blend);

    uint16_t leftCount = leds_.getLeftCount();
    for (uint16_t i = 0; i < leftCount; ++i) {
        bool evenBlock = ((i / 5) % 2) == 0;
        leds_.setLeftPixel(i, evenBlock ? stateA : stateB);
    }

    uint16_t rightCount = leds_.getRightCount();
    for (uint16_t i = 0; i < rightCount; ++i) {
        bool evenBlock = ((i / 5) % 2) == 0;
        leds_.setRightPixel(i, evenBlock ? stateA : stateB);
    }

    leds_.setAnalogRgb(ColorRGB::lerp(ColorRGB(170, 75, 0), ColorRGB(140, 0, 55), blend));
}

// -------------------------------------------------------------
// 9. Batida / Impacto (Flash Momentâneo Único -> Vermelho de Dano -> Fade-Out)
// -------------------------------------------------------------

void EffectEngine::renderCrash(uint32_t nowMs, uint32_t effectStartMs) {
    uint32_t elapsed = nowMs - effectStartMs;
    uint32_t totalDur = Config::Firmware::CRASH_EFFECT_DURATION_MS; // 3500 ms

    if (elapsed >= totalDur) {
        // Fim do efeito momentâneo de impacto: mantém apagado/calmo até o gerenciador retornar
        leds_.fillBoth(ColorRGBCCT::Black());
        leds_.setAnalogRgb(ColorRGB::Black());
        return;
    }

    if (elapsed < 220) {
        // Fase 1 (0 a 220ms): Um único Flash forte de impacto que já transiciona para vermelho (sem piscar!)
        float t = elapsed / 220.0f;
        ColorRGBCCT impactFlash(255, 220, 180, 220, 220);
        ColorRGBCCT damageRed = ColorRGBCCT::Red(240);
        ColorRGBCCT current = ColorRGBCCT::lerp(impactFlash, damageRed, t);

        leds_.fillBoth(current);
        leds_.setAnalogRgb(ColorRGB::Red(255));
    } else if (elapsed < 2300) {
        // Fase 2 (220ms a 2300ms): "Tela Vermelha de Dano" — mantém vermelho profundo com uma pulsação dramática lenta
        float t = (elapsed - 220) / 2080.0f;
        float heartbeat = sinf(t * M_PI); // Sobe suavemente até o meio e desce
        uint8_t redVal = static_cast<uint8_t>(145 + 95 * heartbeat);

        leds_.fillBoth(ColorRGBCCT::Red(redVal));
        leds_.setAnalogRgb(ColorRGB::Red(redVal));
    } else {
        // Fase 3 (2300ms a 3500ms): Fade-out suave da vermelhidão de dano
        float t = (elapsed - 2300) / static_cast<float>(totalDur - 2300);
        float fade = cosf(t * (M_PI * 0.5f)); // 1.0 -> 0.0 suavemente
        uint8_t redVal = static_cast<uint8_t>(145 * fade);

        leds_.fillBoth(ColorRGBCCT::Red(redVal));
        leds_.setAnalogRgb(ColorRGB::Red(redVal));
    }
}

// -------------------------------------------------------------
// 10. Bandeira Quadriculada (Vitória / Celebração)
// -------------------------------------------------------------

void EffectEngine::renderChequeredVictory(uint32_t nowMs, uint32_t effectStartMs) {
    uint32_t cycleMs = 1000;
    float phase = ((nowMs - effectStartMs) % cycleMs) / static_cast<float>(cycleMs);
    float blend = (sinf(phase * 2.0f * M_PI) + 1.0f) * 0.5f;
    blend = blend * blend * (3.0f - 2.0f * blend);

    ColorRGBCCT white = ColorRGBCCT::ColdWhite(220);
    ColorRGBCCT dark  = ColorRGBCCT::WarmWhite(20);

    ColorRGBCCT colA = ColorRGBCCT::lerp(white, dark, blend);
    ColorRGBCCT colB = ColorRGBCCT::lerp(dark, white, blend);

    uint16_t leftCount = leds_.getLeftCount();
    for (uint16_t i = 0; i < leftCount; ++i) {
        bool evenBlock = ((i / 4) % 2) == 0;
        leds_.setLeftPixel(i, evenBlock ? colA : colB);
    }

    uint16_t rightCount = leds_.getRightCount();
    for (uint16_t i = 0; i < rightCount; ++i) {
        bool evenBlock = ((i / 4) % 2) == 0;
        leds_.setRightPixel(i, evenBlock ? colA : colB);
    }

    uint8_t amberVal = static_cast<uint8_t>(80 + 120 * blend);
    leds_.setAnalogRgb(ColorRGB(amberVal, (amberVal * 80) / 255, 0));
}

// -------------------------------------------------------------
// 11. Shift Flash (Efeito Completo de Subida de Giro + Pulso de Troca de Marcha)
// -------------------------------------------------------------

static ColorRGBCCT getRpmBarColor(float ratio) {
    // 0.0 a 0.45: Verde F1 -> 0.45 a 0.78: Vermelho/Âmbar -> 0.78 a 1.0: Azul/Ciano Shift
    if (ratio < 0.45f) {
        return ColorRGBCCT(0, 210, 35, 0, 0);
    } else if (ratio < 0.78f) {
        float t = (ratio - 0.45f) / 0.33f;
        return ColorRGBCCT::lerp(ColorRGBCCT(220, 120, 0, 0, 0), ColorRGBCCT(255, 20, 0, 0, 0), t);
    } else {
        float t = (ratio - 0.78f) / 0.22f;
        return ColorRGBCCT::lerp(ColorRGBCCT(160, 0, 255, 0, 30), ColorRGBCCT(40, 180, 255, 0, 160), t);
    }
}

void EffectEngine::renderShiftFlash(uint32_t nowMs, uint32_t effectStartMs) {
    uint16_t leftCount = leds_.getLeftCount();
    uint16_t rightCount = leds_.getRightCount();

    // Ciclo completo de subida de marcha e shift pulse: 2200 ms
    uint32_t cycleMs = 2200;
    uint32_t elapsed = (nowMs - effectStartMs) % cycleMs;

    ColorRGBCCT bgDim(0, 8, 22, 0, 4);

    if (elapsed < 1400) {
        // Fase 1 (0 a 1400ms): Barra de RPM subindo suavemente da base até o topo
        float rpmProgress = elapsed / 1400.0f;
        // Curva levemente acelerada
        rpmProgress = rpmProgress * (2.0f - rpmProgress);

        auto drawRpmStrip = [&](uint16_t count, bool isLeft) {
            float headPos = rpmProgress * count;
            for (uint16_t i = 0; i < count; ++i) {
                float ratio = static_cast<float>(i) / static_cast<float>(count);
                ColorRGBCCT barCol = getRpmBarColor(ratio);

                float fill = 0.0f;
                if (i + 1 <= headPos) {
                    fill = 1.0f;
                } else if (i < headPos + 2.0f) {
                    // Borda suave de 2 pixels na ponta da barra
                    fill = 1.0f - ((i - headPos + 1.0f) / 3.0f);
                    if (fill < 0.0f) fill = 0.0f;
                    if (fill > 1.0f) fill = 1.0f;
                }

                ColorRGBCCT out = ColorRGBCCT::lerp(bgDim, barCol, fill);
                if (isLeft) leds_.setLeftPixel(i, out);
                else        leds_.setRightPixel(i, out);
            }
        };

        drawRpmStrip(leftCount, true);
        drawRpmStrip(rightCount, false);

        // Backlight acompanha a cor do giro atual
        ColorRGBCCT currentZone = getRpmBarColor(rpmProgress);
        leds_.setAnalogRgb(ColorRGB(currentZone.r / 2, currentZone.g / 2, currentZone.b / 2));

    } else if (elapsed < 1950) {
        // Fase 2 (1400ms a 1950ms): Ponto Ótimo de Troca (Shift Flash suave em Ciano/Branco Frio)
        float t = (elapsed - 1400) / 550.0f;
        float shiftPulse = sinf(t * M_PI); // Sobe a 100% no meio e desce suavemente

        ColorRGBCCT shiftPeak(60, 195, 255, 0, 220);
        for (uint16_t i = 0; i < leftCount; ++i) {
            float ratio = static_cast<float>(i) / static_cast<float>(leftCount);
            ColorRGBCCT baseBar = getRpmBarColor(ratio);
            leds_.setLeftPixel(i, ColorRGBCCT::lerp(baseBar, shiftPeak, shiftPulse));
        }
        for (uint16_t i = 0; i < rightCount; ++i) {
            float ratio = static_cast<float>(i) / static_cast<float>(rightCount);
            ColorRGBCCT baseBar = getRpmBarColor(ratio);
            leds_.setRightPixel(i, ColorRGBCCT::lerp(baseBar, shiftPeak, shiftPulse));
        }

        uint8_t ab = static_cast<uint8_t>(80 + 175 * shiftPulse);
        uint8_t ag = static_cast<uint8_t>(40 + 130 * shiftPulse);
        leds_.setAnalogRgb(ColorRGB(20, ag, ab));

    } else {
        // Fase 3 (1950ms a 2200ms): Queda de giro após engatar a próxima marcha
        float t = (elapsed - 1950) / 250.0f;
        float fade = 1.0f - t;
        for (uint16_t i = 0; i < leftCount; ++i) {
            float ratio = static_cast<float>(i) / static_cast<float>(leftCount);
            leds_.setLeftPixel(i, ColorRGBCCT::lerp(bgDim, getRpmBarColor(ratio), fade * 0.4f));
        }
        for (uint16_t i = 0; i < rightCount; ++i) {
            float ratio = static_cast<float>(i) / static_cast<float>(rightCount);
            leds_.setRightPixel(i, ColorRGBCCT::lerp(bgDim, getRpmBarColor(ratio), fade * 0.4f));
        }
        leds_.setAnalogRgb(ColorRGB(0, 15, 40));
    }
}

void EffectEngine::applyShiftFlashOverlay(uint32_t nowMs) {
    // Ilumina suavemente o terço superior (18 pixels do topo) em ciano/branco de shift light
    uint16_t leftCount = leds_.getLeftCount();
    uint16_t rightCount = leds_.getRightCount();

    float pulse = (sinf((nowMs % 400) / 400.0f * 2.0f * M_PI) + 1.0f) * 0.5f;
    float strength = 0.45f + 0.55f * pulse;

    ColorRGBCCT shiftColor(
        static_cast<uint8_t>(70 * strength),
        static_cast<uint8_t>(200 * strength),
        static_cast<uint8_t>(255 * strength),
        0,
        static_cast<uint8_t>(210 * strength)
    );

    uint16_t zoneLeft = (leftCount > 18) ? 18 : leftCount;
    for (uint16_t j = 0; j < zoneLeft; ++j) {
        uint16_t idx = leftCount - zoneLeft + j;
        float grad = static_cast<float>(j + 1) / static_cast<float>(zoneLeft);
        leds_.setLeftPixel(idx, shiftColor.scaled(static_cast<uint8_t>(255 * grad)));
    }

    uint16_t zoneRight = (rightCount > 18) ? 18 : rightCount;
    for (uint16_t j = 0; j < zoneRight; ++j) {
        uint16_t idx = rightCount - zoneRight + j;
        float grad = static_cast<float>(j + 1) / static_cast<float>(zoneRight);
        leds_.setRightPixel(idx, shiftColor.scaled(static_cast<uint8_t>(255 * grad)));
    }
}

// -------------------------------------------------------------
// 12. Padrão de Diagnóstico de Hardware (Sem Telemetria)
// -------------------------------------------------------------

void EffectEngine::renderDiagnosticPattern(uint32_t nowMs) {
    uint32_t cycle = (nowMs / 1500) % 3;

    if (cycle == 0) {
        leds_.fillLeft(ColorRGBCCT::Red(200));
        leds_.fillRight(ColorRGBCCT::Blue(200));
        leds_.setAnalogRgb(ColorRGB::Green(200));
    } else if (cycle == 1) {
        leds_.fillLeft(ColorRGBCCT::Green(200));
        leds_.fillRight(ColorRGBCCT::Yellow(200));
        leds_.setAnalogRgb(ColorRGB::Blue(200));
    } else {
        leds_.fillLeft(ColorRGBCCT::WarmWhite(220));
        leds_.fillRight(ColorRGBCCT::ColdWhite(220));
        leds_.setAnalogRgb(ColorRGB::WarmWhite(180));
    }
}

} // namespace Effects
