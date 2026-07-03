import AsyncStorage from '@react-native-async-storage/async-storage';
import { MonthData, emptyMonthData, HABIT_SLOTS } from './types';

function monthKey(year: number, month: number): string {
  // month is 0-based
  return `@monthly-planning/${year}-${String(month + 1).padStart(2, '0')}`;
}

export async function loadMonth(year: number, month: number): Promise<MonthData> {
  try {
    const raw = await AsyncStorage.getItem(monthKey(year, month));
    if (!raw) return emptyMonthData();
    const parsed = JSON.parse(raw) as Partial<MonthData>;
    const base = emptyMonthData();
    return {
      habits: Array.from({ length: HABIT_SLOTS }, (_, i) => parsed.habits?.[i] ?? ''),
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
