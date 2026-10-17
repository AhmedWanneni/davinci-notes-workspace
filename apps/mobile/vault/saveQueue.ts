/**
 * Per-key serialization queue for async save operations.
 *
 * Guarantees that saves targeting the same note key (path or noteId)
 * are executed sequentially. Two saves never race, and an older save
 * can never finish after a newer one.
 */

type QueueTask<T> = () => Promise<T>;

class SaveQueueManager {
  private queues = new Map<string, Promise<unknown>>();

  /**
   * Enqueues a task to run after all currently pending tasks for `key` complete.
   */
  enqueue<T>(key: string, task: QueueTask<T>): Promise<T> {
    const previousPromise = this.queues.get(key) ?? Promise.resolve();

    const currentPromise = previousPromise
      .catch(() => {
        // Continue queue execution even if previous task failed
      })
      .then(async () => {
        return await task();
      });

    this.queues.set(
      key,
      currentPromise.finally(() => {
        if (this.queues.get(key) === currentPromise) {
          this.queues.delete(key);
        }
      }),
    );

    return currentPromise;
  }

  /**
   * Returns true if there is an active or pending save for `key`.
   */
  isPending(key: string): boolean {
    return this.queues.has(key);
  }
}

export const defaultSaveQueue = new SaveQueueManager();
