import type { ManifestEntry } from "./manifest";

export interface PulledChange {
  entry: ManifestEntry;
  content?: ArrayBuffer;
}

export interface LocalChangeApplier {
  write(path: string, content: ArrayBuffer): Promise<void>;
  remove(path: string): Promise<void>;
}

export interface IncrementalIndexUpdater {
  upsert(path: string): Promise<void>;
  remove(path: string): Promise<void>;
}

function assertSafePath(path: string): void {
  if (!path || path.startsWith("/") || path.split("/").includes("..")) {
    throw new Error(`unsafe sync path: ${path}`);
  }
}

export async function applyPulledChanges(
  changes: readonly PulledChange[],
  files: LocalChangeApplier,
  index: IncrementalIndexUpdater,
): Promise<void> {
  for (const change of changes) {
    assertSafePath(change.entry.path);
    if (change.entry.deleted) {
      await files.remove(change.entry.path);
      await index.remove(change.entry.path);
      continue;
    }
    if (!change.content)
      throw new Error(`missing content for ${change.entry.path}`);
    await files.write(change.entry.path, change.content);
    await index.upsert(change.entry.path);
  }
}
