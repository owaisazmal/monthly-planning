import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { CellState, Habit, cellKey } from './types';

/**
 * Daily nudges for habits you haven't ticked off yet.
 *
 * iOS delivers local notifications from a schedule fixed in advance — nothing
 * runs at delivery time to ask "did they do it?". So instead the app rewrites
 * the whole schedule every time the data changes: today's remaining nudges are
 * dropped the moment nothing is left pending, and a week of them is queued ahead
 * so reminders still arrive if the app is never opened.
 */

/** Times of day to nudge, as [hour, minute]. */
const SLOTS: [number, number][] = [
  [12, 30],
  [17, 30],
  [20, 45],
];

/** How many days of nudges to keep queued, so silence never means "app unopened". */
const DAYS_AHEAD = 7;

const TITLES = ['Still pending', 'Evening check', 'Last call'];

/** One voice per slot: nudge at midday, firmer by evening, cheerfully doomed at night. */
const LINES: string[][] = [
  [
    "Your habits are sitting there untouched. They have feelings, you know.",
    "Two taps. That's the whole commitment. You've done harder before breakfast.",
    "Nothing ticked yet. The chart is looking a bit beige.",
    "Checking in. No pressure. Slight pressure.",
  ],
  [
    "Future you just opened the app. Future you is not thrilled.",
    "The grid has a hole in it and it's shaped exactly like today.",
    "Your habits have filed a missing person report.",
    "Still time to make today count. Comfortably. For now.",
  ],
  [
    "That streak took weeks to build and about one evening to lose.",
    "Discipline called. Left a voicemail. This is the voicemail.",
    "You don't have to feel like it. You just have to tap the thing.",
    "Last call. The day is closing its tab.",
  ],
];

/** Sent once when the day is fully accounted for, instead of another nudge. */
const CONGRATS = [
  "All ticked. Today didn't stand a chance.",
  'Clean sweep. Streak intact, smugness earned.',
  'Everything done. The grid is green and so are you.',
  'Done and dusted. Go and be insufferable about it.',
];

export async function ensurePermission(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Habit reminders',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    if (!current.canAskAgain) return false;
    const asked = await Notifications.requestPermissionsAsync();
    return asked.granted;
  } catch {
    return false;
  }
}

function pendingCount(habits: Habit[], grid: Record<string, CellState>, day: number): number {
  return habits.filter((h) => (grid[cellKey(day, h.id)] ?? 0) === 0).length;
}

function bodyFor(slot: number, dayOffset: number, pending: number): string {
  const lines = LINES[slot];
  // vary by day so the same line doesn't land two days running
  const line = lines[(dayOffset + slot) % lines.length];
  if (dayOffset === 0 && pending > 0) {
    const noun = pending === 1 ? 'habit' : 'habits';
    return `${pending} ${noun} still unticked. ${line}`;
  }
  return line;
}

export async function syncReminders(opts: {
  habits: Habit[];
  grid: Record<string, CellState>;
  /** current day-of-month, or null when the open month isn't the live one */
  today: number | null;
  now: Date;
}): Promise<void> {
  const { habits, grid, today, now } = opts;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    if (habits.length === 0) return;
    if (!(await ensurePermission())) return;

    // Only the live month tells us anything about what's pending right now.
    const pendingToday = today !== null ? pendingCount(habits, grid, today) : habits.length;

    // Day already finished: swap the remaining nags for a single well-done.
    if (today !== null && pendingToday === 0) {
      const nextSlot = SLOTS.map(([hour, minute]) => {
        const at = new Date(now);
        at.setHours(hour, minute, 0, 0);
        return at;
      }).find((at) => at.getTime() > now.getTime());

      if (nextSlot) {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'All done today',
            body: CONGRATS[today % CONGRATS.length],
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: nextSlot,
          },
        });
      }
    }

    for (let dayOffset = 0; dayOffset < DAYS_AHEAD; dayOffset++) {
      // nothing left to nag about today — skip straight to tomorrow
      if (dayOffset === 0 && pendingToday === 0) continue;

      for (let slot = 0; slot < SLOTS.length; slot++) {
        const [hour, minute] = SLOTS[slot];
        const when = new Date(now);
        when.setDate(when.getDate() + dayOffset);
        when.setHours(hour, minute, 0, 0);
        if (when.getTime() <= now.getTime()) continue; // already passed today

        await Notifications.scheduleNotificationAsync({
          content: {
            title: TITLES[slot],
            body: bodyFor(slot, dayOffset, pendingToday),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: when,
          },
        });
      }
    }
  } catch {
    // reminders are a nicety; never let scheduling failure surface in the app
  }
}
