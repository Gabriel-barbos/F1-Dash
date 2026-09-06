/**
 * ShiftLightsBar — Compatibilidade retroativa delegando para RpmIndicator
 */

import React from 'react';
import { RpmIndicator } from './RpmIndicator';
import { ShiftLightsPalette } from '../theme/types';

interface ShiftLightsBarProps {
  revPercent: number;
  palette: ShiftLightsPalette;
  totalLeds?: number;
}

export const ShiftLightsBar: React.FC<ShiftLightsBarProps> = (props) => {
  return <RpmIndicator {...props} />;
};
