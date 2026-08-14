import { createContext, useContext } from 'react';
import type { ViewStyle } from 'react-native';

export type ThemeMode = 'dark' | 'light';

export interface Palette {
  /** flat colour behind the drifting background blobs */
  bg: string;
  /** soft colours the animated background blobs are drawn in (last one is the accent glow) */
  blobs: string[];
  /** translucent so the moving background reads through every card */
  card: string;
  /** slightly raised surface inside a card (chips, number badges, inputs) */
  chip: string;
  ink: string;
  inkSoft: string;
  line: string;
  lineFaint: string;
  /** brand colour — accent bars, active states, today markers, calls to action */
  accent: string;
  accentSoft: string;
  /** text/icons sitting on top of a filled accent surface */
  onAccent: string;
  green: string;
  greenSoft: string;
  red: string;
  redSoft: string;
  cellEmpty: string;
  /** GitHub-style intensity ramp, index 0 = empty */
  ghLevels: string[];
  ghMissed: string;
  /** card drop-shadow strength; heavier on dark, barely there on light */
  shadowOpacity: number;
}

export const darkPalette: Palette = {
  bg: '#08090c',
  blobs: ['#1d222b', '#161a21', '#242b36', '#12161d', '#ff2d55'],
  card: 'rgba(19,22,28,0.76)',
  chip: 'rgba(42,48,59,0.85)',
  ink: '#f3f5f8',
  inkSoft: '#8d95a2',
  line: '#3c4450',
  lineFaint: '#20252e',
  accent: '#ff2d55',
  accentSoft: 'rgba(255,45,85,0.15)',
  onAccent: '#ffffff',
  green: '#2bd97c',
  greenSoft: 'rgba(43,217,124,0.15)',
  red: '#ff4d4f',
  redSoft: 'rgba(255,77,79,0.15)',
  cellEmpty: '#171b22',
  ghLevels: ['#171b22', '#123d2a', '#126b43', '#1aa663', '#2bd97c'],
  ghMissed: '#7c2a2e',
  shadowOpacity: 0.5,
};

export const lightPalette: Palette = {
  bg: '#faf6f0',
  blobs: ['#ffe4d1', '#fff1e4', '#ffdac4', '#f6eee2', '#ff2d55'],
  card: 'rgba(255,255,255,0.88)',
  chip: '#f1ebe2',
  ink: '#16181d',
  inkSoft: '#6d7480',
  line: '#c0c7cf',
  lineFaint: '#e9e2d8',
  accent: '#f0264c',
  accentSoft: 'rgba(240,38,76,0.12)',
  onAccent: '#ffffff',
  green: '#12a05f',
  greenSoft: 'rgba(18,160,95,0.14)',
  red: '#dd3d43',
  redSoft: 'rgba(221,61,67,0.13)',
  cellEmpty: '#e7e0d5',
  ghLevels: ['#e7e0d5', '#a9e5c1', '#5cc98d', '#2ba565', '#177544'],
  ghMissed: '#f3b1b4',
  shadowOpacity: 0.1,
};

/** Corner radii — generous and soft, the way the reference screens round everything */
export const RADIUS = {
  card: 22,
  chip: 14,
  pill: 999,
} as const;

/** Shared surface every card on the planner screen sits on */
export function cardSurface(p: Palette): ViewStyle {
  return {
    backgroundColor: p.card,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: p.lineFaint,
    shadowColor: '#000000',
    shadowOpacity: p.shadowOpacity,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 6,
  };
}

export interface Theme {
  mode: ThemeMode;
  palette: Palette;
  toggle: () => void;
}

export const ThemeContext = createContext<Theme>({
  mode: 'dark',
  palette: darkPalette,
  toggle: () => {},
});

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
