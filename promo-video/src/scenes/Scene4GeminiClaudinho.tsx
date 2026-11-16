import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CardBox, FrameShell, PixelClaudinho} from '../components/SharedUI';
import {COLORS, FONTS, SCENE_FRAMES} from '../theme';

export const Scene4GeminiClaudinho: React.FC<{globalProgress: number}> = ({globalProgress}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const claudinhoSpeaking = frame >= SCENE_FRAMES.scene4ClaudinhoStart && frame < SCENE_FRAMES.scene4 - 20;
  const radioEnter = spring({
    frame: Math.max(0, frame - (SCENE_FRAMES.scene4ClaudinhoStart - 15)),
    fps,
    config: {damping: 16, stiffness: 120},
  });

  const caption =
    frame < 210
      ? 'O sistema analisa o ritmo da pista, gera contexto e envia para a API do Gemini.'
      : frame < SCENE_FRAMES.scene4ClaudinhoStart
      ? 'Claudinho Ronaldo, engenheiro de pista com IA, responde ao vivo no rádio.'
      : '“Verstappen está virando 0.5s mais rápido — chuva na volta 17, antecipe a parada!”';

  // Barras do equalizador
  const eqBars = Array.from({length: 14}, (_, i) => {
    const h = claudinhoSpeaking
      ? 14 + Math.abs(Math.sin(frame * 0.45 + i * 0.9)) * 42
      : 8 + Math.abs(Math.sin(frame * 0.1 + i)) * 8;
    return h;
  });

  const msg1Op = interpolate(frame, [SCENE_FRAMES.scene4ClaudinhoStart, SCENE_FRAMES.scene4ClaudinhoStart + 20], [0.25, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const msg2Op = interpolate(frame, [SCENE_FRAMES.scene4ClaudinhoStart + 115, SCENE_FRAMES.scene4ClaudinhoStart + 135], [0.25, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <FrameShell
      tag="ETAPA 02 • GEMINI API + RÁDIO BOX"
      stepLabel="CENA 04 / 06"
      caption={caption}
      globalProgress={globalProgress}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 40}}>
        {/* Esquerda: Pipeline de Contexto -> Gemini */}
        <div style={{width: 440, display: 'flex', flexDirection: 'column', gap: 18}}>
          {[
            {title: 'RACE STATE MACHINE', desc: 'Prioridade e regras de estratégia', active: frame < 140},
            {title: 'CONTEXT & PROMPT ENGINE', desc: 'Ritmo, desgaste e clima em tempo real', active: frame >= 80 && frame < 240},
            {title: 'GEMINI 3.8 FLASH + TTS', desc: 'Resposta tática convertida em voz', active: frame >= 180},
          ].map((step, i) => (
            <CardBox
              key={step.title}
              style={{
                padding: '18px 22px',
                borderColor: step.active ? COLORS.red : COLORS.ink,
                backgroundColor: step.active ? COLORS.redSoft : COLORS.bgCard,
              }}
            >
              <div style={{fontFamily: FONTS.mono, fontSize: 16, fontWeight: 900, color: COLORS.red}}>
                0{i + 1} • {step.title}
              </div>
              <div style={{fontSize: 18, color: COLORS.ink, marginTop: 4, fontWeight: 500}}>{step.desc}</div>
            </CardBox>
          ))}
        </div>

        {/* Centro: Card do Claudinho Ronaldo (Rádio Box) */}
        <CardBox style={{width: 390, padding: 0, overflow: 'hidden'}}>
          <div
            style={{
              backgroundColor: COLORS.ink,
              color: '#FFFFFF',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontFamily: FONTS.mono,
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            <span>[RÁDIO BOX • CH 01]</span>
            <span style={{color: claudinhoSpeaking ? '#4ADE80' : COLORS.red}}>
              {claudinhoSpeaking ? '● NO AR' : '● STANDBY'}
            </span>
          </div>

          <div style={{padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16}}>
            <div
              style={{
                width: 240,
                height: 240,
                border: `4px solid ${COLORS.ink}`,
                borderRadius: 12,
                backgroundColor: '#FAF7F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PixelClaudinho size={200} speaking={claudinhoSpeaking} />
            </div>

            {/* Equalizador */}
            <div
              style={{
                width: '100%',
                height: 64,
                backgroundColor: COLORS.ink,
                borderRadius: 8,
                padding: '0 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 6,
              }}
            >
              {eqBars.map((h, i) => (
                <div
                  key={i}
                  style={{
                    flex: 1,
                    height: h,
                    backgroundColor: i % 2 === 0 ? COLORS.red : '#FFFFFF',
                    borderRadius: 3,
                  }}
                />
              ))}
            </div>

            <div style={{textAlign: 'center'}}>
              <div style={{fontFamily: FONTS.mono, fontSize: 22, fontWeight: 900}}>CLAUDINHO RONALDO</div>
              <div style={{fontFamily: FONTS.mono, fontSize: 15, fontWeight: 800, color: COLORS.red, marginTop: 4}}>
                ENGENHEIRO IA • GEMINI LIVE
              </div>
            </div>
          </div>
        </CardBox>

        {/* Direita: Falas no Rádio */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 22,
            transform: `translateX(${interpolate(radioEnter, [0, 1], [30, 0])}px)`,
          }}
        >
          <CardBox style={{padding: 0, overflow: 'hidden', opacity: msg1Op}}>
            <div style={{backgroundColor: COLORS.ink, color: '#FFFFFF', padding: '10px 18px', fontFamily: FONTS.mono, fontSize: 15, fontWeight: 800, display: 'flex', justifyContent: 'space-between'}}>
              <span style={{color: COLORS.red}}>► ANÁLISE DE RITMO</span>
              <span>[VERSTAPPEN: -0.5s / VOLTA]</span>
            </div>
            <div style={{padding: 20, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700, lineHeight: 1.35}}>
              “Verstappen está virando 0.5s mais rápido por volta, acelere!”
            </div>
          </CardBox>

          <CardBox style={{padding: 0, overflow: 'hidden', opacity: msg2Op}}>
            <div style={{backgroundColor: COLORS.red, color: '#FFFFFF', padding: '10px 18px', fontFamily: FONTS.mono, fontSize: 15, fontWeight: 800, display: 'flex', justifyContent: 'space-between'}}>
              <span>► ESTRATÉGIA DE BOX</span>
              <span>[CHUVA NA VOLTA 17]</span>
            </div>
            <div style={{padding: 20, fontFamily: FONTS.mono, fontSize: 22, fontWeight: 700, lineHeight: 1.35}}>
              “Antecipe a parada antes que comece a chover!”
            </div>
          </CardBox>
        </div>
      </div>
    </FrameShell>
  );
};
