/**
 * Cockpit Theme System — Types
 *
 * Define os estados possíveis do cockpit e a estrutura de um tema visual.
 * Estados são ordenados por prioridade: o menor número tem maior prioridade.
 */

/**
 * Estados visuais do cockpit em ordem de prioridade.
 * Quando múltiplos estados coexistem, o de menor valor numérico vence.
 */
export enum CockpitStateKey {
  RED_FLAG       = 1,
  SAFETY_CAR     = 2,
  VSC            = 3,
  FORMATION_LAP  = 4,
  PIT_LANE       = 5,
  OVERTAKE       = 6,
  STRAIGHT_MODE  = 7,
  FASTEST_LAP    = 8,
  WET_TRACK      = 9,
  NORMAL         = 10,
}

/**
 * Paleta de cores dos LEDs de shift lights.
 * Cada array representa as 15 posições de LED.
 */
export interface ShiftLightsPalette {
  /** Cor dos LEDs quando não está perto da zona de troca */
  low: string;
  /** Cor dos LEDs na zona intermediária */
  mid: string;
  /** Cor dos LEDs na zona de troca (shift point) */
  high: string;
  /** Cor especial quando está no shift point absoluto (revPercent >= 96) */
  peak: string;
}

/**
 * Configuração do fundo (background) do cockpit.
 */
export interface CockpitBackground {
  /** Cor primária do fundo (maioria das áreas) */
  primary: string;
  /** Cor secundária (cards, headers) */
  secondary: string;
  /** Cor de glow/brilho ambiente para bordas e sombras */
  glow: string;
  /** 3 stops pra LinearGradient (topo → meio → base) */
  gradient: [string, string, string];
}

/**
 * Tema visual completo de um estado do cockpit.
 * Todos os campos são usados pelos componentes de UI.
 */
export interface CockpitTheme {
  /** Identificador único do tema */
  key: CockpitStateKey;
  /** Label exibido no EventBadge */
  label: string;
  /** Emoji/ícone exibido no EventBadge */
  icon: string;
  /** Cor de accent — usada em bordas, highlights, badges */
  accent: string;
  /** Cor de texto do badge */
  badgeTextColor: string;
  /** Fundo geral do cockpit */
  background: CockpitBackground;
  /** Cor da borda dos cards */
  cardBorder: string;
  /** Paleta dos shift lights */
  shiftLights: ShiftLightsPalette;
  /** Se true, o EventBadge deve pulsar/chamar atenção */
  badgePulsing: boolean;
}
