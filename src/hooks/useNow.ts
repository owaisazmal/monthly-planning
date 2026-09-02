import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * A clock that re-renders whatever reads it.
 *
 * Deadlines are the only part of the app whose appearance changes without
 * anyone touching anything — "4h left" has to become "3h left" on its own. A
 * coarse tick is enough for that, and the extra listener catches the case the
 * timer can't: coming back to a phone that has been in a pocket since morning,
 * where the interval has been throttled and the screen would otherwise show a
 * stale countdown for up to a full period.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const tick = () => setNow(Date.now());
    const timer = setInterval(tick, intervalMs);
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearInterval(timer);
      sub.remove();
    };
  }, [intervalMs]);

  return now;
}
