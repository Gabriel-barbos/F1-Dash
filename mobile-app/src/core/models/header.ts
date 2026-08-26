import { PacketId } from './packet-ids';

/**
 * Header unificado de 29 bytes presente em todos os pacotes de telemetria da F1.
 */
export interface PacketHeader {
  packetFormat: number;            // Ano do formato (ex: 2024, 2025, 2026)
  gameYear: number;                // Ano do jogo (ex: 24, 25)
  gameMajorVersion: number;        // Versão majoritária (ex: 1)
  gameMinorVersion: number;        // Versão minoritária (ex: 15)
  packetVersion: number;           // Versão do pacote (ex: 1)
  packetId: PacketId;              // Identificador do tipo de pacote
  sessionUID: bigint;              // Identificador único da sessão (64-bit)
  sessionTime: number;             // Timestamp da sessão em segundos (float)
  frameIdentifier: number;         // Número sequencial do frame da simulação
  overallFrameIdentifier: number;  // Identificador global de frames
  playerCarIndex: number;          // Índice do carro do jogador (0-23)
  secondaryPlayerCarIndex: number; // Índice do segundo jogador (em split-screen)
}

export const HEADER_SIZE_BYTES = 29;
