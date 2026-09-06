/**
 * PedalBar — Compatibilidade retroativa delegando para InputBar
 */

import React from 'react';
import { InputBar } from './InputBars';

interface PedalBarProps {
  value: number;
  type: 'throttle' | 'brake';
}

export const PedalBar: React.FC<PedalBarProps> = (props) => {
  return <InputBar {...props} />;
};
