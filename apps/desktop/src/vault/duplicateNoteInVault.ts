import { updateGraphForNote } from "@app/indexer";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { noteTitleFromPath } from "./initialNoteContent";
import { noteFromMarkdown } from "./noteFromMarkdown";
import { resolveUniqueNotePath } from "./resolveUniqueNotePath";
import { getVaultIndexDb, persistNote, withDbLock } from "./sqliteIndex";
import { syncH1ToFilename } from "./syncH1ToFilename";
import { readNote, writeNote } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";

export type DuplicateNoteResult =
  | { ok: true; newPath: string }
  | { ok: false; reason: "missing" | "not-markdown" };

function duplicateCandidate(path: string, existingPaths: readonly string[]) {
  const folder = path.includes("/")
    ? path.slice(0, path.lastIndexOf("/") + 1)
    : "";
  const stem = noteTitleFromPath(path);
  return resolveUniqueNotePath(existingPaths, `${folder}${stem} copy.md`);
}

/** Canonical note duplicate: read source, write copy, index it, and refresh state. */
export async function duplicateNoteInVault(
  path: string,
): Promise<DuplicateNoteResult> {
  if (!path.endsWith(".md")) {
    return { ok: false, reason: "not-markdown" };
  }

  const state = useWorkspaceStore.getState();
  if (!state.allNotePaths.includes(path)) {
    return { ok: false, reason: "missing" };
  }

  const rawContent =
    state.notesContent[path] ??
    (await readNote(path).then((file) => file.content));
  const newPath = duplicateCandidate(path, state.allNotePaths);
  const content = syncH1ToFilename(rawContent, noteTitleFromPath(newPath));
  const updatedPaths = [...state.allNotePaths, newPath];
  const note = noteFromMarkdown(newPath, content, Date.now(), updatedPaths);

  return withVaultWatchSuppressed(async () => {
    await writeNote(newPath, content);

    const db = await getVaultIndexDb();
    await withDbLock(async () => {
      await persistNote(db, note);
    });

    useWorkspaceStore.setState((current) => ({
      allNotePaths: current.allNotePaths.includes(newPath)
        ? current.allNotePaths
        : [...current.allNotePaths, newPath],
      openNotes: current.openNotes.includes(newPath)
        ? current.openNotes
        : [...current.openNotes, newPath],
      activeNotePath: newPath,
      notesContent: { ...current.notesContent, [newPath]: content },
      graph: current.graph ? updateGraphForNote(current.graph, note) : null,
      vaultUpdateCounter: current.vaultUpdateCounter + 1,
    }));

    return { ok: true, newPath };
  });
}
