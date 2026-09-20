export const saveTimers: Record<string, NodeJS.Timeout> = {};

/** Keep a pending debounced save associated with a note after it is renamed. */
export function migrateSaveTimer(oldPath: string, newPath: string): void {
  if (!saveTimers[oldPath]) {
    return;
  }
  saveTimers[newPath] = saveTimers[oldPath];
  delete saveTimers[oldPath];
}

export function clearSaveTimer(path: string): void {
  const timer = saveTimers[path];
  if (timer) {
    clearTimeout(timer);
    delete saveTimers[path];
  }
}

export function clearAllSaveTimers(): void {
  Object.values(saveTimers).forEach(clearTimeout);
  Object.keys(saveTimers).forEach((key) => delete saveTimers[key]);
}
