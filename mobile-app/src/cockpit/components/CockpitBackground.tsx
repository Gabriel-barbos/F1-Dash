/**
 * CockpitBackground — Compatibilidade retroativa apontando para CockpitAtmosphere
 */

import React from 'react';
import { CockpitAtmosphere } from './CockpitAtmosphere';
import { CockpitTheme } from '../theme/types';

interface Props {
  theme: CockpitTheme;
  children: React.ReactNode;
}

export const CockpitBackground: React.FC<Props> = ({ theme, children }) => {
  return <CockpitAtmosphere theme={theme}>{children}</CockpitAtmosphere>;
};
