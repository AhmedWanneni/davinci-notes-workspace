export interface SyncState {
  deviceId: string;
  startPageToken?: string;
}

export interface SyncStateStorage {
  read(): Promise<string | undefined>;
  write(value: string): Promise<void>;
}

export function createSyncStateStore(storage: SyncStateStorage) {
  return {
    async load(): Promise<SyncState | undefined> {
      const value = await storage.read();
      return value ? (JSON.parse(value) as SyncState) : undefined;
    },
    async save(state: SyncState): Promise<void> {
      await storage.write(JSON.stringify(state));
    },
  };
}
