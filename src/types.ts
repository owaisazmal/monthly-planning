/** 0 = empty, 1 = done (green), 2 = missed (red) */
export type CellState = 0 | 1 | 2;

export interface Habit {
  /** Stable id — grid keys reference this, so renames/reorders/removals never shift data */
  id: string;
  name: string;
}

export interface KeyGoal {
  text: string;
  done: boolean;
}

export interface MonthData {
  habits: Habit[];
  /** key: `${day}:${habitId}` */
  grid: Record<string, CellState>;
  observations: string[];
  keyGoals: KeyGoal[];
}

export const MAX_HABITS = 10;

export function emptyMonthData(): MonthData {
  return {
    habits: [],
    grid: {},
    observations: ['', '', '', ''],
    keyGoals: [
      { text: '', done: false },
      { text: '', done: false },
      { text: '', done: false },
    ],
  };
}

export function cellKey(day: number, habitId: string): string {
  return `${day}:${habitId}`;
}

export function nextHabitId(habits: Habit[]): string {
  const max = habits.reduce((m, h) => {
    const n = parseInt(h.id, 10);
    return Number.isFinite(n) ? Math.max(m, n) : m;
  }, -1);
  return String(max + 1);
}

/** Per-day tally across all habits */
export function dayTally(
  grid: Record<string, CellState>,
  habits: Habit[],
  day: number
): { done: number; missed: number } {
  let done = 0;
  let missed = 0;
  for (const h of habits) {
    const s = grid[cellKey(day, h.id)] ?? 0;
    if (s === 1) done++;
    else if (s === 2) missed++;
  }
  return { done, missed };
}
