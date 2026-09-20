export interface FileTreeProps {
  filePaths: string[];
  folderPaths: string[];
  activePath: string | null;
  dirtyPaths: Set<string>;
  pendingRenameFolder?: string | null;
  pendingRenameNote?: string | null;
  onNoteClick: (path: string) => void;
  onCreateNote?: (parentFolder?: string) => void | Promise<unknown>;
  onCreateFolder: (parentFolder: string) => Promise<string | null>;
  onPendingRenameHandled?: () => void;
  onPendingRenameNoteHandled?: () => void;
  onRenameNote?: (oldPath: string, newStem: string) => Promise<boolean>;
  onRenameFolder?: (oldPath: string, newName: string) => Promise<boolean>;
  onDeleteNote?: (path: string) => Promise<boolean>;
  onDeleteFolder?: (path: string) => Promise<boolean>;
  onDuplicateNote?: (path: string) => Promise<boolean>;
  onMoveNote?: (path: string, newParentFolder: string) => Promise<boolean>;
  onMoveFile?: (path: string, newParentFolder: string) => Promise<boolean>;
  onDropFiles?: (targetFolder: string, files: readonly File[]) => Promise<void>;
  onSelectedFolderChange?: (folderPath: string | null) => void;
}
