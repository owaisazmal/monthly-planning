import { useCallback, useEffect, useMemo, useState } from 'react';
import { MonthRecord, loadMonthWindow } from '../storage';
import { Task } from '../tasks';
import { HistoryDay, buildHistory } from '../history';

/**
 * The history timeline: how far back it reaches, and what is in it.
 *
 * Months are read in a window rather than all at once — there is no upper bound
 * on how long someone has been using this, and a full read would grow forever.
 * Six months is roughly a screen's worth of scrolling for an active month, and
 * `loadMore` extends it by six more.
 */

const INITIAL_MONTHS = 6;
const MORE_MONTHS = 6;

export function useHistory(tasks: Task[], enabled: boolean, now: number) {
  const [span, setSpan] = useState(INITIAL_MONTHS);
  const [records, setRecords] = useState<MonthRecord[] | null>(null);
  const [loading, setLoading] = useState(false);

  // Re-read on every open rather than caching across them: the planner is right
  // underneath, and anything marked there while history was closed has to show
  // up when it is opened again.
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setLoading(true);

    const today = new Date();
    loadMonthWindow(today.getFullYear(), today.getMonth(), span).then((loaded) => {
      if (cancelled) return;
      setRecords(loaded);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [enabled, span]);

  // Collapsing the window on close means the next open starts cheap again,
  // instead of re-reading however many months were paged in last time.
  useEffect(() => {
    if (!enabled) setSpan(INITIAL_MONTHS);
  }, [enabled]);

  const days: HistoryDay[] = useMemo(
    () => (records ? buildHistory(records, tasks, now) : []),
    [records, tasks, now]
  );

  const loadMore = useCallback(() => setSpan((s) => s + MORE_MONTHS), []);

  /**
   * Whether asking for more could plausibly return anything.
   *
   * Judged on the oldest batch rather than the single oldest month: one quiet
   * month at the far end says nothing about the year behind it, and testing
   * only that month would hide everything older the moment someone took a
   * month off. A whole empty batch is a fair sign the trail has run out.
   */
  const canLoadMore =
    !loading &&
    !!records?.length &&
    records.slice(-MORE_MONTHS).some((r) => Object.keys(r.data.grid).length > 0);

  return {
    days,
    /**
     * Nothing to show yet, whether or not a read is actually in flight.
     *
     * Derived from the absence of records rather than from the request, so the
     * screen shows the spinner from its first frame — the entrance plays before
     * the read is even allowed to start, and an "it is empty" message during
     * those few hundred milliseconds would be a lie.
     */
    loading: records === null,
    /** a later read, with the previous page still in place underneath */
    loadingMore: loading && records !== null,
    span,
    loadMore,
    canLoadMore,
  };
}
