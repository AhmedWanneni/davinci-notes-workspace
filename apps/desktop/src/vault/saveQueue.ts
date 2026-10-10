/**
 * Serializes asynchronous operations on a per-path basis.
 * Ensures debounced auto-save, Cmd+S, and quit-time flushes do not interleave
 * or race with each other or with disk guard checks.
 */
const queues = new Map<string, Promise<unknown>>();

export function queuePerPath<T>(
  path: string,
  task: () => Promise<T>,
): Promise<T> {
  const previous = queues.get(path) ?? Promise.resolve();

  const taskPromise = previous.then(task, task);
  const safeNext = taskPromise.catch(() => undefined);
  queues.set(path, safeNext);

  safeNext.finally(() => {
    if (queues.get(path) === safeNext) {
      queues.delete(path);
    }
  });

  return taskPromise;
}
