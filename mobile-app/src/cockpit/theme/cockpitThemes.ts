/**
 * Cockpit Theme System — Themes Definitions
 *
 * Arquivo central com todas as definições de tema.
 * Nenhuma cor de estado deve existir fora deste arquivo.
 */

import { CockpitTheme, CockpitStateKey } from './types';

export const COCKPIT_THEMES: Record<CockpitStateKey, CockpitTheme> = {

  // ─────────────────────────────────────────────────────
  // PRIORIDADE 1 — BANDEIRA VERMELHA
  // ─────────────────────────────────────────────────────
  [CockpitStateKey.RED_FLAG]: {
    key: CockpitStateKey.RED_FLAG,
    label: 'BANDEIRA VERMELHA',
    icon: '🚩',
    accent: '#ef4444',
    badgeTextColor: '#ffffff',
    background: {
      primary: '#1a0505',
      secondary: '#2a0a0a',
      glow: '#ef4444',
    },
    cardBorder: '#7f1d1d',
    shiftLights: {
      low: '#7f1d1d',
      mid: '#dc2626',
      high: '#ef4444',
      peak: '#fca5a5',
    },
    badgePulsing: true,
  },

  // ─────────────────────────────────────────────────────
  // PRIORIDADE 2 — SAFETY CAR
  // ─────────────────────────────────────────────────────
  [CockpitStateKey.SAFETY_CAR]: {
    key: CockpitStateKey.SAFETY_CAR,
    label: 'SAFETY CAR',
    icon: '🟡',
    accent: '#eab308',
    badgeTextColor: '#000000',
    background: {
      primary: '#1a1200',
      secondary: '#261b00',
      glow: '#ca8a04',
    },
    cardBorder: '#713f12',
    shiftLights: {
      low: '#713f12',
      mid: '#ca8a04',
      high: '#eab308',
      peak: '#fde047',
    },
    badgePulsing: true,
  },

  // ─────────────────────────────────────────────────────
  // PRIORIDADE 3 — VIRTUAL SAFETY CAR
  // ─────────────────────────────────────────────────────
  [CockpitStateKey.VSC]: {
    key: CockpitStateKey.VSC,
    label: 'VSC',
    icon: '⚡',
    accent: '#f59e0b',
    badgeTextColor: '#000000',
    background: {
      primary: '#141000',
      secondary: '#1f1800',
      glow: '#b45309',
    },
    cardBorder: '#78350f',
    shiftLights: {
      low: '#78350f',
      mid: '#b45309',
      high: '#f59e0b',
      peak: '#fcd34d',
    },
    badgePulsing: true,
  },

  // ─────────────────────────────────────────────────────
  // PRIORIDADE 4 — FORMATION LAP / LARGADA
  // ─────────────────────────────────────────────────────
  [CockpitStateKey.FORMATION_LAP]: {
    key: CockpitStateKey.FORMATION_LAP,
    label: 'LARGADA',
    icon: '🏎',
    accent: '#e2e8f0',
    badgeTextColor: '#000000',
    background: {
      primary: '#0c0e14',
      secondary: '#111420',
      glow: '#64748b',
    },
    cardBorder: '#334155',
    shiftLights: {
      low: '#334155',
      mid: '#64748b',
      high: '#94a3b8',
      peak: '#e2e8f0',
    },
    badgePulsing: false,
  },

  // ─────────────────────────────────────────────────────
  // PRIORIDADE 5 — PIT LANE / BOXES
  // ─────────────────────────────────────────────────────
  [CockpitStateKey.PIT_LANE]: {
    key: CockpitStateKey.PIT_LANE,
    label: 'BOXES',
    icon: '🔧',
    accent: '#ec4899',
    badgeTextColor: '#ffffff',
    background: {
      primary: '#170511',
      secondary: '#220819',
      glow: '#be185d',
    },
    cardBorder: '#831843',
    shiftLights: {
      low: '#831843',
      mid: '#be185d',
      high: '#ec4899',
      peak: '#f9a8d4',
    },
    badgePulsing: false,
  },

  // ─────────────────────────────────────────────────────
  // PRIORIDADE 6 — OVERTAKE (ERS Deploy Mode = Overtake)
  // ─────────────────────────────────────────────────────
  [CockpitStateKey.OVERTAKE]: {
    key: CockpitStateKey.OVERTAKE,
    label: 'OVERTAKE',
    icon: '»»',
    accent: '#3b82f6',
    badgeTextColor: '#ffffff',
    background: {
      primary: '#030b1a',
      secondary: '#051020',
      glow: '#1d4ed8',
    },
    cardBorder: '#1e3a8a',
    shiftLights: {
      low: '#1e3a8a',
      mid: '#1d4ed8',
      high: '#3b82f6',
      peak: '#93c5fd',
    },
    badgePulsing: false,
  },

  // ─────────────────────────────────────────────────────
  // PRIORIDADE 7 — FASTEST LAP (inferido: lastLap === bestLap)
  // ─────────────────────────────────────────────────────
  [CockpitStateKey.FASTEST_LAP]: {
    key: CockpitStateKey.FASTEST_LAP,
    label: 'VOLTA RÁPIDA',
    icon: '⏱',
    accent: '#06b6d4',
    badgeTextColor: '#000000',
    background: {
      primary: '#011418',
      secondary: '#011b20',
      glow: '#0891b2',
    },
    cardBorder: '#164e63',
    shiftLights: {
      low: '#164e63',
      mid: '#0891b2',
      high: '#06b6d4',
      peak: '#67e8f9',
    },
    badgePulsing: true,
  },

  // ─────────────────────────────────────────────────────
  // PRIORIDADE 8 — STRAIGHT MODE / DRS ATIVO
  // ─────────────────────────────────────────────────────
  [CockpitStateKey.STRAIGHT_MODE]: {
    key: CockpitStateKey.STRAIGHT_MODE,
    label: 'MODO RETA',
    icon: '⚡',
    accent: '#a855f7',
    badgeTextColor: '#ffffff',
    background: {
      primary: '#0d0514',
      secondary: '#130720',
      glow: '#7e22ce',
    },
    cardBorder: '#581c87',
    shiftLights: {
      low: '#581c87',
      mid: '#7e22ce',
      high: '#a855f7',
      peak: '#d8b4fe',
    },
    badgePulsing: false,
  },

  // ─────────────────────────────────────────────────────
  // PRIORIDADE 9 — PISTA MOLHADA
  // ─────────────────────────────────────────────────────
  [CockpitStateKey.WET_TRACK]: {
    key: CockpitStateKey.WET_TRACK,
    label: 'PISTA MOLHADA',
    icon: '🌧',
    accent: '#38bdf8',
    badgeTextColor: '#000000',
    background: {
      primary: '#020e18',
      secondary: '#031420',
      glow: '#0284c7',
    },
    cardBorder: '#075985',
    shiftLights: {
      low: '#075985',
      mid: '#0284c7',
      high: '#38bdf8',
      peak: '#7dd3fc',
    },
    badgePulsing: false,
  },

  // ─────────────────────────────────────────────────────
  // PRIORIDADE 10 — NORMAL
  // ─────────────────────────────────────────────────────
  [CockpitStateKey.NORMAL]: {
    key: CockpitStateKey.NORMAL,
    label: '',
    icon: '',
    accent: '#38bdf8',
    badgeTextColor: '#ffffff',
    background: {
      primary: '#090a0f',
      secondary: '#0f1118',
      glow: 'transparent',
    },
    cardBorder: '#1e2436',
    shiftLights: {
      low: '#22c55e',
      mid: '#ef4444',
      high: '#a855f7',
      peak: '#ffffff',
    },
    badgePulsing: false,
  },
};
