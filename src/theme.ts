import { createContext, useContext } from 'react';

export type ThemeMode = 'dark' | 'light';

export interface Palette {
  bg: string;
  card: string;
  /** slightly raised surface inside a card (chips, number badges, inputs) */
  chip: string;
  ink: string;
  inkSoft: string;
  line: string;
  lineFaint: string;
  green: string;
  greenSoft: string;
  red: string;
  redSoft: string;
  headerBg: string;
  headerText: string;
  cellEmpty: string;
  /** GitHub-style intensity ramp, index 0 = empty */
  ghLevels: string[];
  ghMissed: string;
}

export const darkPalette: Palette = {
  bg: '#0a0d10',
  card: '#12171d',
  chip: '#1b232b',
  ink: '#f2f5f7',
  inkSoft: '#8b96a1',
  line: '#3d4854',
  lineFaint: '#212932',
  green: '#2ebd7f',
  greenSoft: '#123326',
  red: '#e5484d',
  redSoft: '#3a1d1f',
  headerBg: '#eef1f4',
  headerText: '#0e1114',
  cellEmpty: '#161c22',
  ghLevels: ['#1b232b', '#0e4429', '#006d32', '#26a641', '#39d353'],
  ghMissed: '#7c2a2e',
};

export const lightPalette: Palette = {
  bg: '#f4f6f8',
  card: '#ffffff',
  chip: '#eef1f4',
  ink: '#181c20',
  inkSoft: '#667079',
  line: '#c6cdd3',
  lineFaint: '#e6eaee',
  green: '#149e6e',
  greenSoft: '#e0f4ec',
  red: '#dd3d43',
  redSoft: '#fbe4e5',
  headerBg: '#181c20',
  headerText: '#ffffff',
  cellEmpty: '#eef1f4',
  ghLevels: ['#e6eaee', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  ghMissed: '#f3b1b4',
};

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
