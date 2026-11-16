import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CardBox, FrameShell, RealisticPs5Console} from '../components/SharedUI';
import {COLORS, FONTS} from '../theme';

type QueuePacket = {
  id: string;
  kind: 'valid' | 'noise';
  badge: string;
  title: string;
  rawPreview: string;
  accent: string;
  shape: 'rounded' | 'cut' | 'pill' | 'dashed';
};

const QUEUE_PACKETS: QueuePacket[] = [
  {
    id: 'pkt-telem',
    kind: 'valid',
    badge: 'PKT #06 • TELEM',
    title: 'speed: 278 | gear: 7',
    rawPreview: '{0x16, rpm: 11840, drs: 1}',
    accent: COLORS.red,
    shape: 'rounded',
  },
  {
    id: 'pkt-noise-1',
    kind: 'noise',
    badge: 'RUÍDO / INÚTIL',
    title: '0xFF 0x00 ?? DUMMY',
    rawPreview: 'pacote irrelevante / ruído',
    accent: '#71717A',
    shape: 'dashed',
  },
  {
    id: 'pkt-lap',
    kind: 'valid',
    badge: 'PKT #02 • LAP',
    title: 'lap: 14 | 1:23.456',
    rawPreview: '{0x02, s1: 27.1s, pos: 1}',
    accent: '#2563EB',
    shape: 'pill',
  },
  {
    id: 'pkt-status',
    kind: 'valid',
    badge: 'PKT #07 • STATUS',
    title: 'ers: 78% | tyres: OK',
    rawPreview: '{0x07, fuel: 14.2, mix: 2}',
    accent: COLORS.green,
    shape: 'cut',
  },
  {
    id: 'pkt-noise-2',
    kind: 'noise',
    badge: 'DADO INÚTIL',
    title: 'SPECTATOR / LOBBY',
    rawPreview: 'descartado pelo filtro',
    accent: '#71717A',
    shape: 'dashed',
  },
  {
    id: 'pkt-session',
    kind: 'valid',
    badge: 'PKT #01 • PISTA',
    title: 'track: 28°C | DRY',
    rawPreview: '{0x01, flag: GREEN, sc: 0}',
    accent: COLORS.amber,
    shape: 'rounded',
  },
];

