import {
  CockpitTelemetryState,
  SafetyCarStatus,
  PitStatus,
  Weather
} from '@f1-dash/telemetry-core';
import {
  Esp32RaceStatePayload,
  AmbientLightingMode,
  WeatherLightingMode,
  TrackStatusLightingMode,
  ActiveAeroLightingMode
} from './types.js';

export class LightingStateBuilder {
  private prevSpeed: number = 0;
  private prevDamageSum: number = 0;
  private isCrashActive: boolean = false;
  private crashTimer: number = 0;

  /**
   * Converte a telemetria bruta do F1 25 no contrato de Estado de Iluminação limpo para o ESP32.
   */
  public buildState(telemetry: CockpitTelemetryState): Esp32RaceStatePayload {
    const now = Date.now();
    const speed = telemetry.speed ?? 0;

    // 1. Clima
    let weather: WeatherLightingMode = 'CLEAR';
    const rawWeather = telemetry.weather;
    if (rawWeather === Weather.LightRain || rawWeather === Weather.HeavyRain) {
      weather = 'RAIN';
    } else if (rawWeather === Weather.Storm) {
      weather = 'STORM';
    } else if (rawWeather === Weather.Overcast || rawWeather === Weather.LightCloud) {
      weather = 'CLOUDY';
    }

    // 2. Ambiente: Dia (branco quente) ou Noite (branco frio)
    // Temperatura de pista em corridas noturnas ou pistas frias costuma ser menor ou identificada
    const trackTemp = telemetry.trackTemperature ?? 30;
    const ambient: AmbientLightingMode = trackTemp < 26 ? 'NIGHT' : 'DAY';

    // 3. Estado da Pista e Bandeiras
    let trackStatus: TrackStatusLightingMode = 'CLEAR';
    if (telemetry.isRedFlagActive || telemetry.vehicleFiaFlags === 4) {
      trackStatus = 'RED';
    } else if (telemetry.safetyCarStatus === SafetyCarStatus.Full) {
      trackStatus = 'SAFETY_CAR';
    } else if (telemetry.safetyCarStatus === SafetyCarStatus.Virtual) {
      trackStatus = 'VSC';
    } else if (telemetry.vehicleFiaFlags === 3) {
      trackStatus = 'YELLOW';
    } else if (telemetry.vehicleFiaFlags === 1) {
      trackStatus = 'GREEN';
    }

    // 4. Detecção de Batida Violenta (Crash)
    const currentDamageSum =
      (telemetry.frontLeftWingDamage ?? 0) +
      (telemetry.frontRightWingDamage ?? 0) +
      (telemetry.rearWingDamage ?? 0) +
      (telemetry.floorDamage ?? 0);

    const damageDelta = currentDamageSum - this.prevDamageSum;
    const isSuddenDecel = this.prevSpeed >= 60 && speed <= 15 && (telemetry.brake ?? 0) < 0.85;

    if (damageDelta >= 5 || isSuddenDecel || telemetry.engineBlown) {
      this.isCrashActive = true;
      this.crashTimer = now + 3500; // Mantém o efeito de choque por 3.5 segundos
    } else if (now > this.crashTimer) {
      this.isCrashActive = false;
    }

    this.prevSpeed = speed;
    this.prevDamageSum = currentDamageSum;

    // 5. Modo Reta (Active Aero 2026 / DRS)
    let activeAero: ActiveAeroLightingMode = 'OFF';
    if (telemetry.activeAeroMode === 1) {
      activeAero = 'X_MODE_STRAIGHT'; // Modo de reta (animação speed roxa)
    } else if (telemetry.activeAeroMode === 2) {
      activeAero = 'Z_MODE_CORNER';
    } else if (telemetry.drsActive) {
      activeAero = 'X_MODE_STRAIGHT';
    }

    // 6. Boxes
    const inPits =
      telemetry.pitStatus === PitStatus.Pitting ||
      telemetry.pitStatus === PitStatus.InPitArea;
    const pitLimiter = !!telemetry.pitLimiterActive;

    // 7. RPM & Shift Lights
    const maxRpm = telemetry.maxRPM || 13500;
    const rpmPercent = Math.min(100, Math.max(0, ((telemetry.engineRPM ?? 0) / maxRpm) * 100));
    const revPercent = Math.max(rpmPercent, telemetry.revLightsPercent ?? 0);
    const shiftFlash = revPercent >= 96;

    return {
      ambient,
      weather,
      trackTempCelsius: trackTemp,
      trackStatus,
      chequeredFlag: !!(telemetry.totalLaps > 0 && telemetry.currentLapNum > telemetry.totalLaps),
      overtake: !!telemetry.overtakeActive,
      activeAero,
      drsActive: !!telemetry.drsActive,
      drsAllowed: !!telemetry.drsAllowed,
      pitLimiter,
      inPits,
      isCrash: this.isCrashActive,
      engineBlown: !!telemetry.engineBlown,
      rpmPercent: Math.round(rpmPercent),
      revLightsPercent: Math.round(revPercent),
      shiftFlash,
      timestamp: now
    };
  }
}

export const lightingStateBuilder = new LightingStateBuilder();
