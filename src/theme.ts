import { createContext, useContext } from 'react';
import type { ViewStyle } from 'react-native';

export type ThemeMode = 'dark' | 'light';

/**
 * The four brand colours the whole app is built from. Every other value in the
 * palettes below is a lighter or darker shade of one of these four hues — no
 * new hue is ever introduced. Shades exist because the four on their own can't
 * carry readable text: olive on cream is 1.96:1 and purple on cream 2.72:1,
 * where body copy needs 4.5:1.
 */
export const BRAND = {
  cream: '#FDFBD4',
  olive: '#BDB96A',
  lavender: '#C1BFFF',
  purple: '#CF6DFC',
} as const;

/**
 * Josefin Sans ships weights 100–700 only, and iOS ignores `fontWeight` once a
 * custom `fontFamily` is set — so every weight in the UI maps onto a real font
 * file here instead of relying on synthetic bolding. The heaviest UI weights
 * (the old 800/900) land on Bold, which is as heavy as this family goes.
 */
export const FONT = {
  regular: 'JosefinSans_400Regular',
  medium: 'JosefinSans_500Medium',
  semibold: 'JosefinSans_600SemiBold',
  bold: 'JosefinSans_700Bold',
  italic: 'JosefinSans_400Regular_Italic',
} as const;

export interface Palette {
  /** flat colour behind the drifting background blobs */
  bg: string;
  /** the blobs are drawn in brand colours; `blobStrength` scales them back */
  blobs: string[];
  /** multiplier on each blob's opacity, so full-strength brand colour stays a wash */
  blobStrength: number;
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
  /** foreground for anything sitting on a filled accent/done/missed surface */
  onFill: string;
  /**
   * Habit checked off / missed. These are the one deliberate exception to the
   * four brand hues: green and red carry meaning no brand colour can. Both are
   * pulled toward the palette — the green keeps the olive's yellow cast, the
   * red keeps the purple's magenta cast — so they sit beside it rather than
   * fighting it.
   */
  done: string;
  doneSoft: string;
  missed: string;
  missedSoft: string;
  cellEmpty: string;
  /** GitHub-style intensity ramp, index 0 = empty */
  ghLevels: string[];
  ghMissed: string;
  /** card drop-shadow — tinted, so even shadows stay inside the brand hues */
  shadow: string;
  /** shadow strength; heavier on dark, barely there on light */
  shadowOpacity: number;
}

export const darkPalette: Palette = {
  bg: '#17121d',
  blobs: [BRAND.purple, BRAND.lavender, BRAND.purple, BRAND.olive, BRAND.purple],
  blobStrength: 0.26,
  card: 'rgba(38,29,48,0.76)',
  chip: 'rgba(60,48,74,0.85)',
  ink: BRAND.cream,
  inkSoft: BRAND.lavender,
  line: '#5b4a6e',
  lineFaint: '#2c2338',
  accent: BRAND.purple,
  accentSoft: 'rgba(207,109,252,0.18)',
  onFill: '#1b1520',
  done: '#93c63f',
  doneSoft: 'rgba(147,198,63,0.20)',
  missed: '#ef4c63',
  missedSoft: 'rgba(239,76,99,0.18)',
  cellEmpty: '#221a2c',
  ghLevels: ['#221a2c', '#2d4b1f', '#497b2d', '#6da939', '#93c63f'],
  ghMissed: '#7d2f3c',
  shadow: '#0d0912',
  shadowOpacity: 0.55,
};

export const lightPalette: Palette = {
  bg: BRAND.cream,
  blobs: [BRAND.lavender, BRAND.lavender, BRAND.purple, BRAND.olive, BRAND.purple],
  blobStrength: 0.34,
  card: 'rgba(255,254,243,0.84)',
  chip: '#f1edc7',
  ink: '#2f2d16',
  inkSoft: '#6f6b3c',
  line: '#b3ae6e',
  lineFaint: '#e2ddab',
  accent: BRAND.purple,
  accentSoft: 'rgba(207,109,252,0.16)',
  onFill: '#2f2d16',
  done: '#7fb32e',
  doneSoft: 'rgba(147,198,63,0.24)',
  missed: '#e5405a',
  missedSoft: 'rgba(239,76,99,0.18)',
  cellEmpty: '#efebc2',
  ghLevels: ['#efebc2', '#d9ecb2', '#b7dc7a', '#9ccd4d', '#7fb32e'],
  ghMissed: '#eb8a99',
  shadow: '#6f6b3c',
  shadowOpacity: 0.18,
};

/**
 * Corner radii. Rectangular surfaces get only a slight curve; `pill` is kept
 * for elements that are genuinely circular (icon buttons, dots), not capsules.
 */
export const RADIUS = {
  card: 18,
  control: 10,
  chip: 8,
  pill: 999,
} as const;

/** Shared surface every card on the planner screen sits on */
export function cardSurface(p: Palette): ViewStyle {
  return {
    backgroundColor: p.card,
    borderRadius: RADIUS.card,
    borderWidth: 1,
    borderColor: p.lineFaint,
    shadowColor: p.shadow,
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
