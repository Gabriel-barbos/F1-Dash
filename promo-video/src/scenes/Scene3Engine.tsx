import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CardBox, FrameShell} from '../components/SharedUI';
import {COLORS, FONTS} from '../theme';

export const Scene3Engine: React.FC<{globalProgress: number}> = ({globalProgress}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({frame, fps, config: {damping: 18, stiffness: 110}});
  // Velocidade reduzida na esteira para leitura confortável e detalhada
  const beltDashOffset = -(frame * 4.2) % 48;
  const rollerAngle = (frame * 4.5) % 360;
  const engineGearAngle = (frame * 3.5) % 360;

  const speed = Math.round(interpolate(frame, [20, 260], [218, 278], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
  const gear = frame < 90 ? 6 : 7;
  const drsActive = frame > 105;
  const battery = Math.round(interpolate(frame, [20, 300], [84, 78], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));

  // Pacotinhos na entrada (esquerda da esteira) -> entram no UDP PARSER ENGINE (centro) ->
  // saem como informação resolvida e pronta para exibir (direita da esteira)!
  const conveyorItems = [
    {
      pktTag: 'PKT_TELEM #06',
      rawHex: '0x16 0x4F 0x8A',
      rawSub: 'semi-estruturado',
      resolvedTag: 'VELOCIDADE & RPM',
      resolvedValue: '278 KM/H • 11.8k RPM',
      color: COLORS.red,
    },
    {
      pktTag: 'PKT_CTRL #06',
      rawHex: '0x07 0x01 0xFF',
      rawSub: 'bits de marcha/asa',
      resolvedTag: 'TRANSMISSÃO & ASA',
      resolvedValue: 'MARCHA 7 • DRS ATIVO',
      color: COLORS.green,
    },
    {
      pktTag: 'PKT_STATUS #07',
      rawHex: '0x4E 0xC3 0x19',
      rawSub: 'carga de energia',
      resolvedTag: 'ENERGIA & VOLTA',
      resolvedValue: 'ERS 78% • 1:23.456',
      color: '#2563EB',
    },
    {
      pktTag: 'PKT_DAMAGE #10',
      rawHex: '0x53 0x2B 0x7F',
      rawSub: 'sensores de roda',
      resolvedTag: 'SAÚDE DOS PNEUS',
      resolvedValue: 'FL 82% | FR 79% OK',
      color: COLORS.amber,
    },
  ].map((item, idx) => {
    // Movimento mais lento: ciclo de 240 frames (8 segundos) para cruzar a esteira inteira
    const p = ((frame * 0.58 + idx * 60) % 240) / 240;
    const x = interpolate(p, [0, 1], [-40, 1020]);
    const isResolved = x >= 490;
    const opacity = interpolate(p, [0, 0.08, 0.92, 1], [0, 1, 1, 0]);
    return {...item, idx, x, isResolved, opacity};
  });

  const caption =
    frame < 230
      ? 'Na esteira da UDP Parser Engine, os pacotinhos brutos entram em fila para decodificação.'
      : 'A engine processa cada pacote e entrega a informação já resolvida e pronta para exibir no HUD.';

  return (
    <FrameShell
      tag="ETAPA 01 • BYTES BRUTOS • UDP PARSER ENGINE"
      stepLabel="CENA 03 / 06"
      caption={caption}
      globalProgress={globalProgress}
    >
      <div style={{display: 'flex', flexDirection: 'column', width: '100%', gap: 26, transform: `scale(${enter})`}}>
        {/* Título solicitado: BYTES BRUTOS • UDP PARSER ENGINE */}
        <div style={{textAlign: 'center'}}>
          <div style={{fontFamily: FONTS.mono, fontSize: 44, fontWeight: 900, letterSpacing: -0.5}}>
            BYTES BRUTOS <span style={{color: COLORS.red}}>• UDP PARSER ENGINE</span>
          </div>
          <div style={{fontSize: 22, color: COLORS.muted, marginTop: 4}}>
            Pacotes semi-estruturados entram na esteira, são processados pela engine e saem prontos para o HUD
          </div>
        </div>

        {/* Pipeline principal: Esteira + HUD */}
        <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 28}}>
          {/* ESTEIRA DE PROCESSAMENTO (Esquerda + Centro) */}
          <CardBox
            style={{
              width: 1130,
              height: 455,
              padding: '22px 26px',
              backgroundColor: '#FAF7F2',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              overflow: 'hidden',
            }}
          >
            {/* Labels das 3 zonas da esteira */}
            <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.mono, fontSize: 15, fontWeight: 900, zIndex: 5}}>
              <span style={{backgroundColor: '#27272A', color: '#FACC15', padding: '6px 14px', borderRadius: 6}}>
                1. ENTRADA: PACOTINHOS BRUTOS
              </span>
              <span style={{backgroundColor: COLORS.red, color: '#FFFFFF', padding: '6px 14px', borderRadius: 6}}>
                2. UDP PARSER ENGINE (PROCESSANDO)
              </span>
              <span style={{backgroundColor: COLORS.green, color: '#FFFFFF', padding: '6px 14px', borderRadius: 6}}>
                3. SAÍDA: INFORMAÇÃO RESOLVIDA
              </span>
            </div>

            {/* Área central onde passam os pacotinhos + Máquina UDP Parser Engine */}
            <div style={{position: 'relative', width: '100%', height: 300, display: 'flex', alignItems: 'center'}}>
              {/* Itens viajando devagar sobre a esteira */}
              {conveyorItems.map((it) => (
                <div
                  key={it.idx}
                  style={{
                    position: 'absolute',
                    left: it.x,
                    top: 86,
                    opacity: it.opacity,
                    width: 235,
                    borderRadius: it.isResolved ? 12 : 8,
                    backgroundColor: it.isResolved ? '#FFFFFF' : '#18181B',
                    color: it.isResolved ? COLORS.ink : '#FFFFFF',
                    border: it.isResolved ? `4px solid ${it.color}` : '3px dashed #FACC15',
                    boxShadow: '6px 6px 0px #111111',
                    fontFamily: FONTS.mono,
                    overflow: 'hidden',
                    zIndex: 2,
                  }}
                >
                  {/* Cabeçalho do pacotinho (Entrada vs Saída Resolvida) */}
                  <div
                    style={{
                      backgroundColor: it.isResolved ? it.color : '#27272A',
                      color: '#FFFFFF',
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: 900,
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{it.isResolved ? `✓ ${it.resolvedTag}` : `📦 ${it.pktTag}`}</span>
                    <span>{it.isResolved ? 'PRONTO' : 'RAW'}</span>
                  </div>

                  {/* Corpo do pacotinho */}
                  <div style={{padding: '10px 12px', textAlign: 'center'}}>
                    <div
                      style={{
                        fontSize: it.isResolved ? 16 : 15,
                        fontWeight: 900,
                        color: it.isResolved ? COLORS.ink : '#FACC15',
                      }}
                    >
                      {it.isResolved ? it.resolvedValue : it.rawHex}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        marginTop: 4,
                        color: it.isResolved ? COLORS.green : '#A1A1AA',
                        fontWeight: 700,
                      }}
                    >
                      {it.isResolved ? '→ PRONTO PARA EXIBIR' : it.rawSub}
                    </div>
                  </div>
                </div>
              ))}

              {/* MÁQUINA CENTRAL: UDP PARSER ENGINE RODANDO */}
              <div
                style={{
                  position: 'absolute',
                  left: 410,
                  top: 10,
                  width: 275,
                  height: 238,
                  backgroundColor: '#FFFFFF',
                  border: '5px solid #111111',
                  borderRadius: 16,
                  boxShadow: '10px 10px 0px #111111',
                  zIndex: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                }}
              >
                <div
                  style={{
                    backgroundColor: COLORS.red,
                    color: '#FFFFFF',
                    fontFamily: FONTS.mono,
                    fontSize: 14,
                    fontWeight: 900,
                    padding: '5px 12px',
                    borderRadius: 6,
                    width: '100%',
                    textAlign: 'center',
                  }}
                >
                  UDP PARSER ENGINE
                </div>

                {/* Visor interno da Engine com engrenagens girando + scanner */}
                <div
                  style={{
                    width: '100%',
                    height: 125,
                    backgroundColor: '#18181B',
                    borderRadius: 10,
                    border: '3px solid #111111',
                    position: 'relative',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#4ADE80',
                    fontFamily: FONTS.mono,
                    gap: 8,
                  }}
                >
                  {/* Engrenagens animadas simbolizando a engine rodando */}
                  <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                    <svg width="38" height="38" viewBox="0 0 40 40" style={{transform: `rotate(${engineGearAngle}deg)`}}>
                      <circle cx="20" cy="20" r="12" fill="none" stroke="#4ADE80" strokeWidth="5" strokeDasharray="6 4" />
                      <circle cx="20" cy="20" r="5" fill="#4ADE80" />
                    </svg>
                    <svg width="32" height="32" viewBox="0 0 40 40" style={{transform: `rotate(${-engineGearAngle * 1.3}deg)`}}>
                      <circle cx="20" cy="20" r="11" fill="none" stroke="#FACC15" strokeWidth="5" strokeDasharray="5 4" />
                      <circle cx="20" cy="20" r="4" fill="#FACC15" />
                    </svg>
                  </div>

                  <div style={{fontSize: 12, fontWeight: 900, color: '#FFFFFF'}}>
                    DECODIFICANDO PACOTES...
                  </div>
                  <div style={{fontSize: 11, color: '#FACC15', fontWeight: 700}}>
                    KOTLIN UDP → TS DATAVIEW
                  </div>

                  {/* Feixe de scanner */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      bottom: 0,
                      left: `${interpolate((frame * 2) % 80, [0, 40, 80], [10, 90, 10])}%`,
                      width: 5,
                      backgroundColor: COLORS.red,
                      boxShadow: '0 0 14px #D92323',
                    }}
                  />
                </div>

                <div style={{fontFamily: FONTS.mono, fontSize: 12, fontWeight: 900, color: COLORS.green}}>
                  ● ENGINE ATIVA • 30 HZ
                </div>
              </div>

              {/* Estrutura Física da Esteira (Correia + Roletes Giratórios) */}
              <svg
                width="1070"
                height="90"
                viewBox="0 0 1070 90"
                style={{position: 'absolute', left: 0, bottom: 0, zIndex: 3}}
              >
                <rect x="20" y="20" width="1030" height="46" rx="23" fill="#27272A" stroke="#111111" strokeWidth="5" />
                <line
                  x1="44"
                  y1="18"
                  x2="1026"
                  y2="18"
                  stroke="#FACC15"
                  strokeWidth="6"
                  strokeDasharray="24 24"
                  strokeDashoffset={beltDashOffset}
                />
                {[70, 210, 350, 490, 630, 770, 910, 1005].map((cx) => (
                  <g key={cx} transform={`translate(${cx}, 43) rotate(${rollerAngle})`}>
                    <circle cx="0" cy="0" r="15" fill="#E4E4E7" stroke="#111111" strokeWidth="3.5" />
                    <line x1="-11" y1="0" x2="11" y2="0" stroke="#111111" strokeWidth="3" />
                    <line x1="0" y1="-11" x2="0" y2="11" stroke="#111111" strokeWidth="3" />
                  </g>
                ))}
              </svg>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: COLORS.muted}}>
              <span>📦 PACOTE SEMI-ESTRUTURADO</span>
              <span style={{color: COLORS.red}}>⚙️ ENGINE RESOLVE E VALIDA OS CAMPOS</span>
              <span style={{color: COLORS.green}}>✓ DADO PRONTO PARA EXIBIÇÃO →</span>
            </div>
          </CardBox>

          {/* DIREITA: TELA DO JOGADOR (HUD AO VIVO — MANTIDO) */}
          <CardBox
            style={{
              flex: 1,
              height: 455,
              padding: 26,
              backgroundColor: COLORS.darkPanel,
              color: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div style={{backgroundColor: COLORS.red, padding: '6px 14px', borderRadius: 6, fontFamily: FONTS.mono, fontWeight: 900, fontSize: 18}}>
                HUD DO PILOTO • AO VIVO
              </div>
              <div style={{fontFamily: FONTS.mono, fontSize: 16, color: '#4ADE80', fontWeight: 800}}>● 30 FPS SYNC</div>
            </div>

            <div style={{backgroundColor: '#27272A', borderRadius: 14, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <div>
                <div style={{fontFamily: FONTS.mono, fontSize: 68, fontWeight: 900, lineHeight: 1}}>{speed}</div>
                <div style={{fontFamily: FONTS.mono, fontSize: 16, color: '#A1A1AA', marginTop: 4}}>VELOCIDADE (KM/H)</div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'flex-end'}}>
                <div style={{fontFamily: FONTS.mono, fontSize: 26, fontWeight: 900, backgroundColor: '#111111', padding: '8px 18px', borderRadius: 8, border: '2px solid #52525B'}}>
                  GEAR {gear}
                </div>
                <div
                  style={{
                    fontFamily: FONTS.mono,
                    fontSize: 20,
                    fontWeight: 900,
                    backgroundColor: drsActive ? COLORS.green : '#3F3F46',
                    color: '#FFFFFF',
                    padding: '6px 18px',
                    borderRadius: 8,
                  }}
                >
                  {drsActive ? 'DRS ATIVO' : 'DRS OFF'}
                </div>
              </div>
            </div>

            <div style={{backgroundColor: '#27272A', borderRadius: 14, padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: 10}}>
              <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.mono, fontSize: 16}}>
                <span>BATERIA ERS</span>
                <span style={{color: '#FACC15', fontWeight: 900}}>{battery}%</span>
              </div>
              <div style={{width: '100%', height: 12, backgroundColor: '#111111', borderRadius: 6, overflow: 'hidden'}}>
                <div style={{width: `${battery}%`, height: '100%', backgroundColor: '#FACC15'}} />
              </div>
              <div style={{display: 'flex', justifyContent: 'space-between', fontFamily: FONTS.mono, fontSize: 20, fontWeight: 900, marginTop: 4}}>
                <span>VOLTA ATUAL</span>
                <span style={{color: '#4ADE80'}}>1:23.456</span>
              </div>
            </div>

            <div style={{backgroundColor: '#27272A', borderRadius: 14, padding: '12px 20px'}}>
              <div style={{fontFamily: FONTS.mono, fontSize: 13, color: '#A1A1AA', marginBottom: 8}}>
                SAÚDE DOS PNEUS (FL / FR / RL / RR)
              </div>
              <div style={{display: 'flex', gap: 10}}>
                {[82, 79, 85, 84].map((w, idx) => (
                  <div
                    key={idx}
                    style={{
                      flex: 1,
                      backgroundColor: '#111111',
                      borderRadius: 8,
                      padding: '8px 0',
                      textAlign: 'center',
                      fontFamily: FONTS.mono,
                      fontSize: 17,
                      fontWeight: 900,
                      color: w < 80 ? '#F59E0B' : '#4ADE80',
                    }}
                  >
                    {w}%
                  </div>
                ))}
              </div>
            </div>
          </CardBox>
        </div>
      </div>
    </FrameShell>
  );
};
