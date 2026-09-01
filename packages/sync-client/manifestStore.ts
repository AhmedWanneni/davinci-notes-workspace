import type { ManifestSnapshot } from "./manifest";

export interface ManifestStore {
  load(): Promise<ManifestSnapshot | undefined>;
  save(snapshot: ManifestSnapshot): Promise<void>;
}

export interface ManifestStorage {
  read(): Promise<string | undefined>;
  write(value: string): Promise<void>;
}

export function createJsonManifestStore(
  storage: ManifestStorage,
): ManifestStore {
  return {
    async load() {
      const value = await storage.read();
      return value ? (JSON.parse(value) as ManifestSnapshot) : undefined;
    },
    async save(snapshot) {
      await storage.write(JSON.stringify(snapshot));
    },
  };
}
