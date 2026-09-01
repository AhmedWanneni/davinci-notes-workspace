export interface ManifestEntry {
  path: string;
  hash: string;
  size: number;
  deviceClock: number;
  deleted: boolean;
}

export interface ManifestFile {
  path: string;
  size: number;
  mtimeMs: number;
}
export interface ManifestSnapshot {
  entries: readonly ManifestEntry[];
  metadata: Readonly<Record<string, { size: number; mtimeMs: number }>>;
}
export interface ManifestSource {
  listFiles(): Promise<readonly ManifestFile[]>;
  hashFile(path: string): Promise<string>;
}
export interface ManifestResult {
  entries: ManifestEntry[];
  metadata: Record<string, { size: number; mtimeMs: number }>;
  nextDeviceClock: number;
}

export interface ManifestGenerationOptions {
  forceRehash?: boolean;
}

function nextClock(clock: number, previous?: ManifestEntry): number {
  return Math.max(clock, previous?.deviceClock ?? 0) + 1;
}

export async function generateManifest(
  source: ManifestSource,
  previous?: ManifestSnapshot,
  deviceClock = 0,
  options: ManifestGenerationOptions = {},
): Promise<ManifestResult> {
  const files = [...(await source.listFiles())].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
  const previousEntries = new Map(
    (previous?.entries ?? []).map((entry) => [entry.path, entry]),
  );
  const metadata: Record<string, { size: number; mtimeMs: number }> = {};
  const entries: ManifestEntry[] = [];
  let clock = deviceClock;

  for (const file of files) {
    const old = previousEntries.get(file.path);
    const oldMetadata = previous?.metadata[file.path];
    metadata[file.path] = { size: file.size, mtimeMs: file.mtimeMs };
    if (
      !options.forceRehash &&
      old &&
      !old.deleted &&
      oldMetadata?.size === file.size &&
      oldMetadata.mtimeMs === file.mtimeMs
    ) {
      entries.push(old);
      previousEntries.delete(file.path);
      continue;
    }
    const hash = await source.hashFile(file.path);
    clock = nextClock(clock, old);
    entries.push({
      path: file.path,
      hash,
      size: file.size,
      deviceClock: clock,
      deleted: false,
    });
    previousEntries.delete(file.path);
  }

  for (const old of previousEntries.values()) {
    if (old.deleted) entries.push(old);
    else {
      clock = nextClock(clock, old);
      entries.push({ ...old, deviceClock: clock, deleted: true });
    }
  }
  entries.sort((a, b) => a.path.localeCompare(b.path));
  return { entries, metadata, nextDeviceClock: clock };
}

export function currentManifestEntries(
  entries: readonly ManifestEntry[],
): ManifestEntry[] {
  return entries.filter((entry) => !entry.deleted);
}
