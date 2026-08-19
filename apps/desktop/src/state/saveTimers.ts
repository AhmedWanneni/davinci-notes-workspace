export const saveTimers: Record<string, NodeJS.Timeout> = {};

/** Keep a pending debounced save associated with a note after it is renamed. */
export function migrateSaveTimer(oldPath: string, newPath: string): void {
  if (!saveTimers[oldPath]) {
    return;
  }
  saveTimers[newPath] = saveTimers[oldPath];
  delete saveTimers[oldPath];
}
