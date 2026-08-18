import { useCallback, useState } from "react";
import { folderNameFromPath } from "../../vault/resolveUniqueFolderPath";
import { noteTitleFromPath } from "../../vault/initialNoteContent";

type RenameTarget =
  | { kind: "note"; path: string }
  | { kind: "folder"; path: string }
  | null;

interface UseFileTreeInlineRenameOptions {
  onRenameNote?: (oldPath: string, newStem: string) => Promise<boolean>;
  onRenameFolder?: (oldPath: string, newName: string) => Promise<boolean>;
}

export function useFileTreeInlineRename({
  onRenameNote,
  onRenameFolder,
}: UseFileTreeInlineRenameOptions) {
  const [target, setTarget] = useState<RenameTarget>(null);
  const [draftStem, setDraftStem] = useState("");

  const startRename = useCallback((path: string, kind: "note" | "folder") => {
    setTarget({ kind, path });
    setDraftStem(
      kind === "note" ? noteTitleFromPath(path) : folderNameFromPath(path),
    );
  }, []);

  const cancelRename = useCallback(() => {
    setTarget(null);
    setDraftStem("");
  }, []);

  const commitRename = useCallback(async () => {
    if (!target) {
      return;
    }
    const { path, kind } = target;
    const stem = draftStem;
    setTarget(null);
    setDraftStem("");
    if (kind === "note" && onRenameNote) {
      await onRenameNote(path, stem);
      return;
    }
    if (kind === "folder" && onRenameFolder) {
      await onRenameFolder(path, stem);
    }
  }, [draftStem, onRenameFolder, onRenameNote, target]);

  return {
    renamingPath: target?.path ?? null,
    renamingKind: target?.kind ?? null,
    draftStem,
    setDraftStem,
    startRename,
    cancelRename,
    commitRename,
  };
}
