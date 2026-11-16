import React from 'react';
import {interpolate, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {CardBox, FrameShell} from '../components/SharedUI';
import {COLORS, FONTS} from '../theme';

type LightingMode = {
  id: string;
  shortLabel: string;
  fullTitle: string;
  screenText: string;
  subText: string;
  primary: string;
  secondary: string;
};

const MODES: LightingMode[] = [
  {
    id: 'DRS',
    shortLabel: 'DRS ATIVO',
    fullTitle: 'DRS ATIVADO • ASA MÓVEL ABERTA',
    screenText: '🟢 DRS ENABLED • +18 KM/H',
    subText: 'Ondas verdes ascendentes de alta velocidade nas torres WS2805',
    primary: COLORS.green,
    secondary: '#4ADE80',
  },
  {
    id: 'OVERTAKE',
    shortLabel: 'OVERTAKE',
    fullTitle: 'MODO OVERTAKE • ULTRAPASSAGEM',
    screenText: '⚡ OVERTAKE BUTTON ACTIVE',
    subText: 'Flash dinâmico verde-ciano indicando ataque ao carro da frente',
    primary: COLORS.teal,
    secondary: '#2DD4BF',
  },
  {
    id: 'BOOST',
    shortLabel: 'ERS BOOST',
    fullTitle: 'ERS BOOST • POTÊNCIA MÁXIMA',
    screenText: '🟣 ERS DEPLOY • MAX HARVEST',
    subText: 'Pulso roxo/neon sincronizado com a descarga elétrica da bateria',
    primary: COLORS.purple,
    secondary: '#C084FC',
  },
  {
    id: 'RAIN',
    shortLabel: 'CHUVA',
    fullTitle: 'PISTA MOLHADA • CHUVA INTENSA',
    screenText: '🌧️ WET TRACK • INTER / WET',
    subText: 'Efeito de gotas azuis/ciano descendo pelas fitas endereçáveis',
    primary: COLORS.cyan,
    secondary: '#38BDF8',
  },
  {
    id: 'SAFETY',
    shortLabel: 'SAFETY CAR',
    fullTitle: 'SAFETY CAR • REDUZA A VELOCIDADE',
    screenText: '⚠️ SAFETY CAR DEPLOYED',
    subText: 'Sinalização âmbar alternada estilo luzes de segurança da FIA',
    primary: COLORS.amber,
    secondary: '#FDE047',
  },
  {
    id: 'RED_FLAG',
    shortLabel: 'RED FLAG',
    fullTitle: 'BANDEIRA VERMELHA • SESSÃO PARADA',
    screenText: '🚩 RED FLAG • RETURN TO BOX',
    subText: 'Alerta vermelho intenso em toda a bancada e fita RGB frontal',
    primary: COLORS.red,
    secondary: '#F87171',
  },
];

export const Scene5Esp32: React.FC<{globalProgress: number}> = ({globalProgress}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const enter = spring({frame, fps, config: {damping: 18, stiffness: 110}});

  // 456 frames divididos igualmente entre os 6 cenários (~76 frames = 2.53s cada)
  const modeIndex = Math.min(MODES.length - 1, Math.floor(frame / 76));
  const current = MODES[modeIndex];
  const pulse = 0.65 + Math.abs(Math.sin(frame * 0.28)) * 0.35;

  // Pacotes de comando indo do App para o ESP32
  const cmdPackets = [0, 1].map((i) => {
    const p = ((frame * 1.6 + i * 25) % 50) / 50;
    return {
      id: i,
      x: interpolate(p, [0, 1], [0, 110]),
      opacity: interpolate(p, [0, 0.2, 0.8, 1], [0, 1, 1, 0]),
    };
  });

  const caption =
    frame < 228
      ? 'O app envia o estado da corrida ao ESP32, acionando animações de DRS, Overtake e Boost.'
      : 'As fitas WS2805 e RGB também reagem na hora para chuva, Safety Car e bandeira vermelha.';

  return (
    <FrameShell
      tag="ETAPA 03 • ESP32 LIGHTNING & EFEITOS DE CORRIDA"
      stepLabel="CENA 05 / 06"
      caption={caption}
      globalProgress={globalProgress}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'stretch',
          justifyContent: 'space-between',
          width: '100%',
          gap: 36,
          transform: `scale(${enter})`,
        }}
      >
        {/* Esquerda: App -> ESP32 + Grade dos 6 Cenários */}
        <CardBox style={{width: 560, padding: '26px 28px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: 18}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <span style={{fontFamily: FONTS.mono, fontSize: 17, fontWeight: 900, color: COLORS.red}}>
              APP F1 → ESP32 WLED
            </span>
            <span style={{fontFamily: FONTS.mono, fontSize: 14, fontWeight: 800, color: COLORS.muted}}>
              UDP + RMT DRIVER
            </span>
          </div>

          {/* Ilustração App enviando comando para a placa ESP32 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#FAF7F2',
              border: '3px solid #111111',
              borderRadius: 12,
              padding: '14px 18px',
            }}
          >
            {/* Mini App */}
            <div
              style={{
                backgroundColor: COLORS.darkPanel,
                color: '#FFFFFF',
                padding: '10px 14px',
                borderRadius: 10,
                border: '3px solid #111111',
                fontFamily: FONTS.mono,
                textAlign: 'center',
              }}
            >
              <div style={{fontSize: 11, color: '#4ADE80', fontWeight: 800}}>F1 DISPLAY</div>
              <div style={{fontSize: 15, fontWeight: 900, marginTop: 4, color: current.secondary}}>
                CMD: {current.id}
              </div>
            </div>

            {/* Seta animada com pacotes */}
            <div style={{width: 130, position: 'relative', height: 32, display: 'flex', alignItems: 'center'}}>
              <div style={{width: '100%', height: 4, backgroundColor: '#CBD5E1'}} />
              {cmdPackets.map((pkt) => (
                <div
                  key={pkt.id}
                  style={{
                    position: 'absolute',
                    left: pkt.x,
                    opacity: pkt.opacity,
                    backgroundColor: current.primary,
                    color: '#FFFFFF',
                    fontFamily: FONTS.mono,
                    fontSize: 11,
                    fontWeight: 900,
                    padding: '3px 7px',
                    borderRadius: 4,
                    border: '2px solid #111111',
                  }}
                >
                  {current.id}
                </div>
              ))}
            </div>

            {/* Placa ESP32 */}
            <svg width="115" height="96" viewBox="0 0 115 96">
              <rect x="12" y="8" width="90" height="80" rx="8" fill="#18181B" stroke="#111111" strokeWidth="4" />
              <rect x="28" y="20" width="58" height="38" rx="4" fill="#3F3F46" stroke={current.secondary} strokeWidth="2.5" />
              <text x="57" y="44" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="900" fontFamily="monospace">
                ESP32
              </text>
              {[20, 36, 52, 68].map((y) => (
                <React.Fragment key={y}>
                  <circle cx="6" cy={y} r="3" fill="#FACC15" />
                  <circle cx="108" cy={y} r="3" fill="#FACC15" />
                </React.Fragment>
              ))}
              <circle cx="57" cy="72" r="5" fill={current.primary} />
            </svg>
          </div>

          {/* Grade dos 6 Cenários de Corrida */}
          <div>
            <div style={{fontFamily: FONTS.mono, fontSize: 15, fontWeight: 900, color: COLORS.ink, marginBottom: 10}}>
              6 CENÁRIOS DE ILUMINAÇÃO REATIVA:
            </div>
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10}}>
              {MODES.map((m, idx) => {
                const active = idx === modeIndex;
                return (
                  <div
                    key={m.id}
                    style={{
                      padding: '12px 10px',
                      borderRadius: 10,
                      border: `3px solid ${active ? '#111111' : '#D6D3CD'}`,
                      backgroundColor: active ? m.primary : '#FFFFFF',
                      color: active ? '#FFFFFF' : COLORS.muted,
                      fontFamily: FONTS.mono,
                      fontSize: 14,
                      fontWeight: 900,
                      textAlign: 'center',
                      boxShadow: active ? '4px 4px 0px #111111' : 'none',
                      transform: active ? 'scale(1.03)' : 'scale(1)',
                    }}
                  >
                    {m.shortLabel}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            style={{
              backgroundColor: '#18181B',
              color: '#FFFFFF',
              padding: '12px 16px',
              borderRadius: 10,
              fontFamily: FONTS.mono,
              fontSize: 14,
              lineHeight: 1.4,
            }}
          >
            <span style={{color: current.secondary, fontWeight: 900}}>► {current.shortLabel}: </span>
            {current.subText}
          </div>
        </CardBox>

        {/* Direita: Bancada com Monitor + Fitas WS2805 + LED RGB reagindo a cada cenário */}
        <CardBox
          style={{
            flex: 1,
            padding: '28px 34px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Badge de Estado Ativo */}
          <div
            style={{
              fontFamily: FONTS.mono,
              fontSize: 21,
              fontWeight: 900,
              color: '#FFFFFF',
              backgroundColor: current.primary,
              padding: '8px 26px',
              borderRadius: 999,
              border: '3px solid #111111',
              boxShadow: '4px 4px 0px #111111',
              zIndex: 2,
            }}
          >
            {current.fullTitle}
          </div>

          {/* Setup da Bancada */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: 310,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Glow dinâmico atrás do monitor e das torres */}
            <div
              style={{
                position: 'absolute',
                width: 680,
                height: 250,
                borderRadius: 48,
                background: `radial-gradient(circle, ${current.secondary} 0%, ${current.primary} 55%, transparent 100%)`,
                opacity: 0.38 * pulse,
                filter: 'blur(30px)',
              }}
            />

            <div style={{display: 'flex', alignItems: 'center', gap: 38, zIndex: 1}}>
              {/* Torre WS2805 Esquerda */}
              <div
                style={{
                  width: 38,
                  height: 225,
                  backgroundColor: '#18181B',
                  border: `4px solid ${COLORS.ink}`,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  padding: '8px 0',
                  boxShadow: `0 0 32px ${current.primary}`,
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                  // Animação específica por modo (DRS sobe, Chuva desce, Boost do meio, Overtake strobo)
                  const waveIdx =
                    current.id === 'DRS' || current.id === 'OVERTAKE'
                      ? 6 - i
                      : current.id === 'BOOST'
                      ? Math.abs(3 - i)
                      : i;
                  const ledOp = interpolate((frame * 1.5 + waveIdx * 4) % 20, [0, 10, 20], [0.35, 1, 0.35]);
                  const ledClr =
                    current.id === 'OVERTAKE' && (frame + i) % 2 === 0 ? current.secondary : current.primary;
                  return (
                    <div
                      key={i}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: ledClr,
                        opacity: ledOp,
                        boxShadow: `0 0 10px ${ledClr}`,
                      }}
                    />
                  );
                })}
              </div>

              {/* Monitor central */}
              <div
                style={{
                  width: 440,
                  height: 230,
                  backgroundColor: '#111111',
                  borderRadius: 14,
                  border: `5px solid ${COLORS.ink}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                  fontFamily: FONTS.mono,
                  gap: 14,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Barra superior colorida no monitor */}
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: 10,
                    backgroundColor: current.primary,
                  }}
                />
                <div style={{fontSize: 26, fontWeight: 900, color: current.secondary, textAlign: 'center', padding: '0 16px'}}>
                  {current.screenText}
                </div>
                <div
                  style={{
                    fontSize: 15,
                    color: '#E4E4E7',
                    backgroundColor: '#27272A',
                    padding: '6px 16px',
                    borderRadius: 6,
                    border: `2px solid ${current.primary}`,
                  }}
                >
                  SINCRONIZADO EM 30 HZ VIA ESP32 RMT
                </div>
              </div>

              {/* Torre WS2805 Direita */}
              <div
                style={{
                  width: 38,
                  height: 225,
                  backgroundColor: '#18181B',
                  border: `4px solid ${COLORS.ink}`,
                  borderRadius: 12,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-evenly',
                  alignItems: 'center',
                  padding: '8px 0',
                  boxShadow: `0 0 32px ${current.primary}`,
                }}
              >
                {[0, 1, 2, 3, 4, 5, 6].map((i) => {
                  const waveIdx =
                    current.id === 'DRS' || current.id === 'OVERTAKE'
                      ? 6 - i
                      : current.id === 'BOOST'
                      ? Math.abs(3 - i)
                      : i;
                  const ledOp = interpolate((frame * 1.5 + waveIdx * 4) % 20, [0, 10, 20], [0.35, 1, 0.35]);
                  const ledClr =
                    current.id === 'OVERTAKE' && (frame + i) % 2 === 0 ? current.secondary : current.primary;
                  return (
                    <div
                      key={i}
                      style={{
                        width: 16,
                        height: 16,
                        borderRadius: '50%',
                        backgroundColor: ledClr,
                        opacity: ledOp,
                        boxShadow: `0 0 10px ${ledClr}`,
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Mesa + Fita RGB frontal */}
            <div
              style={{
                width: 720,
                height: 38,
                backgroundColor: '#8C5A3C',
                border: `4px solid ${COLORS.ink}`,
                borderRadius: 8,
                marginTop: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-evenly',
                padding: '0 20px',
                zIndex: 1,
                boxShadow: `0 12px 34px ${current.primary}`,
              }}
            >
              {Array.from({length: 16}).map((_, i) => {
                const centerDist = Math.abs(7.5 - i);
                const barOp =
                  current.id === 'BOOST'
                    ? interpolate((frame * 1.8 - centerDist * 3 + 40) % 20, [0, 10, 20], [0.4, 1, 0.4])
                    : pulse;
                return (
                  <div
                    key={i}
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 4,
                      backgroundColor: i % 2 === 0 ? current.primary : current.secondary,
                      opacity: barOp,
                    }}
                  />
                );
              })}
            </div>
          </div>

          <div style={{fontFamily: FONTS.mono, fontSize: 16, fontWeight: 800, color: COLORS.muted}}>
            TORRES LATERAIS WS2805 + FITA FRONTAL RGB ENDEREÇÁVEL
          </div>
        </CardBox>
      </div>
    </FrameShell>
  );
};
