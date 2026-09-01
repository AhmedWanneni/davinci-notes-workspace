import type { ManifestEntry, ManifestSnapshot } from "./manifest";
import { classifySyncDiff, type SyncDiff } from "./syncDiff";
import type { DriveChange, DriveClient, DriveFile } from "./driveApi";

export interface StoredState {
  startPageToken?: string;
}
export interface DriveSyncStateStore {
  load(): Promise<StoredState | undefined>;
  save(state: StoredState): Promise<void>;
}

export interface DriveManifestSyncInput {
  drive: DriveClient;
  state: DriveSyncStateStore;
  deviceId: string;
  local: ManifestSnapshot;
  base: ManifestSnapshot;
  manifestFileName?: string;
}

export interface DriveManifestSyncResult {
  diff: SyncDiff[];
  remoteManifests: ManifestSnapshot[];
  nextStartPageToken: string;
}

const isManifest = (file?: DriveFile): boolean =>
  Boolean(file?.name.startsWith("manifests/") && file.name.endsWith(".json"));

async function readManifest(
  drive: DriveClient,
  file: DriveFile,
): Promise<ManifestSnapshot> {
  const bytes = await drive.downloadFile(file.id);
  return JSON.parse(new TextDecoder().decode(bytes)) as ManifestSnapshot;
}

function changesToFiles(
  changes: readonly DriveChange[],
  ownName: string,
): DriveFile[] {
  const files = new Map<string, DriveFile>();
  for (const change of changes) {
    if (
      change.removed ||
      !isManifest(change.file) ||
      change.file?.name === ownName
    )
      continue;
    files.set(change.file!.id, change.file!);
  }
  return [...files.values()];
}

function mergeRemote(manifests: readonly ManifestSnapshot[]): ManifestEntry[] {
  const entries = new Map<string, ManifestEntry>();
  for (const manifest of manifests)
    for (const entry of manifest.entries) {
      const existing = entries.get(entry.path);
      if (!existing || entry.deviceClock > existing.deviceClock)
        entries.set(entry.path, entry);
    }
  return [...entries.values()];
}

export async function runDriveManifestSync(
  input: DriveManifestSyncInput,
): Promise<DriveManifestSyncResult> {
  const ownName = input.manifestFileName ?? `manifests/${input.deviceId}.json`;
  const previous = await input.state.load();
  let changes: DriveChange[] = [];
  let nextToken: string;
  if (previous?.startPageToken) {
    const delta = await input.drive.listChanges(previous.startPageToken);
    changes = delta.changes;
    nextToken = delta.nextPageToken;
  } else {
    nextToken = await input.drive.getStartPageToken();
  }
  const remoteFiles = previous?.startPageToken
    ? changesToFiles(changes, ownName)
    : (await input.drive.listAppDataFiles()).filter(
        (file) => isManifest(file) && file.name !== ownName,
      );
  const remoteManifests = await Promise.all(
    remoteFiles.map((file) => readManifest(input.drive, file)),
  );
  const diff = classifySyncDiff(
    input.local.entries,
    input.base.entries,
    mergeRemote(remoteManifests),
  );
  return { diff, remoteManifests, nextStartPageToken: nextToken };
}

export async function commitDriveManifestCursor(
  state: DriveSyncStateStore,
  startPageToken: string,
): Promise<void> {
  await state.save({ startPageToken });
}
