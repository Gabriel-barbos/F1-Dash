import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CardBox, FrameShell, PixelClaudinho} from '../components/SharedUI';
import {COLORS, FONTS} from '../theme';

export const Scene6Outro: React.FC<{globalProgress: number}> = ({globalProgress}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const scale = spring({frame, fps, config: {damping: 16, stiffness: 105}});

  const nodes = [
    {num: '01', title: 'PS5 + F1', sub: 'UDP 30 Hz'},
    {num: '02', title: 'F1 DISPLAY', sub: 'Parser + HUD'},
    {num: '03', title: 'CLAUDINHO IA', sub: 'Gemini + Rádio'},
    {num: '04', title: 'ESP32 WLED', sub: 'Bancada RGB'},
  ];

  return (
    <FrameShell
      tag="ECOSSISTEMA COMPLETO"
      stepLabel="F1 SCREEN × ESP32 LIGHTNING"
      caption="Telemetria, inteligência artificial e hardware sincronizados em uma única experiência de corrida."
      globalProgress={globalProgress}
    >
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 46, width: '100%', transform: `scale(${scale})`}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: FONTS.mono, fontSize: 64, fontWeight: 900, letterSpacing: -1}}>
            F1 SCREEN <span style={{color: COLORS.red}}>×</span> ESP32 LIGHTNING
          </div>
          <div style={{fontSize: 26, color: COLORS.muted, marginTop: 10, fontWeight: 600}}>
            Do pacote UDP na pista até os LEDs da sua bancada
          </div>
        </div>

        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 22, width: '100%'}}>
          {nodes.map((n, idx) => {
            const delay = idx * 12;
            const op = interpolate(frame, [delay, delay + 18], [0, 1], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            });
            return (
              <React.Fragment key={n.num}>
                <CardBox style={{width: 300, padding: 26, textAlign: 'center', opacity: op}}>
                  <div style={{fontFamily: FONTS.mono, fontSize: 18, fontWeight: 900, color: COLORS.red}}>{n.num}</div>
                  <div style={{fontFamily: FONTS.mono, fontSize: 26, fontWeight: 900, marginTop: 8}}>{n.title}</div>
                  <div style={{fontSize: 19, color: COLORS.muted, marginTop: 6}}>{n.sub}</div>
                </CardBox>
                {idx < nodes.length - 1 && (
                  <div style={{fontFamily: FONTS.mono, fontSize: 36, fontWeight: 900, color: COLORS.red, opacity: op}}>→</div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 18, marginTop: 6}}>
          <PixelClaudinho size={86} speaking={false} />
          <div style={{fontFamily: FONTS.mono, fontSize: 22, fontWeight: 800, color: COLORS.ink}}>
            github.com/Gabriel-barbos/F1-Dash
          </div>
        </div>
      </div>
    </FrameShell>
  );
};
