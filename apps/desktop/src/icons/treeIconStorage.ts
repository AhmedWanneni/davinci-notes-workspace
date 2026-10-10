import { getMappedIcon, parseIconMap, serializeIconMap } from "./iconMap";
import { isEmojiIcon } from "./isEmojiIcon";
import { updateNoteIconContent } from "./updateNoteIconContent";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import {
  getVaultIndexDb,
  noteFromMarkdown,
  persistNote,
  readNote,
  withDbLock,
  withVaultWatchSuppressed,
  writeNote,
} from "../vault";

export const ICONS_JSON_PATH = ".davinci/icons.json";

export function isMarkdownNotePath(path: string): boolean {
  return path.endsWith(".md");
}

export function mappedIconsOnly(
  icons: Record<string, string>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(icons).filter(([path]) => !isMarkdownNotePath(path)),
  );
}

export function iconsFromNoteFrontmatter(
  rows: readonly { path: string; frontmatter: string }[],
): Record<string, string> {
  const icons: Record<string, string> = {};
  for (const row of rows) {
    try {
      const parsed = JSON.parse(row.frontmatter) as unknown;
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        continue;
      }
      const icon = (parsed as Record<string, unknown>).icon;
      if (typeof icon === "string" && isEmojiIcon(icon)) {
        icons[row.path] = icon;
      }
    } catch {
      // Skip corrupt index rows.
    }
  }
  return icons;
}

async function loadMappedIcons(): Promise<Record<string, string>> {
  try {
    const file = await readNote(ICONS_JSON_PATH);
    return parseIconMap(file.content);
  } catch {
    return {};
  }
}

async function loadNoteIcons(): Promise<Record<string, string>> {
  const db = await getVaultIndexDb();
  const rows = await withDbLock(() =>
    db.select<{ path: string; frontmatter: string }[]>(
      `SELECT path, frontmatter FROM notes WHERE instr(frontmatter, '"icon"') > 0`,
    ),
  );
  return iconsFromNoteFrontmatter(rows);
}

export async function loadTreeIcons(): Promise<Record<string, string>> {
  const [mapped, notes] = await Promise.all([
    loadMappedIcons(),
    loadNoteIcons(),
  ]);
  return { ...mapped, ...notes };
}

async function persistMappedIcons(
  icons: Record<string, string>,
): Promise<void> {
  await withVaultWatchSuppressed(() =>
    writeNote(ICONS_JSON_PATH, serializeIconMap(mappedIconsOnly(icons))),
  );
}

async function persistMarkdownIcon(path: string, icon: string): Promise<void> {
  const state = useWorkspaceStore.getState();
  const loaded = state.notesContent[path];
  const raw = loaded ?? (await readNote(path)).content;
  const next = updateNoteIconContent(raw, icon);

  await withVaultWatchSuppressed(() => writeNote(path, next));

  if (loaded !== undefined) {
    useWorkspaceStore.setState((current) => {
      const dirtyNotes = new Set(current.dirtyNotes);
      dirtyNotes.delete(path);
      return {
        notesContent: { ...current.notesContent, [path]: next },
        dirtyNotes,
      };
    });
  }

  const db = await getVaultIndexDb();
  const note = noteFromMarkdown(
    path,
    next,
    Date.now(),
    useWorkspaceStore.getState().allNotePaths,
  );
  await withDbLock(() => persistNote(db, note));
}

export async function persistTreeIcon(
  path: string,
  icon: string,
  currentIcons: Record<string, string>,
): Promise<void> {
  if (!getMappedIcon({ [path]: icon }, path)) {
    throw new Error("Choose one emoji for the icon");
  }
  if (isMarkdownNotePath(path)) {
    await persistMarkdownIcon(path, icon);
    return;
  }
  await persistMappedIcons({ ...currentIcons, [path]: icon });
}
