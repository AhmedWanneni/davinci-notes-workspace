import type { GraphIndex } from "@app/indexer";

export interface ApplyNoteRenameInput {
  oldPath: string;
  newPath: string;
  contentUpdates: Map<string, string>;
  allNotePaths: string[];
  graph: GraphIndex | null;
}

interface WorkspaceSlice {
  openNotes: string[];
  activeNotePath: string | null;
  notesContent: Record<string, string>;
  dirtyNotes: Set<string>;
  allNotePaths: string[];
  graph: GraphIndex | null;
  vaultUpdateCounter: number;
}

/** Pure workspace state transition for a completed vault rename. */
export function applyNoteRenameState(
  state: WorkspaceSlice,
  input: ApplyNoteRenameInput,
): WorkspaceSlice {
  const { oldPath, newPath, contentUpdates, allNotePaths, graph } = input;
  const nextOpenNotes = state.openNotes.map((path) =>
    path === oldPath ? newPath : path,
  );
  const nextActivePath =
    state.activeNotePath === oldPath ? newPath : state.activeNotePath;
  const nextNotesContent = { ...state.notesContent };
  delete nextNotesContent[oldPath];
  for (const [path, content] of contentUpdates) {
    nextNotesContent[path] = content;
  }

  const nextDirty = new Set(state.dirtyNotes);
  if (nextDirty.has(oldPath)) {
    nextDirty.delete(oldPath);
    nextDirty.add(newPath);
  }

  return {
    ...state,
    openNotes: nextOpenNotes,
    activeNotePath: nextActivePath,
    notesContent: nextNotesContent,
    dirtyNotes: nextDirty,
    allNotePaths,
    graph: graph ?? state.graph,
    vaultUpdateCounter: state.vaultUpdateCounter + 1,
  };
}
