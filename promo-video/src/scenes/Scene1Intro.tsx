import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CardBox, FrameShell, RealisticPs5Console} from '../components/SharedUI';
import {COLORS, FONTS} from '../theme';

export const Scene1Intro: React.FC<{globalProgress: number}> = ({globalProgress}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const titleScale = spring({frame, fps, config: {damping: 16, stiffness: 110}});
  const cardSlide = spring({frame: Math.max(0, frame - 10), fps, config: {damping: 18, stiffness: 100}});
  const roadOffset = (frame * 16) % 120;

  const badges = [
    {tag: '[UDP | IoT]', text: 'Telemetria Wi-Fi sem atraso (30 Hz)', delay: 25},
    {tag: '[GEMINI]', text: 'Engenheiro de pista ativo no rádio', delay: 45},
    {tag: '[ESP32 WLED]', text: 'Bancada LED sincronizada', delay: 65},
  ];

  // Pacotes saindo do PS5/TV para o Receptor F1 Display dentro do card principal
  const streamPackets = [0, 1, 2].map((i) => {
    const p = ((frame * 1.4 + i * 24) % 72) / 72;
    return {
      id: i,
      x: interpolate(p, [0, 1], [0, 130]),
      opacity: interpolate(p, [0, 0.15, 0.85, 1], [0, 1, 1, 0]),
    };
  });

  const caption =
    frame < 195
      ? 'Apresentando o projeto desenvolvido para jogar Fórmula 1: F1 Screen × ESP32 Lightning.'
      : 'Um ecossistema completo que conecta a telemetria do console à IA e iluminação física em tempo real.';

  return (
    <FrameShell
      tag="PROJETO F1 APP • VISÃO GERAL"
      stepLabel="CENA 01 / 06"
      caption={caption}
      globalProgress={globalProgress}
    >
      <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 44}}>
        {/* Coluna Esquerda */}
        <div style={{width: 650, display: 'flex', flexDirection: 'column', gap: 24}}>
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 66,
              fontWeight: 900,
              lineHeight: 1.04,
              letterSpacing: -1,
              transform: `scale(${titleScale})`,
              transformOrigin: 'left center',
            }}
          >
            F1 SCREEN
            <br />
            <span style={{color: COLORS.red}}>× ESP32</span>
            <br />
            LIGHTNING
          </div>

          <div
            style={{
              width: interpolate(frame, [5, 35], [0, 360], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
              height: 6,
              backgroundColor: COLORS.red,
              borderRadius: 3,
            }}
          />

          <div style={{fontSize: 26, color: COLORS.muted, fontWeight: 500, lineHeight: 1.35}}>
            Ecossistema de telemetria física via IoT com IA e microcontrolador desenvolvido para Fórmula 1.
          </div>

          <div style={{display: 'flex', flexDirection: 'column', gap: 14, marginTop: 4}}>
            {badges.map((b) => {
              const op = interpolate(frame, [b.delay, b.delay + 18], [0, 1], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              const tx = interpolate(frame, [b.delay, b.delay + 18], [-24, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              });
              return (
                <div
                  key={b.tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    fontSize: 22,
                    opacity: op,
                    transform: `translateX(${tx}px)`,
                  }}
                >
                  <span style={{fontFamily: FONTS.mono, fontWeight: 800, color: COLORS.red}}>{b.tag}</span>
                  <span style={{fontWeight: 600}}>{b.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Coluna Direita: Ilustração Realista do PS5 + TV F1 + Envio ao Receptor */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            justifyContent: 'flex-end',
            transform: `translateY(${interpolate(cardSlide, [0, 1], [50, 0])}px)`,
            opacity: cardSlide,
          }}
        >
          <CardBox style={{padding: '32px 36px', width: 1060, display: 'flex', flexDirection: 'column', gap: 24}}>
            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%'}}>
              <div style={{fontFamily: FONTS.mono, fontSize: 20, fontWeight: 900, color: COLORS.ink}}>
                ECOSSISTEMA EM EXECUÇÃO • TEMPO REAL
              </div>
              <div
                style={{
                  fontFamily: FONTS.mono,
                  fontSize: 16,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  backgroundColor: COLORS.red,
                  padding: '6px 14px',
                  borderRadius: 6,
                }}
              >
                ● TELEMETRIA ATIVA 30 HZ
              </div>
            </div>

            <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16}}>
              {/* PS5 Realista + DualSense */}
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <RealisticPs5Console scale={0.95} transmitting />
              </div>

              {/* Monitor / TV com F1 rodando */}
              <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center'}}>
                <div
                  style={{
                    width: 390,
                    height: 240,
                    backgroundColor: '#111111',
                    borderRadius: 14,
                    padding: 10,
                    border: '4px solid #111111',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.18)',
                  }}
                >
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: 8,
                      overflow: 'hidden',
                      background: 'linear-gradient(180deg, #38BDF8 0%, #BAE6FD 46%, #374151 46%, #18181B 100%)',
                      position: 'relative',
                    }}
                  >
                    <svg width="100%" height="100%" viewBox="0 0 370 220">
                      {/* Arquibancadas / horizonte */}
                      <rect x="0" y="88" width="370" height="14" fill="#1E293B" />
                      {/* Pista */}
                      <polygon points="145,102 225,102 360,220 10,220" fill="#27272A" />
                      {/* Zebras animadas */}
                      <line x1="145" y1="102" x2="10" y2="220" stroke="#D92323" strokeWidth="9" strokeDasharray="20 20" strokeDashoffset={-roadOffset} />
                      <line x1="225" y1="102" x2="360" y2="220" stroke="#D92323" strokeWidth="9" strokeDasharray="20 20" strokeDashoffset={-roadOffset} />
                      <line x1="185" y1="106" x2="185" y2="220" stroke="#FFFFFF" strokeWidth="3.5" strokeDasharray="18 18" strokeDashoffset={-roadOffset} />
                      {/* Carro / Halo / Pneus dianteiros */}
                      <rect x="52" y="168" width="32" height="46" rx="6" fill="#111111" />
                      <rect x="286" y="168" width="32" height="46" rx="6" fill="#111111" />
                      <path d="M120 220 L155 156 L215 156 L250 220 Z" fill="#D92323" stroke="#111111" strokeWidth="3" />
                      <path d="M88 220 Q185 135 282 220" fill="none" stroke="#111111" strokeWidth="12" />
                      <rect x="181" y="168" width="8" height="52" fill="#111111" />
                      {/* Volante HUD na TV */}
                      <rect x="155" y="192" width="60" height="24" rx="4" fill="#18181B" stroke="#4ADE80" strokeWidth="2" />
                      <text x="185" y="209" textAnchor="middle" fill="#4ADE80" fontSize="13" fontWeight="900" fontFamily="monospace">
                        278
                      </text>
                      {/* Badge F1 */}
                      <rect x="12" y="12" width="54" height="26" rx="5" fill="#D92323" />
                      <text x="39" y="30" textAnchor="middle" fill="#FFFFFF" fontSize="16" fontWeight="900" fontFamily="monospace">
                        F1 25
                      </text>
                    </svg>
                  </div>
                </div>
                {/* Base do monitor */}
                <div style={{width: 56, height: 16, backgroundColor: '#111111'}} />
                <div style={{width: 130, height: 8, backgroundColor: '#111111', borderRadius: 4}} />
              </div>

              {/* Feixe de Transmissão Wi-Fi UDP -> Receptor */}
              <div style={{width: 155, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10}}>
                {/* Ícone de ondas Wi-Fi pulsando */}
                <svg width="64" height="48" viewBox="0 0 64 48">
                  {[0, 1, 2].map((ring) => {
                    const op = interpolate((frame + ring * 8) % 24, [0, 12, 24], [0.25, 1, 0.25]);
                    return (
                      <path
                        key={ring}
                        d={`M ${12 - ring * 4} ${32 - ring * 6} Q 32 ${10 - ring * 8} ${52 + ring * 4} ${32 - ring * 6}`}
                        fill="none"
                        stroke={COLORS.red}
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        opacity={op}
                      />
                    );
                  })}
                  <circle cx="32" cy="38" r="4.5" fill={COLORS.red} />
                </svg>

                {/* Trilha de pacotes indo para o receptor */}
                <div style={{width: '100%', height: 34, position: 'relative', display: 'flex', alignItems: 'center'}}>
                  <div style={{width: '100%', height: 4, backgroundColor: '#E2E8F0', borderRadius: 2}} />
                  {streamPackets.map((pkt) => (
                    <div
                      key={pkt.id}
                      style={{
                        position: 'absolute',
                        left: pkt.x,
                        opacity: pkt.opacity,
                        backgroundColor: COLORS.red,
                        color: '#FFFFFF',
                        fontFamily: FONTS.mono,
                        fontSize: 11,
                        fontWeight: 900,
                        padding: '3px 7px',
                        borderRadius: 4,
                        border: '2px solid #111111',
                      }}
                    >
                      UDP
                    </div>
                  ))}
                </div>

                <div style={{fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800, color: COLORS.ink, textAlign: 'center'}}>
                  WI-FI • 30 HZ
                  <br />
                  <span style={{color: COLORS.muted, fontSize: 11}}>PACOTES BINÁRIOS</span>
                </div>
              </div>

              {/* Receptor Mobile (F1 Display) recebendo os dados */}
              <div
                style={{
                  width: 230,
                  height: 240,
                  backgroundColor: COLORS.darkPanel,
                  borderRadius: 24,
                  border: '5px solid #111111',
                  padding: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  color: '#FFFFFF',
                  boxShadow: '6px 6px 0px #D92323',
                }}
              >
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: FONTS.mono, fontSize: 12}}>
                  <span style={{color: '#4ADE80', fontWeight: 800}}>● RX ONLINE</span>
                  <span style={{backgroundColor: COLORS.red, padding: '2px 7px', borderRadius: 4, fontWeight: 800}}>F1 DISPLAY</span>
                </div>

                <div style={{textAlign: 'center', margin: '6px 0'}}>
                  <div style={{fontFamily: FONTS.mono, fontSize: 44, fontWeight: 900, lineHeight: 1}}>
                    {274 + (Math.floor(frame / 6) % 6)}
                  </div>
                  <div style={{fontFamily: FONTS.mono, fontSize: 13, color: '#A1A1AA'}}>KM/H • GEAR 7</div>
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.mono, fontSize: 12}}>
                    <span style={{color: '#FACC15'}}>ERS 78%</span>
                    <span style={{color: '#4ADE80'}}>DRS ON</span>
                  </div>
                  <div style={{width: '100%', height: 7, backgroundColor: '#27272A', borderRadius: 4, overflow: 'hidden'}}>
                    <div style={{width: '78%', height: '100%', backgroundColor: '#4ADE80'}} />
                  </div>
                  <div style={{fontFamily: FONTS.mono, fontSize: 13, textAlign: 'center', color: '#E4E4E7', marginTop: 2}}>
                    ⏱ 1:23.456
                  </div>
                </div>
              </div>
            </div>

            {/* Rodapé explicativo dentro do card */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: '#FAF7F2',
                border: '2px solid #111111',
                borderRadius: 10,
                padding: '10px 20px',
                fontFamily: FONTS.mono,
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              <span>1. PS5 EXECUTA O JOGO</span>
              <span style={{color: COLORS.red}}>→</span>
              <span>2. TRANSMITE UDP VIA WI-FI (30 HZ)</span>
              <span style={{color: COLORS.red}}>→</span>
              <span style={{color: COLORS.green}}>3. RECEPTOR CAPTURA AO VIVO</span>
            </div>
          </CardBox>
        </div>
      </div>
    </FrameShell>
  );
};
