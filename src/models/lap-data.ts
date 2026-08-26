import { PacketHeader } from './header.js';

export interface LapData {
  lastLapTimeInMS: number;              // Tempo da última volta completada (ms)
  currentLapTimeInMS: number;           // Tempo decorrido na volta atual (ms)
  sector1TimeInMS: number;              // Tempo do setor 1 (ms)
  sector2TimeInMS: number;              // Tempo do setor 2 (ms)
  deltaToCarInFrontInMS: number;        // Delta para o carro à frente (ms)
  deltaToRaceLeaderInMS: number;        // Delta para o líder (ms)
  lapDistance: number;                  // Distância percorrida na volta em metros
  totalDistance: number;                // Distância total da corrida
  safetyCarDelta: number;               // Delta de safety car
  carPosition: number;                  // Posição atual na corrida (P1, P2...)
  currentLapNum: number;                // Número da volta atual
  pitStatus: number;                    // 0 = None, 1 = Pitting, 2 = Pit Lane
  numPitStops: number;                  // Número de pit stops realizados
  sector: number;                       // Setor atual (0 = S1, 1 = S2, 2 = S3)
  currentLapInvalid: boolean;           // Volta atual invalidada (corte de pista)
  penalties: number;                    // Penalidades em segundos acumuladas
  totalWarnings: number;                // Avisos acumulados
  cornerCuttingWarnings: number;        // Avisos por corte de curva
  numUnservedDriveThroughPens: number;
  numUnservedStopGoPens: number;
  gridPosition: number;                 // Posição de largada no grid
  driverStatus: number;                 // 0 = in garage, 1 = flying lap, 2 = in lap, 3 = out lap, 4 = on track
  resultStatus: number;                 // 0 = invalid, 1 = inactive, 2 = active, 3 = finished, 4 = DNF, 5 = DSQ
  pitLaneTimerActive: boolean;
  pitLaneTimeInLaneInMS: number;
  pitStopTimerInMS: number;
  pitStopShouldServePen: boolean;
}

export interface PacketLapData {
  header: PacketHeader;
  lapData: LapData[];
  playerLapData: LapData;
  timeTrialPBCarIdx: number;
  timeTrialRivalCarIdx: number;
}
