export interface DiskState {
  mtime: number;
  size: number;
  content: string;
}

const diskStates = new Map<string, DiskState>();

export const diskStateTracker = {
  get(path: string): DiskState | undefined {
    return diskStates.get(path);
  },

  set(path: string, state: DiskState): void {
    diskStates.set(path, state);
  },

  remove(path: string): void {
    diskStates.delete(path);
  },

  clear(): void {
    diskStates.clear();
  },
};
