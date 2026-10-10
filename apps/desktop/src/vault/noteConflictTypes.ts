import type { GraphIndex, TagIndex } from "@app/indexer";

export interface NoteConflictState {
  path: string;
  diskContent: string;
}

export type ConflictResolutionChoice = "keep_mine" | "use_disk" | "save_copy";

export interface WorkspaceSaveContext {
  allNotePaths: string[];
  graph: GraphIndex | null;
  tagIndex: TagIndex | null;
  notesContent: Record<string, string>;
  dirtyNotes: Set<string>;
  conflictNotes: Map<string, string>;
  vaultUpdateCounter: number;
}

export type WorkspaceSaveUpdater = (
  updater: (curr: WorkspaceSaveContext) => Partial<WorkspaceSaveContext>,
) => void;
