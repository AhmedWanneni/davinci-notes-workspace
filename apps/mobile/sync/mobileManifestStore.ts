import type {
  DriveSyncStateStore,
  ManifestStorage,
  StoredState,
} from "@app/sync-client";
import type { MobileVaultStorageAdapter } from "../vault";

const MANIFEST_RELATIVE_PATH = ".davinci/manifest.json";
const SYNC_CURSOR_RELATIVE_PATH = ".davinci/sync-cursor.json";

export class MobileManifestStorage implements ManifestStorage {
  constructor(private readonly adapter: MobileVaultStorageAdapter) {}

  async read(): Promise<string | undefined> {
    try {
      const stat = await this.adapter.statFile(MANIFEST_RELATIVE_PATH);
      if (!stat.exists) return undefined;
      const file = await this.adapter.readNote(MANIFEST_RELATIVE_PATH);
      return file.content;
    } catch {
      return undefined;
    }
  }

  async write(value: string): Promise<void> {
    await this.adapter.writeNote(MANIFEST_RELATIVE_PATH, value);
  }
}

export class MobileDriveSyncStateStore implements DriveSyncStateStore {
  constructor(private readonly adapter: MobileVaultStorageAdapter) {}

  async load(): Promise<StoredState | undefined> {
    try {
      const stat = await this.adapter.statFile(SYNC_CURSOR_RELATIVE_PATH);
      if (!stat.exists) return undefined;
      const file = await this.adapter.readNote(SYNC_CURSOR_RELATIVE_PATH);
      return JSON.parse(file.content) as StoredState;
    } catch {
      return undefined;
    }
  }

  async save(state: StoredState): Promise<void> {
    await this.adapter.writeNote(
      SYNC_CURSOR_RELATIVE_PATH,
      JSON.stringify(state, null, 2),
    );
  }
}
