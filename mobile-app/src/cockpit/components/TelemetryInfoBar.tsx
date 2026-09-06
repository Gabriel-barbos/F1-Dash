/**
 * TelemetryInfoBar — Compatibilidade retroativa delegando para ModeTransitionBar
 */

import React from 'react';
import { ModeTransitionBar } from './ModeTransitionBar';
import { CockpitTheme } from '../theme/types';

interface Props {
  theme: CockpitTheme;
}

export const TelemetryInfoBar: React.FC<Props> = ({ theme }) => {
  return <ModeTransitionBar theme={theme} />;
};
