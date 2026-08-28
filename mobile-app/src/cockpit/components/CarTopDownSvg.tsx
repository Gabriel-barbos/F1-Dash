/**
 * CarTopDownSvg — SVG top-down parametrizado do carro F1
 *
 * Extraído e centralizado dos componentes DamageHeatmap e
 * CarDamageMomentaryOverlay onde estava duplicado.
 *
 * As zonas são coloridas com base nos valores reais de dano.
 * Usa getDamageColor para manter consistência de cores.
 */

import React, { memo } from 'react';
import Svg, { Rect, Path, Circle, Ellipse } from 'react-native-svg';
import { getDamageColor } from '../utils/getDamageColor';

interface CarTopDownSvgProps {
  frontLeftWing: number;
  frontRightWing: number;
  rearWing: number;
  floor: number;
  diffuser: number;
  sidepod: number;
  gearBox: number;
  engine: number;
  width?: number;
  height?: number;
}

export const CarTopDownSvg: React.FC<CarTopDownSvgProps> = memo(({
  frontLeftWing,
  frontRightWing,
  rearWing,
  floor,
  diffuser,
  sidepod,
  gearBox,
  engine,
  width = 130,
  height = 220,
}) => {
  const frontWingColor = {
    left: getDamageColor(frontLeftWing),
    right: getDamageColor(frontRightWing),
  };
  const rearWingColor = getDamageColor(rearWing);
  const floorColor = getDamageColor(Math.max(floor, sidepod));
  const powertrain = getDamageColor(Math.max(engine, gearBox));

  return (
    <Svg width={width} height={height} viewBox="0 0 180 300">
      {/* ── Rodas ── */}
      <Rect x="10" y="40" width="24" height="45" rx="4" fill="#334155" />
      <Rect x="146" y="40" width="24" height="45" rx="4" fill="#334155" />
      <Rect x="10" y="215" width="28" height="55" rx="4" fill="#334155" />
      <Rect x="142" y="215" width="28" height="55" rx="4" fill="#334155" />

      {/* ── Asa Dianteira ── */}
      {/* Esquerda */}
      <Path
        d="M 20 20 L 85 20 L 85 36 L 25 36 Z"
        fill={frontWingColor.left}
        opacity={0.9}
      />
      {/* Direita */}
      <Path
        d="M 95 20 L 160 20 L 155 36 L 95 36 Z"
        fill={frontWingColor.right}
        opacity={0.9}
      />

      {/* ── Nariz ── */}
      <Path
        d="M 75 28 L 105 28 L 100 78 L 80 78 Z"
        fill="#1e293b"
        stroke="#475569"
        strokeWidth="1"
      />

      {/* ── Cockpit ── */}
      <Path
        d="M 65 78 L 115 78 L 125 148 L 55 148 Z"
        fill="#0f172a"
        stroke="#334155"
        strokeWidth="1"
      />
      {/* Visor */}
      <Ellipse cx="90" cy="95" rx="16" ry="8" fill="#1e3a5f" opacity={0.6} />

      {/* ── Assoalho / Sidepods ── */}
      <Path
        d="M 38 118 L 142 118 L 138 210 L 42 210 Z"
        fill={floorColor}
        opacity={0.65}
      />

      {/* ── Motor + Câmbio (centro) ── */}
      <Circle cx="90" cy="172" r="22" fill={powertrain} opacity={0.9} />

      {/* ── Asa Traseira ── */}
      <Rect
        x="35"
        y="274"
        width="110"
        height="16"
        rx="3"
        fill={rearWingColor}
        opacity={0.9}
      />
      {/* Suporte da asa traseira */}
      <Rect x="82" y="248" width="16" height="28" rx="2" fill="#1e293b" />
    </Svg>
  );
});

CarTopDownSvg.displayName = 'CarTopDownSvg';
