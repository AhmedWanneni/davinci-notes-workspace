import { readNote, writeNote, withVaultWatchSuppressed } from "../../vault";

export interface NoteCoverData {
  url: string;
  y: number;
}

export const COVERS_JSON_PATH = ".davinci/covers.json";

export async function loadNoteCovers(): Promise<Record<string, NoteCoverData>> {
  try {
    const file = await readNote(COVERS_JSON_PATH);
    const parsed = JSON.parse(file.content) as unknown;
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as Record<string, NoteCoverData>;
    }
    return {};
  } catch {
    return {};
  }
}

export async function persistNoteCover(
  path: string,
  cover: NoteCoverData | null,
  currentCovers: Record<string, NoteCoverData>,
): Promise<Record<string, NoteCoverData>> {
  const next = { ...currentCovers };
  if (cover === null) {
    delete next[path];
  } else {
    next[path] = cover;
  }
  await withVaultWatchSuppressed(() =>
    writeNote(COVERS_JSON_PATH, JSON.stringify(next, null, 2)),
  );
  return next;
}
