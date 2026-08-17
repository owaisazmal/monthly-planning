import { useEffect } from 'react';
import { MonthData } from '../types';
import { YearMonthSummary } from '../storage';
import { ThemeMode } from '../theme';
import { buildSnapshot } from '../widgets/snapshot';
import { syncWidgets } from '../widgets/sync';
import { syncReminders } from '../notifications';

/**
 * Everything the planner pushes *out* of the app — to the home screen and to
 * the notification schedule. Kept apart from the screen because none of it
 * affects what's on screen; it's the same data leaving by two other doors.
 */

/** Long enough that a burst of taps produces one push, not one per tap */
const DEBOUNCE_MS = 1200;

/**
 * Mirror a snapshot into the shared container the widgets read.
 *
 * Debounced longer than the save itself — WidgetKit rate-limits timeline
 * reloads, so there's no value in pushing one per keystroke. `mode` is a
 * dependency because the widgets take their colour scheme from the snapshot:
 * without it, switching the app's theme would leave every widget on the old
 * one until the next edit happened to push.
 */
export function useWidgetSync(
  enabled: boolean,
  year: number,
  month: number,
  data: MonthData,
  yearMonths: YearMonthSummary[] | null,
  mode: ThemeMode
) {
  useEffect(() => {
    if (!enabled || !yearMonths) return;
    const t = setTimeout(() => {
      syncWidgets(buildSnapshot(year, month, data, yearMonths, new Date(), mode));
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [enabled, data, year, month, yearMonths, mode]);
}

/**
 * Rewrite the reminder schedule on every change, so today's remaining nudges
 * disappear as soon as nothing is left pending.
 */
export function useReminderSync(enabled: boolean, data: MonthData, today: number | null) {
  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => {
      syncReminders({ habits: data.habits, grid: data.grid, today, now: new Date() });
    }, DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [enabled, data, today]);
}
