import React, { useEffect, useState } from 'react';
import { RadioMessageOutput } from '../brain/types';

interface TeamRadioOverlayProps {
  currentMessage: RadioMessageOutput | null;
  isVisible: boolean;
  engineerName?: string;
  driverName?: string;
}

export const TeamRadioOverlay: React.FC<TeamRadioOverlayProps> = ({
  currentMessage,
  isVisible,
  engineerName = 'CLAUDINHO RONALDO',
  driverName = 'GABRIEL'
}) => {
  const [waveformHeights, setWaveformHeights] = useState<number[]>([15, 25, 45, 30, 20, 40, 50, 28, 18, 35]);

  // Animação dinâmica das ondas de áudio (waveform) enquanto estiver transmitindo
  useEffect(() => {
    if (!isVisible) return;

    const interval = setInterval(() => {
      setWaveformHeights(prev =>
        prev.map(() => Math.floor(Math.random() * 38) + 12)
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible || !currentMessage) {
    return null;
  }

  const isUrgent = currentMessage.priority === 'CRITICAL' || currentMessage.tone === 'urgent';
  const isCelebratory = currentMessage.tone === 'celebratory';

  return (
    <div
      style={{
        position: 'fixed',
        top: '28px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        minWidth: '380px',
        maxWidth: '520px',
        background: 'linear-gradient(135deg, rgba(28, 20, 18, 0.96) 0%, rgba(16, 12, 11, 0.98) 100%)',
        border: `2px solid ${isUrgent ? '#ef4444' : isCelebratory ? '#22c55e' : '#E05A36'}`,
        borderRadius: '12px',
        boxShadow: `0 8px 32px rgba(0, 0, 0, 0.7), 0 0 24px ${isUrgent ? 'rgba(239, 68, 68, 0.4)' : 'rgba(224, 90, 54, 0.35)'}`,
        backdropFilter: 'blur(12px)',
        padding: '16px 20px',
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        color: '#FFFFFF',
        animation: 'radioSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden'
      }}
    >
      {/* Barra de destaque superior terracota */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: isUrgent
            ? 'linear-gradient(90deg, #ef4444, #f97316)'
            : 'linear-gradient(90deg, #E05A36, #FF7043, #B84A28)'
        }}
      />

      {/* Cabeçalho da transmissão com LED pulsante */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: isUrgent ? '#ef4444' : '#E05A36',
              boxShadow: `0 0 8px ${isUrgent ? '#ef4444' : '#E05A36'}`,
              animation: 'pulseDot 1s infinite alternate'
            }}
          />
          <span
            style={{
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              color: isUrgent ? '#f87171' : '#FF8A65'
            }}
          >
            ● TEAM RADIO
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(224, 90, 54, 0.2)',
              color: '#FFAB91',
              border: '1px solid rgba(224, 90, 54, 0.4)',
              letterSpacing: '0.8px'
            }}
          >
            {engineerName.toUpperCase()}
          </span>
          <span style={{ fontSize: '10px', color: '#888' }}>➔</span>
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
              color: '#EEEEEE',
              letterSpacing: '0.8px'
            }}
          >
            {driverName.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Mensagem da fala de rádio */}
      <div
        style={{
          fontSize: '15px',
          fontWeight: 600,
          lineHeight: '1.4',
          color: '#F9FAFB',
          margin: '8px 0 14px 0',
          letterSpacing: '0.2px'
        }}
      >
        "{currentMessage.message}"
      </div>

      {/* Rodapé com Waveform Animado e Categoria */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '10px' }}>
        {/* Waveform simulando sinal de transmissão */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '3px', height: '22px' }}>
          {waveformHeights.map((h, idx) => (
            <span
              key={idx}
              style={{
                width: '3px',
                height: `${h}px`,
                backgroundColor: isUrgent ? '#ef4444' : '#E05A36',
                borderRadius: '2px',
                transition: 'height 0.12s ease-in-out'
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '10px', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>
            {currentMessage.category}
          </span>
          <span
            style={{
              fontSize: '9px',
              fontWeight: 800,
              padding: '2px 6px',
              borderRadius: '3px',
              backgroundColor: isUrgent ? '#dc2626' : '#C85A32',
              color: '#FFFFFF'
            }}
          >
            {currentMessage.priority}
          </span>
        </div>
      </div>

      <style>{`
        @keyframes radioSlideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -24px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        @keyframes pulseDot {
          from { opacity: 0.4; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1.15); }
        }
      `}</style>
    </div>
  );
};
