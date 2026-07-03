import React, { useMemo } from 'react';
import Svg, { G, Path, Text as SvgText } from 'react-native-svg';
import { CellState, cellKey, HABIT_SLOTS } from '../types';
import { colors } from '../theme';

interface Props {
  size: number;
  daysInMonth: number;
  /** All 8 habit slot names; empty string = unused slot (drawn faint, not tappable) */
  habits: string[];
  grid: Record<string, CellState>;
  today: number | null;
  onToggle: (day: number, habitSlot: number) => void;
}

/** Angle in degrees, 0 = 12 o'clock, increasing clockwise */
function pt(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

function annularSectorPath(
  cx: number,
  cy: number,
  r1: number,
  r2: number,
  a1: number,
  a2: number
): string {
  const p1 = pt(cx, cy, r2, a1);
  const p2 = pt(cx, cy, r2, a2);
  const p3 = pt(cx, cy, r1, a2);
  const p4 = pt(cx, cy, r1, a1);
  const large = a2 - a1 > 180 ? 1 : 0;
  return [
    `M ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`,
    `A ${r2} ${r2} 0 ${large} 1 ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`,
    `L ${p3.x.toFixed(2)} ${p3.y.toFixed(2)}`,
    `A ${r1} ${r1} 0 ${large} 0 ${p4.x.toFixed(2)} ${p4.y.toFixed(2)}`,
    'Z',
  ].join(' ');
}

const CELL_FILL: Record<CellState, string> = {
  0: colors.paper,
  1: colors.green,
  2: colors.red,
};

export default function RadialTracker({
  size,
  daysInMonth,
  habits,
  grid,
  today,
  onToggle,
}: Props) {
  const cx = size / 2;
  const cy = size / 2;
  const labelBand = 22;
  const outerR = size / 2 - labelBand;
  const innerR = size * 0.13;
  const sector = 360 / daysInMonth;
  const gap = Math.min(1.2, sector * 0.08);
  const ringWidth = (outerR - innerR) / HABIT_SLOTS;

  const cells = useMemo(() => {
    const out: {
      d: string;
      fill: string;
      stroke: string;
      active: boolean;
      day: number;
      slot: number;
    }[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const a1 = (day - 1) * sector + gap / 2;
      const a2 = day * sector - gap / 2;
      for (let slot = 0; slot < HABIT_SLOTS; slot++) {
        const active = habits[slot]?.trim() !== '';
        const r1 = innerR + slot * ringWidth;
        const r2 = r1 + ringWidth;
        const state = active ? grid[cellKey(day, slot)] ?? 0 : 0;
        out.push({
          d: annularSectorPath(cx, cy, r1, r2 - 1, a1, a2),
          fill: CELL_FILL[state],
          stroke: active ? colors.line : colors.lineFaint,
          active,
          day,
          slot,
        });
      }
    }
    return out;
  }, [daysInMonth, habits, grid, cx, cy, innerR, ringWidth, sector, gap]);

  return (
    <Svg width={size} height={size}>
      <G>
        {cells.map((c) => (
          <Path
            key={`${c.day}:${c.slot}`}
            d={c.d}
            fill={c.fill}
            stroke={c.stroke}
            strokeWidth={0.7}
            onPress={c.active ? () => onToggle(c.day, c.slot) : undefined}
          />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const mid = (day - 0.5) * sector;
          const p = pt(cx, cy, outerR + labelBand / 2 + 1, mid);
          const isToday = day === today;
          return (
            <SvgText
              key={day}
              x={p.x}
              y={p.y + 3.5}
              fontSize={isToday ? 12 : 10}
              fontWeight={isToday ? '800' : '600'}
              fill={isToday ? colors.green : colors.ink}
              textAnchor="middle"
            >
              {day}
            </SvgText>
          );
        })}
      </G>
    </Svg>
  );
}
