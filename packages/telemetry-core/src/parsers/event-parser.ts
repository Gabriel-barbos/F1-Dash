import {
  PacketEventData,
  EventStringCode,
  EventDetails
} from '../models/events';
import { HeaderParser } from './header-parser';
import { BinaryReader } from '../utils/binary-reader';

export class EventParser {
  /**
   * Decodifica o pacote de Eventos de Corrida (Packet ID 3).
   */
  public static parse(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): PacketEventData {
    const reader = new BinaryReader(data);
    const header = HeaderParser.parse(reader);

    const eventStringCode = reader.readString(4) as EventStringCode;
    let eventDetails: EventDetails = { code: eventStringCode, details: {} };

    switch (eventStringCode) {
      case 'FTLP': {
        const vehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        const lapTime = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
        eventDetails = { code: 'FTLP', details: { vehicleIdx, lapTime } };
        break;
      }
      case 'RTMT': {
        const vehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        eventDetails = { code: 'RTMT', details: { vehicleIdx } };
        break;
      }
      case 'TMPT': {
        const vehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        eventDetails = { code: 'TMPT', details: { vehicleIdx } };
        break;
      }
      case 'RCWN': {
        const vehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        eventDetails = { code: 'RCWN', details: { vehicleIdx } };
        break;
      }
      case 'PENA': {
        const penaltyType = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        const infringementType = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        const vehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        const otherVehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        const time = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        const lapNum = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        const placesGained = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        eventDetails = {
          code: 'PENA',
          details: { penaltyType, infringementType, vehicleIdx, otherVehicleIdx, time, lapNum, placesGained }
        };
        break;
      }
      case 'SPTP': {
        const vehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        const speed = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
        const isOverallFastestInSession = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
        const isDriverFastestInSession = reader.hasRemaining(1) ? reader.readUInt8() === 1 : false;
        const fastestVehicleIdxInSession = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        const fastestSpeedInSession = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
        eventDetails = {
          code: 'SPTP',
          details: {
            vehicleIdx,
            speed,
            isOverallFastestInSession,
            isDriverFastestInSession,
            fastestVehicleIdxInSession,
            fastestSpeedInSession
          }
        };
        break;
      }
      case 'STLG': {
        const numLights = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        eventDetails = { code: 'STLG', details: { numLights } };
        break;
      }
      case 'DTSV': {
        const vehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        eventDetails = { code: 'DTSV', details: { vehicleIdx } };
        break;
      }
      case 'SGSV': {
        const vehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        eventDetails = { code: 'SGSV', details: { vehicleIdx } };
        break;
      }
      case 'FLBK': {
        const flashbackFrameIdentifier = reader.hasRemaining(4) ? reader.readUInt32LE() : 0;
        const flashbackSessionTime = reader.hasRemaining(4) ? reader.readFloatLE() : 0;
        eventDetails = { code: 'FLBK', details: { flashbackFrameIdentifier, flashbackSessionTime } };
        break;
      }
      case 'OVTK': {
        const overtakingVehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        const beingOvertakenVehicleIdx = reader.hasRemaining(1) ? reader.readUInt8() : 0;
        eventDetails = {
          code: 'OVTK',
          details: { overtakingVehicleIdx, beingOvertakenVehicleIdx }
        };
        break;
      }
      default:
        eventDetails = { code: eventStringCode, details: {} };
        break;
    }

    return {
      header,
      eventStringCode,
      eventDetails
    };
  }
}
