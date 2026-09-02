import { useCallback, useEffect, useRef, useState } from 'react';
import { Task, loadTasks, nextTaskId, saveTasks } from '../tasks';

/**
 * The deadline list: what's on it, and every way it can change.
 *
 * Mirrors `useMonthData` — loading, debounced persistence and named mutations —
 * but keyed to nothing, because tasks aren't filed under a month. Loaded once
 * for the life of the screen rather than per month, so moving between months
 * never drops a deadline out of the reminder schedule.
 */

const SAVE_DEBOUNCE_MS = 400;

/** 18:00 today if that's still ahead, otherwise 18:00 tomorrow */
function defaultDue(now = new Date()): number {
  const at = new Date(now);
  at.setHours(18, 0, 0, 0);
  if (at.getTime() <= now.getTime()) at.setDate(at.getDate() + 1);
  return at.getTime();
}

export interface TaskStore {
  tasks: Task[];
  loaded: boolean;
  addTask: () => void;
  setTaskText: (id: string, text: string) => void;
  setTaskDue: (id: string, due: number) => void;
  toggleTaskDone: (id: string) => void;
  removeTask: (id: string) => void;
  findTask: (id: string) => Task | undefined;
}

export function useTasks(): TaskStore {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadTasks().then((t) => {
      if (cancelled) return;
      setTasks(t);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!loaded) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => saveTasks(tasks), SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [tasks, loaded]);

  /**
   * Lands with a sensible deadline already on it rather than opening the picker
   * straight away — the first thing anyone wants to type is what the task is,
   * and the date is one tap away on the row itself.
   */
  const addTask = useCallback(() => {
    setTasks((prev) => [
      ...prev,
      { id: nextTaskId(prev), text: '', due: defaultDue(), done: false },
    ]);
  }, []);

  const setTaskText = useCallback((id: string, text: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, text } : t)));
  }, []);

  const setTaskDue = useCallback((id: string, due: number) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, due } : t)));
  }, []);

  /**
   * Stamps the moment it was finished, and clears that again if it is un-ticked
   * — the history is a record of what happened, so a task that goes back to
   * unfinished should leave nothing behind claiming otherwise.
   */
  const toggleTaskDone = useCallback((id: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, done: !t.done, completedAt: t.done ? undefined : Date.now() }
          : t
      )
    );
  }, []);

  const removeTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const findTask = useCallback(
    (id: string): Task | undefined => tasks.find((t) => t.id === id),
    [tasks]
  );

  return {
    tasks,
    loaded,
    addTask,
    setTaskText,
    setTaskDue,
    toggleTaskDone,
    removeTask,
    findTask,
  };
}
