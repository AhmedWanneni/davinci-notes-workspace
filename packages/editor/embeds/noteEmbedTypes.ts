export const MAX_EMBED_DEPTH = 3;
export const DEFAULT_EMBED_MAX_LINES = 25;

export interface NoteEmbedOptions {
  notePaths: readonly string[];
  sourcePath?: string;
  noteContents?: Readonly<Record<string, string>>;
  loadNoteContent?: (path: string) => Promise<string | null>;
  onLinkClick?: (targetRaw: string) => void;
  onTagClick?: (tagKey: string) => void;
  resolveMediaUrl?: (path: string) => string;
  isReadOnly?: boolean;
  embedChain?: readonly string[];
  maxLines?: number;
}
