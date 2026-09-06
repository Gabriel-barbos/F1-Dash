import { PacketHeader } from './header';

export type EventStringCode =
  | 'SSTA' // Session Started
  | 'SEND' // Session Ended
  | 'FTLP' // Fastest Lap
  | 'RTMT' // Retirement
  | 'DRSE' // DRS Enabled
  | 'DRSD' // DRS Disabled
  | 'TMPT' // Team Mate in Pits
  | 'CHQF' // Chequered Flag
  | 'RCWN' // Race Winner
  | 'PENA' // Penalty Issued
  | 'SPTP' // Speed Trap Fast
  | 'STLG' // Start Lights
  | 'LGOT' // Lights Out
  | 'DTSV' // Drive Through Served
  | 'SGSV' // Stop and Go Served
  | 'FLBK' // Flashback
  | 'RDFL' // Red Flag
  | 'OVTK'; // Overtake

export interface FastestLapEventDetails {
  vehicleIdx: number;
  lapTime: number;
}

export interface RetirementEventDetails {
  vehicleIdx: number;
}

export interface TeamMateInPitsEventDetails {
  vehicleIdx: number;
}

export interface RaceWinnerEventDetails {
  vehicleIdx: number;
}

export interface PenaltyEventDetails {
  penaltyType: number;
  infringementType: number;
  vehicleIdx: number;
  otherVehicleIdx: number;
  time: number;
  lapNum: number;
  placesGained: number;
}

export interface SpeedTrapEventDetails {
  vehicleIdx: number;
  speed: number;
  isOverallFastestInSession: boolean;
  isDriverFastestInSession: boolean;
  fastestVehicleIdxInSession: number;
  fastestSpeedInSession: number;
}

export interface StartLightsEventDetails {
  numLights: number;
}

export interface DriveThroughPenaltyServedEventDetails {
  vehicleIdx: number;
}

export interface StopGoPenaltyServedEventDetails {
  vehicleIdx: number;
}

export interface FlashbackEventDetails {
  flashbackFrameIdentifier: number;
  flashbackSessionTime: number;
}

export interface ButtonsEventDetails {
  buttonStatus: number;
}

export interface OvertakeEventDetails {
  overtakingVehicleIdx: number;
  beingOvertakenVehicleIdx: number;
}

export type EventDetails =
  | { code: 'FTLP'; details: FastestLapEventDetails }
  | { code: 'RTMT'; details: RetirementEventDetails }
  | { code: 'TMPT'; details: TeamMateInPitsEventDetails }
  | { code: 'RCWN'; details: RaceWinnerEventDetails }
  | { code: 'PENA'; details: PenaltyEventDetails }
  | { code: 'SPTP'; details: SpeedTrapEventDetails }
  | { code: 'STLG'; details: StartLightsEventDetails }
  | { code: 'LGOT'; details: {} }
  | { code: 'DTSV'; details: DriveThroughPenaltyServedEventDetails }
  | { code: 'SGSV'; details: StopGoPenaltyServedEventDetails }
  | { code: 'FLBK'; details: FlashbackEventDetails }
  | { code: 'RDFL'; details: {} }
  | { code: 'OVTK'; details: OvertakeEventDetails }
  | { code: 'SSTA' | 'SEND' | 'DRSE' | 'DRSD' | 'CHQF'; details: {} }
  | { code: string; details: any };

export interface PacketEventData {
  header: PacketHeader;
  eventStringCode: EventStringCode | string;
  eventDetails: EventDetails;
}
