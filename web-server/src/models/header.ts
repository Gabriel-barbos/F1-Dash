import { PacketId } from './packet-ids.js';

/**
 * Estrutura do Header padrão do F1 (29 bytes).
 * Presente no início de TODOS os pacotes UDP transmitidos pelo jogo.
 */
export interface PacketHeader {
  packetFormat: number;            // Ano do formato (ex: 2024, 2025)
  gameYear: number;                // Dois últimos dígitos do ano (ex: 24, 25)
  gameMajorVersion: number;        // Versão major (ex: 1)
  gameMinorVersion: number;        // Versão minor (ex: 15)
  packetVersion: number;           // Versão do tipo de pacote específico (inicia em 1)
  packetId: PacketId;              // Identificador do tipo de pacote
  sessionUID: bigint;              // Identificador único da sessão (64-bit uint)
  sessionTime: number;             // Timestamp da sessão em segundos (float)
  frameIdentifier: number;         // Identificador do frame em que os dados foram gerados
  overallFrameIdentifier: number;  // Identificador cumulativo de frame (não reseta com flashback)
  playerCarIndex: number;          // Índice do carro do jogador no array de carros (0-21)
  secondaryPlayerCarIndex: number; // Índice do segundo jogador (splitscreen) ou 255 se inativo
}

export const HEADER_SIZE_BYTES = 29;
