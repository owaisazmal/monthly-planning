import AsyncStorage from '@react-native-async-storage/async-storage';
import { Habit, MonthData, emptyMonthData } from './types';
import { ThemeMode } from './theme';

export type ChartType = 'radial' | 'github';

export interface Settings {
  theme: ThemeMode;
  chart: ChartType;
}

const SETTINGS_KEY = '@monthly-planning/settings';

function monthKey(year: number, month: number): string {
  // month is 0-based
  return `@monthly-planning/${year}-${String(month + 1).padStart(2, '0')}`;
}

/**
 * v1 stored habits as a fixed 8-slot string array and grid keys as `${day}:${slotIndex}`.
 * Converting each non-empty slot to { id: String(slotIndex), name } keeps every
 * existing grid key valid, so no grid rewrite is needed.
 */
function migrateHabits(raw: unknown): Habit[] {
  if (!Array.isArray(raw)) return [];
  if (raw.every((h) => typeof h === 'string')) {
    return (raw as string[])
      .map((name, i) => ({ id: String(i), name }))
      .filter((h) => h.name.trim() !== '');
  }
  return (raw as Habit[]).filter(
    (h) => h && typeof h.id === 'string' && typeof h.name === 'string'
  );
}

export async function loadMonth(year: number, month: number): Promise<MonthData> {
  try {
    const raw = await AsyncStorage.getItem(monthKey(year, month));
    if (!raw) return emptyMonthData();
    const parsed = JSON.parse(raw) as Partial<MonthData>;
    const base = emptyMonthData();
    return {
      habits: migrateHabits(parsed.habits),
      grid: parsed.grid ?? base.grid,
      observations: parsed.observations?.length ? parsed.observations : base.observations,
      keyGoals: parsed.keyGoals?.length === 3 ? parsed.keyGoals : base.keyGoals,
    };
  } catch {
    return emptyMonthData();
  }
}

export async function saveMonth(year: number, month: number, data: MonthData): Promise<void> {
  try {
    await AsyncStorage.setItem(monthKey(year, month), JSON.stringify(data));
  } catch {
    // best-effort persistence; nothing actionable on failure
  }
}

/** Per-day done/missed counts for one month, used by the yearly grid */
export interface YearMonthSummary {
  habitCount: number;
  tallies: Record<number, { done: number; missed: number }>;
}

const EMPTY_MONTH_SUMMARY: YearMonthSummary = { habitCount: 0, tallies: {} };

/** Loads lightweight tallies for all 12 months of a year in one multiGet. */
export async function loadYearSummary(year: number): Promise<YearMonthSummary[]> {
  try {
    const keys = Array.from({ length: 12 }, (_, m) => monthKey(year, m));
    const pairs = await AsyncStorage.multiGet(keys);
    return pairs.map(([, raw]) => {
      if (!raw) return EMPTY_MONTH_SUMMARY;
      try {
        const parsed = JSON.parse(raw) as Partial<MonthData>;
        const habits = migrateHabits(parsed.habits);
        const ids = new Set(habits.map((h) => h.id));
        const tallies: YearMonthSummary['tallies'] = {};
        for (const [key, state] of Object.entries(parsed.grid ?? {})) {
          const day = parseInt(key, 10);
          const id = key.slice(key.indexOf(':') + 1);
          if (!Number.isFinite(day) || !ids.has(id)) continue;
          const t = (tallies[day] ??= { done: 0, missed: 0 });
          if (state === 1) t.done++;
          else if (state === 2) t.missed++;
        }
        return { habitCount: habits.length, tallies };
      } catch {
        return EMPTY_MONTH_SUMMARY;
      }
    });
  } catch {
    return Array.from({ length: 12 }, () => EMPTY_MONTH_SUMMARY);
  }
}

export async function loadSettings(): Promise<Settings> {
  const fallback: Settings = { theme: 'dark', chart: 'radial' };
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<Settings>;
    return {
      theme: parsed.theme === 'light' ? 'light' : 'dark',
      chart: parsed.chart === 'github' ? 'github' : 'radial',
    };
  } catch {
    return fallback;
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // best-effort persistence
  }
}
