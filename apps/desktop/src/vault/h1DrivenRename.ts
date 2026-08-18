import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { extractH1Title } from "./extractH1Title";
import { noteTitleFromPath } from "./initialNoteContent";
import { renameNoteInVault } from "./renameNoteInVault";
import {
  buildNotePathInFolder,
  noteStemsEqual,
  sanitizeFilenameStem,
} from "./sanitizeFilenameStem";

export const H1_RENAME_DEBOUNCE_MS = 750;

const h1RenameTimers: Record<string, NodeJS.Timeout> = {};

export function scheduleH1DrivenRename(path: string): void {
  if (!path.endsWith(".md")) {
    return;
  }
  if (h1RenameTimers[path]) {
    clearTimeout(h1RenameTimers[path]);
  }
  h1RenameTimers[path] = setTimeout(() => {
    delete h1RenameTimers[path];
    void attemptH1DrivenRename(path);
  }, H1_RENAME_DEBOUNCE_MS);
}

export function clearH1RenameTimer(path: string): void {
  if (!h1RenameTimers[path]) {
    return;
  }
  clearTimeout(h1RenameTimers[path]);
  delete h1RenameTimers[path];
}

export async function flushH1DrivenRename(path: string): Promise<string> {
  if (h1RenameTimers[path]) {
    clearTimeout(h1RenameTimers[path]);
    delete h1RenameTimers[path];
    await attemptH1DrivenRename(path);
  }
  const state = useWorkspaceStore.getState();
  if (state.notesContent[path] !== undefined) {
    return path;
  }
  if (
    state.activeNotePath &&
    state.openNotes.includes(state.activeNotePath)
  ) {
    return state.activeNotePath;
  }
  return path;
}

async function attemptH1DrivenRename(path: string): Promise<void> {
  const content = useWorkspaceStore.getState().notesContent[path];
  if (content === undefined) {
    return;
  }

  const h1 = extractH1Title(content);
  if (!h1) {
    return;
  }

  const stem = sanitizeFilenameStem(h1);
  if (!stem) {
    return;
  }

  const currentStem = noteTitleFromPath(path);
  if (noteStemsEqual(stem, currentStem)) {
    return;
  }

  const newPath = buildNotePathInFolder(path, stem);
  if (newPath === path) {
    return;
  }

  const result = await renameNoteInVault(path, newPath);
  if (!result.ok && result.reason === "collision") {
    console.warn(`[vault] H1 rename skipped — ${newPath} already exists`);
  }
}
