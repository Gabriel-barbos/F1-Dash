/**
 * Cockpit Theme System — Public API
 *
 * Exporte tudo o que é necessário para usar o sistema de tema em componentes.
 */

export type { CockpitTheme, ShiftLightsPalette, CockpitBackground } from './types';
export { CockpitStateKey } from './types';
export { COCKPIT_THEMES } from './cockpitThemes';
export { getCockpitTheme, getCockpitStateKey, COCKPIT_THEME_DEPS } from './getCockpitTheme';
export { useCockpitTheme } from './useCockpitTheme';
