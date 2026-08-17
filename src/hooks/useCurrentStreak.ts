import { useEffect, useState } from 'react';
import { YearMonthSummary } from '../storage';
import { computeStreaks } from '../streaks';

/**
 * The streak as of today, never as of the month being browsed — so paging back
 * through history doesn't put the header's flame out.
 *
 * Streaks are counted within a calendar year, so only the current year's
 * summary can answer. Browsing to any other year holds the last known count
 * rather than reporting a zero that isn't true.
 */
export function useCurrentStreak(year: number, months: YearMonthSummary[] | null): number {
  const [days, setDays] = useState(0);

  useEffect(() => {
    const now = new Date();
    if (!months || year !== now.getFullYear()) return;
    setDays(
      computeStreaks(year, months, { month: now.getMonth(), day: now.getDate() }).current
    );
  }, [months, year]);

  return days;
}
