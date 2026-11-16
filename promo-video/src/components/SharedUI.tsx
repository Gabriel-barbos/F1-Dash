import React from 'react';
import {AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, FONTS} from '../theme';

export const CheckeredFlag: React.FC<{size?: number}> = ({size = 28}) => {
  const cell = size / 4;
  const cells = [];
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 4; c++) {
      const dark = (r + c) % 2 === 0;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={c * cell + (r === 1 ? -3 : 3)}
          y={r * cell}
          width={cell}
          height={cell}
          fill={dark ? COLORS.ink : COLORS.bgCard}
        />,
      );
    }
  }
  return (
    <svg width={size + 8} height={size / 2 + 4} viewBox={`-4 0 ${size + 8} ${size / 2 + 2}`}>
      {cells}
    </svg>
  );
};

export const FrameShell: React.FC<{
  tag: string;
  stepLabel: string;
  caption?: string;
  globalProgress: number;
  children: React.ReactNode;
}> = ({tag, stepLabel, caption, globalProgress, children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = spring({frame, fps, config: {damping: 20, stiffness: 120}});
  const lineWidth = interpolate(globalProgress, [0, 1], [12, 92], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.bg,
        fontFamily: FONTS.sans,
        color: COLORS.ink,
        padding: '44px 68px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Bar */}
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24}}>
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 20,
            fontWeight: 700,
            color: COLORS.red,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            opacity: enter,
          }}
        >
          {tag}
        </div>
        <div style={{flex: 1, height: 3, backgroundColor: COLORS.ink, position: 'relative', maxWidth: 900}}>
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: -2,
              height: 7,
              width: `${lineWidth}%`,
              backgroundColor: COLORS.red,
            }}
          />
        </div>
        <CheckeredFlag size={56} />
      </div>

      {/* Main Content */}
      <div style={{flex: 1, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        {children}
      </div>

      {/* Bottom Bar + Caption */}
      <div style={{display: 'flex', flexDirection: 'column', gap: 14}}>
        {caption && (
          <div style={{display: 'flex', justifyContent: 'center'}}>
            <div
              style={{
                backgroundColor: 'rgba(17, 17, 17, 0.92)',
                color: '#FFFFFF',
                fontFamily: FONTS.sans,
                fontSize: 26,
                fontWeight: 600,
                padding: '12px 28px',
                borderRadius: 10,
                borderLeft: `6px solid ${COLORS.red}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.14)',
                maxWidth: 1400,
                textAlign: 'center',
              }}
            >
              {caption}
            </div>
          </div>
        )}

        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24}}>
          <CheckeredFlag size={56} />
          <div style={{flex: 1, height: 3, backgroundColor: COLORS.ink, position: 'relative'}}>
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: -2,
                height: 7,
                width: `${lineWidth}%`,
                backgroundColor: COLORS.red,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 18,
              fontWeight: 700,
              color: COLORS.muted,
              letterSpacing: 1.5,
              textTransform: 'uppercase',
            }}
          >
            {stepLabel}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PixelClaudinho: React.FC<{size?: number; speaking?: boolean}> = ({size = 200, speaking = false}) => {
  const frame = useCurrentFrame();
  const bob = speaking ? Math.sin(frame * 0.45) * 3 : Math.sin(frame * 0.12) * 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      style={{transform: `translateY(${bob}px)`, imageRendering: 'pixelated'}}
    >
      <rect x="9" y="3" width="14" height="3" fill="#18181B" />
      <rect x="8" y="5" width="16" height="3" fill="#18181B" />
      <rect x="9" y="7" width="14" height="9" fill="#F4C7A1" />
      <rect x="12" y="10" width="2" height="3" fill="#111111" />
      <rect x="18" y="10" width="2" height="3" fill="#111111" />
      <rect x="14" y="14" width="4" height={speaking && frame % 8 < 4 ? 2 : 1} fill="#7C2D12" />
      <rect x="6" y="8" width="3" height="6" fill="#D92323" />
      <rect x="23" y="8" width="3" height="6" fill="#D92323" />
      <rect x="7" y="9" width="1" height="4" fill="#FACC15" />
      <rect x="24" y="9" width="1" height="4" fill="#FACC15" />
      <rect x="19" y="13" width="4" height="1" fill="#111111" />
      <rect x="17" y="14" width="3" height="1" fill="#111111" />
      <rect x="9" y="16" width="14" height="10" fill="#D92323" />
      <rect x="5" y="17" width="4" height="4" fill="#D92323" />
      <rect x="23" y="17" width="4" height="4" fill="#D92323" />
      <rect x="5" y="21" width="3" height="2" fill="#F4C7A1" />
      <rect x="24" y="21" width="3" height="2" fill="#F4C7A1" />
      <rect x="15" y="16" width="2" height="9" fill="#991B1B" />
      <rect x="11" y="18" width="3" height="2" fill="#FFFFFF" />
      <rect x="18" y="18" width="3" height="2" fill="#FACC15" />
      <rect x="10" y="26" width="5" height="3" fill="#B91C1C" />
      <rect x="17" y="26" width="5" height="3" fill="#B91C1C" />
      <rect x="10" y="29" width="5" height="2" fill="#111111" />
      <rect x="17" y="29" width="5" height="2" fill="#111111" />
    </svg>
  );
};

/**
 * Ilustração vetorial detalhada do PS5 (placas curvas brancas, núcleo preto glossy,
 * LEDs azuis de status, leitor de disco) + controle DualSense na frente.
 */
export const RealisticPs5Console: React.FC<{scale?: number; transmitting?: boolean}> = ({
  scale = 1,
  transmitting = true,
}) => {
  const frame = useCurrentFrame();
  const ledPulse = transmitting ? 0.65 + Math.sin(frame * 0.25) * 0.35 : 0.8;

  return (
    <svg
      width={190 * scale}
      height={250 * scale}
      viewBox="0 0 190 250"
      style={{overflow: 'visible'}}
    >
      <defs>
        <linearGradient id="ps5ShellLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="70%" stopColor="#F1F5F9" />
          <stop offset="100%" stopColor="#CBD5E1" />
        </linearGradient>
        <linearGradient id="ps5ShellRight" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="65%" stopColor="#E2E8F0" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="ps5Core" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#27272A" />
          <stop offset="35%" stopColor="#09090B" />
          <stop offset="100%" stopColor="#18181B" />
        </linearGradient>
      </defs>

      {/* Sombra de base */}
      <ellipse cx="95" cy="238" rx="78" ry="9" fill="rgba(17,17,17,0.18)" />

      {/* Base circular do PS5 */}
      <path d="M26 226 L136 226 L144 236 L18 236 Z" fill="#18181B" stroke="#111111" strokeWidth="3.5" />
      <rect x="38" y="219" width="86" height="8" rx="3" fill="#27272A" stroke="#111111" strokeWidth="2.5" />

      {/* Placa Traseira/Direita (com protuberância do leitor de disco) */}
      <path
        d="M84 18 C98 10, 118 8, 128 14 C134 65, 142 145, 134 222 L88 222 Z"
        fill="url(#ps5ShellRight)"
        stroke="#111111"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* Fenda do leitor de disco */}
      <line x1="118" y1="126" x2="122" y2="188" stroke="#111111" strokeWidth="3" strokeLinecap="round" />

      {/* Núcleo Central Preto Glossy */}
      <path
        d="M52 24 C65 18, 86 18, 98 24 L94 222 L56 222 Z"
        fill="url(#ps5Core)"
        stroke="#111111"
        strokeWidth="3.5"
      />
      {/* Reflexo glossy no núcleo */}
      <path d="M64 28 L72 28 L68 218 L61 218 Z" fill="rgba(255,255,255,0.08)" />

      {/* Fitas de LED Azul do PS5 */}
      <path
        d="M54 30 L58 205"
        stroke="#38BDF8"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity={ledPulse}
      />
      <path
        d="M95 30 L91 205"
        stroke="#38BDF8"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity={ledPulse}
      />

      {/* Portas USB e botão Power no núcleo */}
      <rect x="73" y="168" width="5" height="10" rx="1.5" fill="#52525B" />
      <circle cx="75.5" cy="186" r="2.5" fill="#E4E4E7" />
      <rect x="74" y="198" width="3" height="9" rx="1" fill="#38BDF8" opacity={ledPulse} />

      {/* Placa Frontal/Esquerda Esculpida (com gola característica em V) */}
      <path
        d="M24 12 C36 6, 56 16, 62 28 L60 222 L28 222 C22 150, 20 75, 24 12 Z"
        fill="url(#ps5ShellLeft)"
        stroke="#111111"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      {/* Logo PS sutil na placa */}
      <rect x="35" y="34" width="9" height="6" rx="1" fill="#111111" opacity="0.65" />

      {/* Controle DualSense na frente */}
      <g transform="translate(76, 166)">
        {/* Sombra do controle */}
        <ellipse cx="52" cy="70" rx="46" ry="7" fill="rgba(17,17,17,0.22)" />
        {/* Corpo branco do DualSense */}
        <path
          d="M18 18 C24 8, 38 8, 44 12 L60 12 C66 8, 80 8, 86 18 C96 34, 98 56, 88 66 C82 70, 74 62, 68 48 L36 48 C30 62, 22 70, 16 66 C6 56, 8 34, 18 18 Z"
          fill="#FFFFFF"
          stroke="#111111"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        {/* Parte inferior preta + Analógicos */}
        <path
          d="M24 44 Q52 34 80 44 L72 56 Q52 48 32 56 Z"
          fill="#18181B"
          stroke="#111111"
          strokeWidth="2.5"
        />
        {/* Touchpad central + LED azul lateral */}
        <path d="M36 13 L68 13 L64 31 L40 31 Z" fill="#E2E8F0" stroke="#111111" strokeWidth="2.5" />
        <line x1="35" y1="14" x2="39" y2="30" stroke="#0EA5E9" strokeWidth="2.5" />
        <line x1="69" y1="14" x2="65" y2="30" stroke="#0EA5E9" strokeWidth="2.5" />
        {/* D-Pad */}
        <path d="M24 22 H30 M27 19 V25" stroke="#111111" strokeWidth="3" strokeLinecap="round" />
        {/* Botões de ação */}
        <circle cx="77" cy="19" r="2" fill="#10B981" />
        <circle cx="81" cy="23" r="2" fill="#EF4444" />
        <circle cx="77" cy="27" r="2" fill="#3B82F6" />
        <circle cx="73" cy="23" r="2" fill="#EC4899" />
        {/* Analógicos */}
        <circle cx="38" cy="40" r="6" fill="#27272A" stroke="#111111" strokeWidth="2.5" />
        <circle cx="66" cy="40" r="6" fill="#27272A" stroke="#111111" strokeWidth="2.5" />
      </g>
    </svg>
  );
};

export const CardBox: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({children, style}) => (
  <div
    style={{
      backgroundColor: COLORS.bgCard,
      border: `4px solid ${COLORS.ink}`,
      borderRadius: 16,
      boxShadow: '10px 10px 0px #111111',
      ...style,
    }}
  >
    {children}
  </div>
);
