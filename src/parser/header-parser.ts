import { PacketHeader, HEADER_SIZE_BYTES } from '../models/header.js';
import { PacketId } from '../models/packet-ids.js';
import { BufferReader } from '../utils/buffer-reader.js';

export class HeaderParser {
  /**
   * Decodifica o header padrão de 29 bytes de um pacote F1 UDP.
   */
  public static parse(buffer: Buffer): PacketHeader {
    if (buffer.length < HEADER_SIZE_BYTES) {
      throw new Error(
        `Tamanho de buffer inválido para Header: esperado no mínimo ${HEADER_SIZE_BYTES} bytes, recebido ${buffer.length} bytes.`
      );
    }

    const reader = new BufferReader(buffer);

    const packetFormat = reader.readUInt16LE();
    const gameYear = reader.readUInt8();
    const gameMajorVersion = reader.readUInt8();
    const gameMinorVersion = reader.readUInt8();
    const packetVersion = reader.readUInt8();
    const packetId = reader.readUInt8() as PacketId;
    const sessionUID = reader.readBigUInt64LE();
    const sessionTime = reader.readFloatLE();
    const frameIdentifier = reader.readUInt32LE();
    const overallFrameIdentifier = reader.readUInt32LE();
    const playerCarIndex = reader.readUInt8();
    const secondaryPlayerCarIndex = reader.readUInt8();

    return {
      packetFormat,
      gameYear,
      gameMajorVersion,
      gameMinorVersion,
      packetVersion,
      packetId,
      sessionUID,
      sessionTime,
      frameIdentifier,
      overallFrameIdentifier,
      playerCarIndex,
      secondaryPlayerCarIndex
    };
  }

  /**
   * Helper para rápida inspeção do Packet ID sem precisar decodificar todos os campos do header.
   */
  public static peekPacketId(buffer: Buffer): PacketId | null {
    if (buffer.length < 7) {
      return null;
    }
    return buffer.readUInt8(6) as PacketId;
  }
}
