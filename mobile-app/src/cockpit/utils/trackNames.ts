/**
 * trackNames — Lookup table de trackId → nome da pista
 *
 * O campo trackId vem do PacketSessionData mas ainda não está
 * parseado para o estado atual. Este utilitário está preparado
 * para quando o parse for adicionado.
 *
 * Fonte: F1 2024/2025 UDP Specification
 */

export const TRACK_NAMES: Record<number, { name: string; location: string }> = {
  0:  { name: 'Melbourne',    location: 'Austrália' },
  1:  { name: 'Paul Ricard',  location: 'França' },
  2:  { name: 'Shanghai',     location: 'China' },
  3:  { name: 'Sakhir',       location: 'Bahrain' },
  4:  { name: 'Catalunya',    location: 'Espanha' },
  5:  { name: 'Monaco',       location: 'Mônaco' },
  6:  { name: 'Montréal',     location: 'Canadá' },
  7:  { name: 'Silverstone',  location: 'Reino Unido' },
  8:  { name: 'Hockenheim',   location: 'Alemanha' },
  9:  { name: 'Hungaroring',  location: 'Hungria' },
  10: { name: 'Spa',          location: 'Bélgica' },
  11: { name: 'Monza',        location: 'Itália' },
  12: { name: 'Singapore',    location: 'Singapura' },
  13: { name: 'Suzuka',       location: 'Japão' },
  14: { name: 'Abu Dhabi',    location: 'EAU' },
  15: { name: 'Texas',        location: 'EUA' },
  16: { name: 'Brazil',       location: 'Brasil' },
  17: { name: 'Austria',      location: 'Áustria' },
  18: { name: 'Sochi',        location: 'Rússia' },
  19: { name: 'Mexico City',  location: 'México' },
  20: { name: 'Baku',         location: 'Azerbaijão' },
  21: { name: 'Sakhir Short', location: 'Bahrain' },
  22: { name: 'Silverstone Short', location: 'Reino Unido' },
  23: { name: 'Texas Short',  location: 'EUA' },
  24: { name: 'Suzuka Short', location: 'Japão' },
  25: { name: 'Hanoi',        location: 'Vietnã' },
  26: { name: 'Zandvoort',    location: 'Holanda' },
  27: { name: 'Imola',        location: 'Itália' },
  28: { name: 'Portimão',     location: 'Portugal' },
  29: { name: 'Jeddah',       location: 'Arábia Saudita' },
  30: { name: 'Miami',        location: 'EUA' },
  31: { name: 'Las Vegas',    location: 'EUA' },
  32: { name: 'Lusail',       location: 'Qatar' },
};

export function getTrackName(trackId: number): { name: string; location: string } {
  return TRACK_NAMES[trackId] ?? { name: 'PISTA DESCONHECIDA', location: '--' };
}

export function getSessionTypeLabel(sessionType: number): string {
  switch (sessionType) {
    case 1: case 2: case 3: return 'TREINO';
    case 4: return 'TREINO CURTO';
    case 5: case 6: case 7: return 'CLASSIFICAÇÃO';
    case 8: return 'CLASS. CURTA';
    case 9: return 'CLASS. UM TEMPO';
    case 10: case 11: case 12: return 'CORRIDA';
    case 13: return 'TIME TRIAL';
    default: return 'SESSÃO';
  }
}
