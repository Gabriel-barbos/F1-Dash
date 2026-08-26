import { PacketHeader, HEADER_SIZE_BYTES } from '../models/header';
import { PacketId } from '../models/packet-ids';
import { BinaryReader } from '../utils/binary-reader';

export class HeaderParser {
  /**
   * Decodifica o cabeçalho padrão de 29 bytes de qualquer pacote UDP F1.
   */
  public static parse(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): PacketHeader {
    const reader = new BinaryReader(data);

    if (reader.remainingBytes() < HEADER_SIZE_BYTES) {
      throw new Error(
        `Tamanho de buffer inválido para Header: ${reader.remainingBytes()} bytes (mínimo esperado: ${HEADER_SIZE_BYTES} bytes).`
      );
    }

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
   * Lê rapidamente apenas o PacketId no offset 6 sem decodificar o restante.
   */
  public static peekPacketId(data: ArrayBuffer | Uint8Array | DataView | { buffer: ArrayBuffer }): PacketId {
    const reader = new BinaryReader(data);
    if (reader.remainingBytes() < 7) {
      throw new Error('Buffer muito pequeno para identificar PacketId.');
    }
    reader.setOffset(6);
    return reader.readUInt8() as PacketId;
  }
}
