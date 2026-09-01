import type { ManifestEntry } from "./manifest";

export type SyncClassification = "push" | "pull" | "no-op" | "conflict";

export interface SyncDiff {
  path: string;
  classification: SyncClassification;
  local?: ManifestEntry;
  remote?: ManifestEntry;
}

function state(entry?: ManifestEntry): string {
  if (!entry) return "missing";
  return `${entry.hash}:${entry.size}:${entry.deleted ? "deleted" : "present"}`;
}

export function classifySyncDiff(
  local: readonly ManifestEntry[],
  base: readonly ManifestEntry[],
  remote: readonly ManifestEntry[],
): SyncDiff[] {
  const localByPath = new Map(local.map((entry) => [entry.path, entry]));
  const baseByPath = new Map(base.map((entry) => [entry.path, entry]));
  const remoteByPath = new Map(remote.map((entry) => [entry.path, entry]));
  const paths = new Set([
    ...localByPath.keys(),
    ...baseByPath.keys(),
    ...remoteByPath.keys(),
  ]);
  return [...paths].sort().map((path) => {
    const localEntry = localByPath.get(path);
    const baseEntry = baseByPath.get(path);
    const remoteEntry = remoteByPath.get(path);
    const localChanged = state(localEntry) !== state(baseEntry);
    const remoteChanged = state(remoteEntry) !== state(baseEntry);
    const classification: SyncClassification =
      localChanged && remoteChanged
        ? "conflict"
        : localChanged
          ? "push"
          : remoteChanged
            ? "pull"
            : "no-op";
    return { path, classification, local: localEntry, remote: remoteEntry };
  });
}
