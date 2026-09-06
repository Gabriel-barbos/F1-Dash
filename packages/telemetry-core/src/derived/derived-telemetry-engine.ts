import { FourWheelsTuple } from '../models/car-telemetry';

export interface DerivedCalculationInputs {
  // Carro
  engineRPM: number;
  maxRPM: number;
  revLightsPercent: number;

  // Tempos
  lastLapTimeMS: number;
  sector1TimeMS: number;
  sector2TimeMS: number;
  carPosition: number;
  gridPosition: number;

  // Combustível
  fuelInTank: number;
  fuelRemainingLaps: number;
  currentLap: number;
  totalLaps: number;

  // Pneus
  tyresWear: FourWheelsTuple<number>;
  tyresAgeLaps: number;
}

export interface DerivedOutputs {
  sector3TimeMS: number;
  positionsGainedLost: number;
  activeShiftLeds: number;
  isShiftFlash: boolean;
  fuelConsumptionPerLap: number;
  fuelDeltaLaps: number;
  tyreWearRatePerLap: FourWheelsTuple<number>;
  tyreEstimatedLapsRemaining: number;
}

export class DerivedTelemetryEngine {
  private initialFuelInTank: number | null = null;
  private lastObservedLap = 1;

  public reset(): void {
    this.initialFuelInTank = null;
    this.lastObservedLap = 1;
  }

  public update(inputs: DerivedCalculationInputs): DerivedOutputs {
    // 1. Shift Lights e RPM %
    const maxRpm = inputs.maxRPM > 0 ? inputs.maxRPM : 13500;
    const rpmPercent = Math.min(100, Math.max(0, (inputs.engineRPM / maxRpm) * 100));
    const effectiveRevPercent = Math.max(rpmPercent, inputs.revLightsPercent);
    const activeShiftLeds = Math.min(15, Math.max(0, Math.round((effectiveRevPercent / 100) * 15)));
    const isShiftFlash = effectiveRevPercent >= 96;

    // 2. Setor 3 (lastLap - S1 - S2)
    let sector3TimeMS = 0;
    if (inputs.lastLapTimeMS > 0 && inputs.sector1TimeMS > 0 && inputs.sector2TimeMS > 0) {
      const calculatedS3 = inputs.lastLapTimeMS - inputs.sector1TimeMS - inputs.sector2TimeMS;
      if (calculatedS3 > 0 && calculatedS3 < inputs.lastLapTimeMS) {
        sector3TimeMS = calculatedS3;
      }
    }

    // 3. Posições Ganhas/Perdidas (gridPosition - carPosition)
    let positionsGainedLost = 0;
    if (inputs.gridPosition > 0 && inputs.carPosition > 0) {
      positionsGainedLost = inputs.gridPosition - inputs.carPosition;
    }

    // 4. Combustível
    if (this.initialFuelInTank === null && inputs.fuelInTank > 0) {
      this.initialFuelInTank = inputs.fuelInTank;
    }

    let fuelConsumptionPerLap = 0;
    if (this.initialFuelInTank !== null && inputs.currentLap > 1) {
      const lapsCompleted = inputs.currentLap - 1;
      const fuelUsed = Math.max(0, this.initialFuelInTank - inputs.fuelInTank);
      fuelConsumptionPerLap = Number((fuelUsed / lapsCompleted).toFixed(2));
    }

    let fuelDeltaLaps = 0;
    if (inputs.totalLaps > 0 && inputs.fuelRemainingLaps > 0) {
      const lapsRemainingInRace = Math.max(0, inputs.totalLaps - inputs.currentLap);
      fuelDeltaLaps = Number((inputs.fuelRemainingLaps - lapsRemainingInRace).toFixed(1));
    }

    // 5. Pneus: Taxa de Desgaste e Voltas Restantes
    const safeAge = Math.max(1, inputs.tyresAgeLaps);
    const tyreWearRatePerLap: FourWheelsTuple<number> = [
      Number((inputs.tyresWear[0] / safeAge).toFixed(2)),
      Number((inputs.tyresWear[1] / safeAge).toFixed(2)),
      Number((inputs.tyresWear[2] / safeAge).toFixed(2)),
      Number((inputs.tyresWear[3] / safeAge).toFixed(2))
    ];

    const maxWear = Math.max(...inputs.tyresWear);
    const maxWearRate = Math.max(...tyreWearRatePerLap);
    let tyreEstimatedLapsRemaining = 0;
    if (maxWearRate > 0) {
      // Considera 75% como limite de vida útil recomendada antes de perda crítica de aderência
      tyreEstimatedLapsRemaining = Math.max(0, Math.floor((75 - maxWear) / maxWearRate));
    }

    return {
      sector3TimeMS,
      positionsGainedLost,
      activeShiftLeds,
      isShiftFlash,
      fuelConsumptionPerLap,
      fuelDeltaLaps,
      tyreWearRatePerLap,
      tyreEstimatedLapsRemaining
    };
  }
}
