/** 0 = empty, 1 = done (green), 2 = missed (red) */
export type CellState = 0 | 1 | 2;

export interface KeyGoal {
  text: string;
  done: boolean;
}

export interface MonthData {
  /** Fixed 8 habit slots; empty string = unused slot */
  habits: string[];
  /** key: `${day}:${habitSlotIndex}` */
  grid: Record<string, CellState>;
  observations: string[];
  keyGoals: KeyGoal[];
}

export const HABIT_SLOTS = 8;

export function emptyMonthData(): MonthData {
  return {
    habits: Array(HABIT_SLOTS).fill(''),
    grid: {},
    observations: ['', '', '', ''],
    keyGoals: [
      { text: '', done: false },
      { text: '', done: false },
      { text: '', done: false },
    ],
  };
}

export function cellKey(day: number, habitSlot: number): string {
  return `${day}:${habitSlot}`;
}
