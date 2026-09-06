import React, { useEffect, useRef, useState } from 'react';
import { VisualTyreCompound, Formatters } from '@f1-dash/telemetry-core';

// ─── Asset base path (served from public/) ────────────────────────────────────
const ASSET_BASE = '/assets/car-parts';

// ─── Reference canvas dimensions (all positions are relative to this) ─────────
const REF_W = 327;
const REF_H = 605;

// ─── Helper: convert px coords to % for responsive scaling ───────────────────
const pct = (px: number, ref: number) => `${(px / ref) * 100}%`;

// ─── Types ────────────────────────────────────────────────────────────────────
interface CarDamageMapProps {
  // Car damage (0-100%)
  frontLeftWingDamage: number;
  frontRightWingDamage: number;
  rearWingDamage: number;
  floorDamage: number;
  diffuserDamage: number;
  sidepodDamage: number;
  gearBoxDamage: number;
  engineDamage: number;
  // Tyres
  tyresWear: [number, number, number, number];       // [RL, RR, FL, FR]
  tyresDamage: [number, number, number, number];
  tyresSurfaceTemp: [number, number, number, number];
  tyresPressure: [number, number, number, number];
  brakesTemperature: [number, number, number, number];
  // Compound
  compound: VisualTyreCompound;
  tyresAgeLaps: number;
  // Faults
  drsFault?: boolean;
  engineBlown?: boolean;
}

// ─── Damage stage resolvers ───────────────────────────────────────────────────

/** Front wings: responsive stages that immediately change color upon collision */
function getFrontWingStage(damage: number): number {
  const d = Math.max(0, Number(damage) || 0);
  if (d < 1) return 1;  // Stage 1: Green (0%)
  if (d < 10) return 2; // Stage 2: Lime-green (1-9%)
  if (d < 30) return 3; // Stage 3: Yellow (10-29%)
  if (d < 60) return 4; // Stage 4: Orange (30-59%)
  return 5;             // Stage 5: Red (>= 60%)
}

/** Floor, Sidepods, Rear Wing, Diffuser: 5 stages */
function getBodyStage(damage: number, drsFault?: boolean): number {
  const d = Math.max(0, Number(damage) || 0);
  if (d >= 60 || drsFault) return 5;
  if (d >= 30) return 4;
  if (d >= 10) return 3;
  if (d >= 1) return 2;
  return 1;
}

/** Engine: 3 stages */
function getEngineStage(damage: number, engineBlown?: boolean): number {
  const d = Math.max(0, Number(damage) || 0);
  if (d >= 50 || engineBlown) return 3;
  if (d >= 20) return 2;
  return 1;
}

/** Gearbox: 3 stages */
function getGearboxStage(damage: number): number {
  const d = Math.max(0, Number(damage) || 0);
  if (d >= 50) return 3;
  if (d >= 20) return 2;
  return 1;
}

// ─── Thermal color resolvers ──────────────────────────────────────────────────

function getTyreWearColor(wear: number): string {
  if (wear > 80) return '#e74c3c';   // Red — critical
  if (wear > 60) return '#e67e22';   // Orange — high
  if (wear > 30) return '#f1c40f';   // Yellow — medium
  return '#2ecc71';                   // Green — good
}

function getBrakeTempColor(temp: number): string {
  if (temp > 1000) return '#e74c3c'; // Red — overheating
  if (temp > 750) return '#f39c12';  // Orange — hot
  if (temp >= 300) return '#2ecc71'; // Green — optimal
  return '#3498db';                   // Blue — cold
}

// ─── Blink animation CSS (injected once) ──────────────────────────────────────
const BLINK_STYLE_ID = 'car-damage-blink-style';

