/**
 * Utilitários de formatação visual para o terminal.
 */

// Códigos ANSI de cores
export const Colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

/**
 * Cria uma barra visual de porcentagem com tamanho customizado.
 */
export function makeProgressBar(value: number, max: number, length = 20, color = Colors.green): string {
  const clamped = Math.max(0, Math.min(value, max));
  const ratio = max > 0 ? clamped / max : 0;
  const filledCount = Math.round(ratio * length);
  const emptyCount = Math.max(0, length - filledCount);

  const filled = '█'.repeat(filledCount);
  const empty = '░'.repeat(emptyCount);

  return `${color}${filled}${Colors.dim}${empty}${Colors.reset}`;
}

/**
 * Formata marcha (1-8, N para 0, R para -1).
 */
export function formatGear(gear: number): string {
  if (gear === 0) return `${Colors.yellow}N${Colors.reset}`;
  if (gear === -1) return `${Colors.red}R${Colors.reset}`;
  return `${Colors.bold}${Colors.cyan}${gear}${Colors.reset}`;
}

/**
 * Formata valor de DRS com indicador colorido.
 */
export function formatDRS(drs: boolean): string {
  if (drs) {
    return `${Colors.bgGreen}${Colors.white}${Colors.bold} DRS ON ${Colors.reset}`;
  }
  return `${Colors.dim}DRS OFF${Colors.reset}`;
}

/**
 * Converte bytes por segundo para formato legível (KB/s, MB/s).
 */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
