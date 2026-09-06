import { PacketId } from './packet-ids';

/**
 * Cabeçalho oficial de 29 bytes presente em todos os pacotes UDP da F1 (2023, 2024, 2025, 2026).
 */
export interface PacketHeader {
  packetFormat: number;             // Ano do formato (ex: 2024, 2025, 2026)
  gameYear: number;                 // Dois últimos dígitos do ano (ex: 25)
  gameMajorVersion: number;         // Versão Major do jogo
  gameMinorVersion: number;         // Versão Minor do jogo
  packetVersion: number;            // Versão da estrutura deste tipo de pacote
  packetId: PacketId;               // Identificador do pacote (0 a 16)
  sessionUID: bigint;               // Identificador único da sessão (64-bit)
  sessionTime: number;              // Timestamp de sessão em segundos (float32)
  frameIdentifier: number;          // Contador de frames renderizados (uint32)
  overallFrameIdentifier: number;   // Contador global cumulativo que não reseta com flashback
  playerCarIndex: number;           // Índice do carro do jogador principal (0 a 23)
  secondaryPlayerCarIndex: number;  // Índice do segundo jogador (splitscreen) ou 255
}

export const HEADER_SIZE_BYTES = 29;
