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
      secondary: '#1c0707',
      glow: '#ef4444',
      gradient: ['#2e0909', '#1a0505', '#100202'],
    },
    cardBorder: '#991b1b',
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
      primary: '#1c1402',
      secondary: '#181304',
      glow: '#ca8a04',
      gradient: ['#2e2004', '#1c1402', '#0f0a01'],
    },
    cardBorder: '#784408',
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
      primary: '#190e02',
      secondary: '#170f03',
      glow: '#b45309',
      gradient: ['#281604', '#190e02', '#0d0701'],
    },
    cardBorder: '#7c2d12',
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
      secondary: '#10131d',
      glow: '#64748b',
      gradient: ['#141724', '#0c0e14', '#06070a'],
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
      secondary: '#1c0615',
      glow: '#be185d',
      gradient: ['#2b0920', '#170511', '#0e030b'],
    },
    cardBorder: '#9d174d',
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
      primary: '#051124',
      secondary: '#061328',
      glow: '#1d4ed8',
      gradient: ['#092147', '#051124', '#020712'],
    },
    cardBorder: '#1d4ed8',
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
      secondary: '#031720',
      glow: '#0891b2',
      gradient: ['#022630', '#011418', '#000c0f'],
    },
    cardBorder: '#0e7490',
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
      secondary: '#130722',
      glow: '#7e22ce',
      gradient: ['#1d082c', '#0d0514', '#08020f'],
    },
    cardBorder: '#6b21a8',
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
      secondary: '#041524',
      glow: '#0284c7',
      gradient: ['#041e33', '#020e18', '#010810'],
    },
    cardBorder: '#0369a1',
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
      primary: '#050608',
      secondary: '#0a0c14',
      glow: 'transparent',
      gradient: ['#0c0e18', '#07080f', '#050608'],
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