export const Scene2Udp: React.FC<{globalProgress: number}> = ({globalProgress}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({frame, fps, config: {damping: 18, stiffness: 110}});
  const cpuSpin = (frame * 4) % 360;

  // Movimento devagar e contínuo em fila (ciclo de 240 frames = 8 segundos para atravessar a ponte Wi-Fi)
  const cycleFrames = 240;

  const caption =
    frame < 165
      ? 'Os pacotes semi-estruturados viajam em fila pelo Wi-Fi com diferentes tipos de dados.'
      : 'O celular captura a fila em tempo real, computa os dados úteis e descarta o ruído.';

  return (
    <FrameShell
      tag="ETAPA 01 • TRANSMISSÃO UDP WI-FI (30 HZ)"
      stepLabel="CENA 02 / 06"
      caption={caption}
      globalProgress={globalProgress}
    >
      <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: 28}}>
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: FONTS.mono, fontSize: 44, fontWeight: 900}}>
            PS5 <span style={{color: COLORS.red}}>→ STREAM UDP →</span> RECEPTOR MOBILE
          </div>
          <div style={{fontSize: 22, color: COLORS.muted, marginTop: 6}}>
            Pacotes semi-estruturados variados viajando via Wi-Fi até o filtro de captura do celular
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'stretch',
            justifyContent: 'space-between',
            width: '100%',
            height: 455,
            gap: 24,
            transform: `scale(${enter})`,
          }}
        >
          {/* 1. Esquerda: Console PS5 (mantido) */}
          <CardBox
            style={{
              width: 350,
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
              <span style={{fontFamily: FONTS.mono, fontSize: 15, fontWeight: 900, color: COLORS.red}}>● TX WI-FI</span>
              <span style={{fontFamily: FONTS.mono, fontSize: 14, fontWeight: 700, color: COLORS.muted}}>UDP :20777</span>
            </div>

            <RealisticPs5Console scale={0.9} transmitting />

            <div style={{textAlign: 'center', width: '100%'}}>
              <div style={{fontFamily: FONTS.mono, fontSize: 21, fontWeight: 900}}>PS5 + F1 TELEMETRY</div>
              <div style={{fontSize: 15, color: COLORS.muted, marginTop: 4}}>Emite fila de pacotes a 30 Hz</div>
            </div>
          </CardBox>

          {/* 2. Meio: Ponte Wi-Fi com Fila de Pacotes Variados + Descarte de Ruído */}
          <CardBox
            style={{
              flex: 1,
              padding: '20px 26px',
              backgroundColor: '#FAF7F2',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Topo do canal Wi-Fi */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 3}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                <span
                  style={{
                    backgroundColor: COLORS.red,
                    color: '#FFFFFF',
                    fontFamily: FONTS.mono,
                    fontSize: 14,
                    fontWeight: 900,
                    padding: '5px 12px',
                    borderRadius: 6,
                  }}
                >
                  ((( WI-FI STREAM )))
                </span>
                <span style={{fontFamily: FONTS.mono, fontSize: 16, fontWeight: 800, color: COLORS.ink}}>
                  FILA DE PACOTES SEMI-ESTRUTURADOS
                </span>
              </div>
              <div style={{fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: COLORS.muted}}>
                PORTÃO DE FILTRAGEM →
              </div>
            </div>

            {/* Pista central por onde a fila de pacotes caminha devagar */}
            <div style={{position: 'relative', width: '100%', height: 310, display: 'flex', alignItems: 'center'}}>
              {/* Ondas de Wi-Fi sutis ao fundo */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 920 310"
                style={{position: 'absolute', inset: 0, opacity: 0.22}}
              >
                {[120, 220, 320, 420, 520, 620, 720].map((rx, i) => (
                  <path
                    key={rx}
                    d={`M ${rx} 55 Q ${rx + 45} 155 ${rx} 255`}
                    fill="none"
                    stroke={COLORS.red}
                    strokeWidth="4"
                    strokeDasharray="10 10"
                    opacity={interpolate((frame + i * 10) % 40, [0, 20, 40], [0.3, 1, 0.3])}
                  />
                ))}
                {/* Linha guia central da fila */}
                <line x1="10" y1="135" x2="880" y2="135" stroke="#111111" strokeWidth="4" strokeDasharray="14 10" />
              </svg>

              {/* Portão de Filtragem na entrada do Receptor (direita do túnel) */}
              <div
                style={{
                  position: 'absolute',
                  right: 12,
                  top: 32,
                  width: 145,
                  height: 205,
                  border: '4px solid #111111',
                  borderRadius: 14,
                  backgroundColor: '#18181B',
                  color: '#FFFFFF',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 10px',
                  zIndex: 4,
                  boxShadow: '6px 6px 0px #111111',
                }}
              >
                <div style={{fontFamily: FONTS.mono, fontSize: 12, fontWeight: 900, color: '#4ADE80', textAlign: 'center'}}>
                  FILTRO RX
                  <br />
                  INTELIGENTE
                </div>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: '50%',
                    border: '3px dashed #4ADE80',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: `rotate(${cpuSpin}deg)`,
                    fontFamily: FONTS.mono,
                    fontSize: 18,
                  }}
                >
                  ⚙️
                </div>
                <div style={{fontFamily: FONTS.mono, fontSize: 11, textAlign: 'center', lineHeight: 1.35}}>
                  <span style={{color: '#4ADE80'}}>✓ VÁLIDO → ENTRA</span>
                  <br />
                  <span style={{color: '#F87171'}}>✕ RUÍDO → IGNORA</span>
                </div>
              </div>

              {/* Pacotes caminhando devagar em fila (bem espaçados, sem sobreposição) */}
              {QUEUE_PACKETS.map((pkt, idx) => {
                const spacing = cycleFrames / QUEUE_PACKETS.length;
                const rawProg = ((frame * 0.45 + idx * spacing) % cycleFrames) / cycleFrames;
                const x = interpolate(rawProg, [0, 1], [-220, 1190]);

                // Quando um pacote de ruído se aproxima do filtro (x ~ 420..560),
                // ele é desviado para baixo (zona de descarte) e marcado como IGNORADO!
                const isNoiseDropped = pkt.kind === 'noise' && rawProg > 0.45;
                const dropY =
                  pkt.kind === 'noise'
                    ? interpolate(rawProg, [0.45, 0.62], [0, 118], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                      })
                    : 0;
                const opacity =
                  pkt.kind === 'noise'
                    ? interpolate(rawProg, [0.05, 0.14, 0.58, 0.68], [0, 1, 1, 0], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                      })
                    : interpolate(rawProg, [0.05, 0.14, 0.56, 0.63], [0, 1, 1, 0], {
                        extrapolateLeft: 'clamp',
                        extrapolateRight: 'clamp',
                      });

                const borderRadius =
                  pkt.shape === 'pill' ? 22 : pkt.shape === 'cut' ? 4 : pkt.shape === 'dashed' ? 8 : 14;

                return (
                  <div
                    key={pkt.id}
                    style={{
                      position: 'absolute',
                      left: x,
                      top: 68 + dropY,
                      opacity,
                      width: 186,
                      padding: '10px 12px',
                      backgroundColor: pkt.kind === 'noise' ? '#F4F4F5' : '#FFFFFF',
                      border:
                        pkt.kind === 'noise'
                          ? '3px dashed #71717A'
                          : `3.5px solid #111111`,
                      borderTop: pkt.kind === 'valid' ? `8px solid ${pkt.accent}` : undefined,
                      borderRadius,
                      boxShadow: pkt.kind === 'noise' ? 'none' : '5px 5px 0px #111111',
                      fontFamily: FONTS.mono,
                      zIndex: 3,
                      transform: isNoiseDropped ? 'rotate(8deg) scale(0.92)' : 'none',
                    }}
                  >
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: pkt.kind === 'noise' ? '#71717A' : '#FFFFFF',
                          backgroundColor: pkt.kind === 'noise' ? '#E4E4E7' : pkt.accent,
                          padding: '2px 7px',
                          borderRadius: 4,
                        }}
                      >
                        {pkt.badge}
                      </span>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 900,
                          color: pkt.kind === 'noise' ? COLORS.red : COLORS.green,
                        }}
                      >
                        {pkt.kind === 'noise' ? (isNoiseDropped ? '✕ IGNORADO' : '⚠ RUÍDO') : '● DADO ÚTIL'}
                      </span>
                    </div>

                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 900,
                        color: pkt.kind === 'noise' ? '#52525B' : COLORS.ink,
                        marginTop: 6,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {pkt.title}
                    </div>

                    <div
                      style={{
                        fontSize: 11,
                        color: COLORS.muted,
                        marginTop: 3,
                        backgroundColor: '#F1F5F9',
                        padding: '3px 6px',
                        borderRadius: 4,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                      }}
                    >
                      {pkt.rawPreview}
                    </div>
                  </div>
                );
              })}

              {/* Faixa inferior mostrando zona de descarte de ruído */}
              <div
                style={{
                  position: 'absolute',
                  right: 170,
                  bottom: 6,
                  backgroundColor: '#FEE2E2',
                  border: '2px dashed #D92323',
                  borderRadius: 8,
                  padding: '5px 14px',
                  fontFamily: FONTS.mono,
                  fontSize: 12,
                  fontWeight: 800,
                  color: COLORS.red,
                }}
              >
                🗑️ ZONA DE DESCARTE: RUÍDO E PACOTES INÚTEIS IGNORADOS
              </div>
            </div>

            {/* Legenda dos tipos de pacote */}
            <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800, color: COLORS.muted}}>
              <span>🔴 TELEMETRIA (VEL/RPM)</span>
              <span>🔵 VOLTA & SETORES</span>
              <span>🟢 STATUS & PNEUS</span>
              <span>⚪ RUÍDO (DESCARTADO)</span>
            </div>
          </CardBox>

          {/* 3. Direita: Celular Capturando e Computando Tudo */}
          <CardBox
            style={{
              width: 390,
              padding: '22px 24px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center'}}>
              <span style={{fontFamily: FONTS.mono, fontSize: 15, fontWeight: 900, color: COLORS.green}}>
                ● CAPTURANDO & COMPUTANDO
              </span>
              <span style={{fontFamily: FONTS.mono, fontSize: 13, fontWeight: 800}}>30 HZ</span>
            </div>

            {/* Smartphone processando os pacotes válidos */}
            <div
              style={{
                width: '100%',
                height: 300,
                backgroundColor: COLORS.darkPanel,
                borderRadius: 24,
                border: '6px solid #111111',
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                color: '#FFFFFF',
              }}
            >
              {/* Cabeçalho do processador do celular */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#27272A',
                  padding: '8px 12px',
                  borderRadius: 10,
                  border: '2px solid #4ADE80',
                }}
              >
                <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: '3px solid #4ADE80',
                      borderTopColor: 'transparent',
                      transform: `rotate(${cpuSpin * 2}deg)`,
                    }}
                  />
                  <span style={{fontFamily: FONTS.mono, fontSize: 13, fontWeight: 900, color: '#4ADE80'}}>
                    ENGINE RODANDO...
                  </span>
                </div>
                <span style={{fontFamily: FONTS.mono, fontSize: 12, color: '#FACC15', fontWeight: 800}}>
                  CPU ATIVA
                </span>
              </div>

              {/* Lista de pacotes computados vs ignorados */}
              <div style={{display: 'flex', flexDirection: 'column', gap: 8}}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: '#27272A',
                    padding: '7px 10px',
                    borderRadius: 6,
                    fontFamily: FONTS.mono,
                    fontSize: 12,
                    borderLeft: `4px solid ${COLORS.red}`,
                  }}
                >
                  <span>PKT #06 TELEM</span>
                  <span style={{color: '#4ADE80', fontWeight: 900}}>COMPUTADO ✓</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: '#27272A',
                    padding: '7px 10px',
                    borderRadius: 6,
                    fontFamily: FONTS.mono,
                    fontSize: 12,
                    borderLeft: '4px solid #2563EB',
                  }}
                >
                  <span>PKT #02 LAP DATA</span>
                  <span style={{color: '#4ADE80', fontWeight: 900}}>COMPUTADO ✓</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: '#27272A',
                    padding: '7px 10px',
                    borderRadius: 6,
                    fontFamily: FONTS.mono,
                    fontSize: 12,
                    borderLeft: `4px solid ${COLORS.green}`,
                  }}
                >
                  <span>PKT #07 STATUS</span>
                  <span style={{color: '#4ADE80', fontWeight: 900}}>COMPUTADO ✓</span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    backgroundColor: '#18181B',
                    padding: '6px 10px',
                    borderRadius: 6,
                    fontFamily: FONTS.mono,
                    fontSize: 12,
                    border: '1px dashed #71717A',
                    color: '#A1A1AA',
                  }}
                >
                  <span>RUÍDO / DUMMY</span>
                  <span style={{color: '#F87171', fontWeight: 900}}>IGNORADO ✕</span>
                </div>
              </div>

              {/* Barra de filtro limpo */}
              <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.mono, fontSize: 12, color: '#A1A1AA'}}>
                <span>DADOS VÁLIDOS: 100%</span>
                <span style={{color: '#4ADE80', fontWeight: 800}}>RUÍDO FILTRADO</span>
              </div>
            </div>

            <div style={{textAlign: 'center', width: '100%'}}>
              <div style={{fontFamily: FONTS.mono, fontSize: 21, fontWeight: 900}}>F1 DISPLAY (MOBILE)</div>
              <div style={{fontSize: 15, color: COLORS.muted, marginTop: 4}}>Filtra ruído e processa pacotes válidos</div>
            </div>
          </CardBox>
        </div>
      </div>
    </FrameShell>
  );
};