function ensureBlinkStyle(): void {
  if (typeof document === 'undefined') return;
  if (document.getElementById(BLINK_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = BLINK_STYLE_ID;
  style.textContent = `
    @keyframes car-damage-blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.2; }
    }
    .car-damage-blink {
      animation: car-damage-blink 0.3s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
}

// ─── Hook: track blink state per component ────────────────────────────────────
function useBlinkTracker(damages: Record<string, number>): Set<string> {
  const prevRef = useRef<Record<string, number>>({});
  const [blinking, setBlinking] = useState<Set<string>>(new Set());
  const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    ensureBlinkStyle();
  }, []);

  useEffect(() => {
    const prev = prevRef.current;
    const newBlinks = new Set(blinking);
    let changed = false;

    for (const [key, val] of Object.entries(damages)) {
      if (prev[key] !== undefined && val > prev[key]) {
        newBlinks.add(key);
        changed = true;
        // Clear existing timer for this key
        if (timersRef.current[key]) clearTimeout(timersRef.current[key]);
        timersRef.current[key] = setTimeout(() => {
          setBlinking((s) => {
            const next = new Set(s);
            next.delete(key);
            return next;
          });
        }, 2000);
      }
    }

    prevRef.current = { ...damages };
    if (changed) setBlinking(newBlinks);

    return () => {
      for (const t of Object.values(timersRef.current)) clearTimeout(t);
    };
  }, [damages]);

  return blinking;
}

// ─── Layer component layout config ────────────────────────────────────────────
interface LayerConfig {
  id: string;
  prefix: string;
  x: number;
  y: number;
  w: number;
  h: number;
  zIndex: number;
}

const LAYERS: LayerConfig[] = [
  { id: 'floor',     prefix: 'Fondo',     x: 71,  y: 244, w: 183, h: 282, zIndex: 1 },
  { id: 'gearbox',   prefix: 'Cambio',    x: 150, y: 452, w: 25,  h: 74,  zIndex: 2 },
  { id: 'engine',    prefix: 'Engine',    x: 124, y: 356, w: 77,  h: 93,  zIndex: 3 },
  { id: 'sidepodL',  prefix: 'SidepodL',  x: 83,  y: 329, w: 63,  h: 197, zIndex: 4 },
  { id: 'sidepodR',  prefix: 'SidepodR',  x: 180, y: 329, w: 62,  h: 196, zIndex: 5 },
  { id: 'diffuser',  prefix: 'Diffusore', x: 121, y: 529, w: 81,  h: 28,  zIndex: 6 },
  { id: 'rearWing',  prefix: 'Dietro',    x: 94,  y: 567, w: 136, h: 56,  zIndex: 7 },
  { id: 'flWing',    prefix: 'Sinistra',  x: 48,  y: 17,  w: 109, h: 95,  zIndex: 8 },
  { id: 'frWing',    prefix: 'Destra',    x: 165, y: 16,  w: 109, h: 96,  zIndex: 9 },
];

// Tyre positions: [RL, RR, FL, FR] → we display FL, FR, RL, RR
interface TyreConfig {
  label: string;
  dataIdx: number;   // Index in the [RL, RR, FL, FR] array
  x: number;
  y: number;
  w: number;
  h: number;
}

const TYRES: TyreConfig[] = [
  { label: 'FL', dataIdx: 2, x: 39,  y: 124, w: 56, h: 85 },
  { label: 'FR', dataIdx: 3, x: 230, y: 124, w: 56, h: 85 },
  { label: 'RL', dataIdx: 0, x: 35,  y: 506, w: 60, h: 86 },
  { label: 'RR', dataIdx: 1, x: 229, y: 506, w: 60, h: 86 },
];

interface BrakeConfig {
  dataIdx: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

const BRAKES: BrakeConfig[] = [
  { dataIdx: 2, x: 97,  y: 145, w: 14, h: 40 },
  { dataIdx: 3, x: 214, y: 145, w: 14, h: 40 },
  { dataIdx: 0, x: 98,  y: 532, w: 14, h: 31 },
  { dataIdx: 1, x: 211, y: 532, w: 14, h: 31 },
];

// ─── Main Component ───────────────────────────────────────────────────────────

export const CarDamageMap: React.FC<CarDamageMapProps> = ({
  frontLeftWingDamage,
  frontRightWingDamage,
  rearWingDamage,
  floorDamage,
  diffuserDamage,
  sidepodDamage,
  gearBoxDamage,
  engineDamage,
  tyresWear,
  tyresDamage,
  tyresSurfaceTemp,
  tyresPressure,
  brakesTemperature,
  compound,
  tyresAgeLaps,
  drsFault = false,
  engineBlown = false,
}) => {
  // Resolve stage per component
  const stages: Record<string, number> = {
    floor:     getBodyStage(floorDamage),
    gearbox:   getGearboxStage(gearBoxDamage),
    engine:    getEngineStage(engineDamage, engineBlown),
    sidepodL:  getBodyStage(sidepodDamage),
    sidepodR:  getBodyStage(sidepodDamage),
    diffuser:  getBodyStage(diffuserDamage),
    rearWing:  getBodyStage(rearWingDamage, drsFault),
    flWing:    getFrontWingStage(frontLeftWingDamage),
    frWing:    getFrontWingStage(frontRightWingDamage),
  };

  // Damage values for blink tracking
  const damageValues: Record<string, number> = {
    floor: floorDamage,
    gearbox: gearBoxDamage,
    engine: engineDamage,
    sidepodL: sidepodDamage,
    sidepodR: sidepodDamage,
    diffuser: diffuserDamage,
    rearWing: rearWingDamage,
    flWing: frontLeftWingDamage,
    frWing: frontRightWingDamage,
    tyreFL: tyresWear[2],
    tyreFR: tyresWear[3],
    tyreRL: tyresWear[0],
    tyreRR: tyresWear[1],
  };

  const blinking = useBlinkTracker(damageValues);
  const compoundInfo = Formatters.getTyreCompoundInfo(compound);

  // Check if any damage is present
  const hasDamage = Object.values({
    frontLeftWingDamage, frontRightWingDamage, rearWingDamage,
    floorDamage, diffuserDamage, sidepodDamage, gearBoxDamage, engineDamage
  }).some(v => v >= 1);

  return (
    <div style={containerStyle}>
      {/* Title bar */}
      <div style={headerStyle}>
        <span style={headerTitleStyle}>🏎️ CAR STATUS</span>
        {hasDamage && <span style={damageBadgeStyle}>⚠️ DAMAGE</span>}
      </div>

      {/* Compound badge */}
      <div style={compoundRowStyle}>
        <span
          style={{
            ...compoundBadgeStyle,
            backgroundColor: compoundInfo.color,
            color: compoundInfo.textColor,
          }}
        >
          {compoundInfo.short}
        </span>
        <span style={compoundNameStyle}>
          {compoundInfo.name} ({tyresAgeLaps}V)
        </span>
      </div>

      {/* Car canvas */}
      <div style={canvasStyle}>
        {/* Z-0: Car chassis base */}
        <img
          src={`${ASSET_BASE}/car2.png`}
          alt="Car chassis"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            zIndex: 0,
            pointerEvents: 'none',
          }}
          draggable={false}
        />

        {/* Z-1..9: Damage layers */}
        {LAYERS.map((layer) => {
          const stage = stages[layer.id] ?? 1;
          const isBlink = blinking.has(layer.id);
          return (
            <img
              key={layer.id}
              src={`${ASSET_BASE}/${layer.prefix}${stage}.png`}
              alt={`${layer.id} stage ${stage}`}
              className={isBlink ? 'car-damage-blink' : undefined}
              style={{
                position: 'absolute',
                left: pct(layer.x, REF_W),
                top: pct(layer.y, REF_H),
                width: pct(layer.w, REF_W),
                height: pct(layer.h, REF_H),
                zIndex: layer.zIndex,
                pointerEvents: 'none',
                transition: 'opacity 0.3s ease',
              }}
              draggable={false}
            />
          );
        })}

        {/* Z-10: Tyres (colored boxes) */}
        {TYRES.map((tyre) => {
          const wear = tyresWear[tyre.dataIdx] || 0;
          const temp = tyresSurfaceTemp[tyre.dataIdx] || 0;
          const press = tyresPressure[tyre.dataIdx] || 0;
          const color = getTyreWearColor(wear);
          const isPunctured = wear >= 100;
          const blinkKey = `tyre${tyre.label}`;
          const isBlink = blinking.has(blinkKey);

          return (
            <div
              key={tyre.label}
              className={isBlink ? 'car-damage-blink' : undefined}
              style={{
                position: 'absolute',
                left: pct(tyre.x, REF_W),
                top: pct(tyre.y, REF_H),
                width: pct(tyre.w, REF_W),
                height: pct(tyre.h, REF_H),
                borderRadius: '6px',
                zIndex: 10,
                backgroundColor: color,
                opacity: isPunctured ? 0.3 : 0.8,
                transition: 'background-color 0.3s ease, opacity 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1px',
              }}
            >
              <span style={tyreLabelStyle}>{tyre.label}</span>
              <span style={tyreWearStyle}>{wear.toFixed(0)}%</span>
              <span style={tyreTempStyle}>{temp}°C</span>
              <span style={tyrePressStyle}>{press.toFixed(1)}</span>
            </div>
          );
        })}

        {/* Z-11: Brake discs (thermal bars) */}
        {BRAKES.map((brake, i) => {
          const temp = brakesTemperature[brake.dataIdx] || 0;
          const color = getBrakeTempColor(temp);
          return (
            <div
              key={`brake-${i}`}
              style={{
                position: 'absolute',
                left: pct(brake.x, REF_W),
                top: pct(brake.y, REF_H),
                width: pct(brake.w, REF_W),
                height: pct(brake.h, REF_H),
                borderRadius: '2px',
                zIndex: 11,
                backgroundColor: color,
                opacity: 0.9,
                transition: 'background-color 0.3s ease',
              }}
            />
          );
        })}
      </div>

      {/* Component damage legend (only show when damage is present) */}
      {hasDamage && (
        <div style={legendStyle}>
          {frontLeftWingDamage >= 1 && (
            <DamagePill label="ASA E" value={frontLeftWingDamage} />
          )}
          {frontRightWingDamage >= 1 && (
            <DamagePill label="ASA D" value={frontRightWingDamage} />
          )}
          {rearWingDamage >= 1 && (
            <DamagePill label="TRASEIRA" value={rearWingDamage} />
          )}
          {floorDamage >= 1 && (
            <DamagePill label="ASSOALHO" value={floorDamage} />
          )}
          {sidepodDamage >= 1 && (
            <DamagePill label="SIDEPOD" value={sidepodDamage} />
          )}
          {engineDamage >= 1 && (
            <DamagePill label="MOTOR" value={engineDamage} />
          )}
          {gearBoxDamage >= 1 && (
            <DamagePill label="CÂMBIO" value={gearBoxDamage} />
          )}
          {diffuserDamage >= 1 && (
            <DamagePill label="DIFUSOR" value={diffuserDamage} />
          )}
        </div>
      )}
    </div>
  );
};

// ─── Sub-components ───────────────────────────────────────────────────────────

const DamagePill: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  let pillColor = '#22c55e';
  if (value >= 80) pillColor = '#ef4444';
  else if (value >= 50) pillColor = '#f59e0b';
  else if (value >= 25) pillColor = '#eab308';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 6px',
        borderRadius: '4px',
        backgroundColor: 'rgba(255,255,255,0.06)',
        fontSize: '10px',
        fontWeight: 700,
        color: pillColor,
        whiteSpace: 'nowrap',
      }}
    >
      {label}: {value.toFixed(0)}%
    </span>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  backgroundColor: '#09090b',
  borderRadius: '12px',
  border: '1px solid #27272a',
  padding: '10px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '6px',
  maxWidth: '320px',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
};

const headerTitleStyle: React.CSSProperties = {
  color: '#38bdf8',
  fontSize: '12px',
  fontWeight: 800,
  letterSpacing: '0.5px',
};

const damageBadgeStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: '4px',
  backgroundColor: 'rgba(239, 68, 68, 0.2)',
  border: '1px solid #ef4444',
  color: '#f87171',
  fontSize: '10px',
  fontWeight: 800,
};

const compoundRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const compoundBadgeStyle: React.CSSProperties = {
  width: '20px',
  height: '20px',
  borderRadius: '50%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: '11px',
  fontWeight: 900,
};

const compoundNameStyle: React.CSSProperties = {
  color: '#e4e4e7',
  fontSize: '12px',
  fontWeight: 700,
};

const canvasStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  maxWidth: '280px',
  aspectRatio: `${REF_W} / ${REF_H}`,
  overflow: 'hidden',
};

const tyreLabelStyle: React.CSSProperties = {
  color: '#000',
  fontSize: '9px',
  fontWeight: 800,
  lineHeight: 1,
};

const tyreWearStyle: React.CSSProperties = {
  color: '#000',
  fontSize: '12px',
  fontWeight: 900,
  lineHeight: 1,
};

const tyreTempStyle: React.CSSProperties = {
  color: 'rgba(0,0,0,0.7)',
  fontSize: '8px',
  fontWeight: 700,
  lineHeight: 1,
};

const tyrePressStyle: React.CSSProperties = {
  color: 'rgba(0,0,0,0.5)',
  fontSize: '7px',
  fontWeight: 600,
  lineHeight: 1,
};

const legendStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '4px',
  justifyContent: 'center',
  maxWidth: '100%',
};
