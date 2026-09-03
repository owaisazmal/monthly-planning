import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadTasks, nextTaskId, saveTasks } from '../tasks';
import type { Task } from '../tasks';

/**
 * The only module here that touches storage, so it is the only one that needs a
 * stand-in. Everything worth testing is in what comes back out of a read — the
 * parser is the guard between whatever is on disk and the rest of the app.
 */
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: { getItem: jest.fn(), setItem: jest.fn() },
}));

const store = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const KEY = '@monthly-planning/tasks';

/** Puts arbitrary JSON on "disk", including shapes the app would never write */
function stored(value: unknown) {
  store.getItem.mockResolvedValue(JSON.stringify(value));
}

const valid = {
  id: '0',
  text: 'Send the invoice',
  due: 1_800_000_000_000,
  done: false,
};

describe('loadTasks', () => {
  it('returns nothing when the key has never been written', async () => {
    store.getItem.mockResolvedValue(null);
    await expect(loadTasks()).resolves.toEqual([]);
  });

  it('reads back what was stored', async () => {
    stored([valid]);
    await expect(loadTasks()).resolves.toEqual([{ ...valid, completedAt: undefined }]);
  });

  it('survives a corrupted value rather than throwing', async () => {
    store.getItem.mockResolvedValue('{ not json');
    await expect(loadTasks()).resolves.toEqual([]);
  });

  it('survives storage itself failing', async () => {
    store.getItem.mockRejectedValue(new Error('disk gone'));
    await expect(loadTasks()).resolves.toEqual([]);
  });

  it('ignores a value that is not a list', async () => {
    stored({ id: '0' });
    await expect(loadTasks()).resolves.toEqual([]);
  });

  it.each([
    { missing: 'id', row: { ...valid, id: undefined } },
    { missing: 'text', row: { ...valid, text: undefined } },
    { missing: 'due', row: { ...valid, due: undefined } },
    { missing: 'done', row: { ...valid, done: undefined } },
  ])('drops a row with no $missing', async ({ row }) => {
    stored([row, valid]);
    const tasks = await loadTasks();
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('0');
  });

  it.each([
    { kind: 'a due date that is not a number', row: { ...valid, due: 'tomorrow' } },
    { kind: 'a due date that is not finite', row: { ...valid, due: Infinity } },
    { kind: 'a done flag that is not a boolean', row: { ...valid, done: 'yes' } },
    { kind: 'a null row', row: null },
  ])('drops $kind', async ({ row }) => {
    stored([row]);
    await expect(loadTasks()).resolves.toEqual([]);
  });

  it('clears a completion time left on an unfinished task', async () => {
    // nothing the app writes looks like this, but a hand-edited or half-migrated
    // record could — and history would otherwise file it as finished
    stored([{ ...valid, done: false, completedAt: 1_800_000_000_000 }]);
    const [task] = await loadTasks();
    expect(task.completedAt).toBeUndefined();
  });

  it('keeps the completion time on a finished task', async () => {
    const when = 1_800_000_000_000;
    stored([{ ...valid, done: true, completedAt: when }]);
    const [task] = await loadTasks();
    expect(task.completedAt).toBe(when);
  });

  it('clears a completion time that is not a number', async () => {
    stored([{ ...valid, done: true, completedAt: 'yesterday' }]);
    const [task] = await loadTasks();
    expect(task.completedAt).toBeUndefined();
  });
});

describe('saveTasks', () => {
  it('writes the list under the app-scoped key', async () => {
    const tasks: Task[] = [{ ...valid, completedAt: undefined }];
    await saveTasks(tasks);
    expect(store.setItem).toHaveBeenCalledWith(KEY, JSON.stringify(tasks));
  });

  it('swallows a failed write rather than surfacing it', async () => {
    store.setItem.mockRejectedValue(new Error('disk full'));
    await expect(saveTasks([])).resolves.toBeUndefined();
  });
});

describe('nextTaskId', () => {
  it('starts at zero on an empty list', () => {
    expect(nextTaskId([])).toBe('0');
  });

  it('goes past the highest id in use, not the list length', () => {
    // ids have to stay unique after a removal from the middle
    const tasks = [{ ...valid, id: '0' }, { ...valid, id: '7' }] as Task[];
    expect(nextTaskId(tasks)).toBe('8');
  });

  it('ignores ids that are not numbers', () => {
    const tasks = [{ ...valid, id: 'legacy' }, { ...valid, id: '2' }] as Task[];
    expect(nextTaskId(tasks)).toBe('3');
  });
});
