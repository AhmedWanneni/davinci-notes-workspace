import { getMappedIcon, parseIconMap, serializeIconMap } from "./iconMap";
import { isEmojiIcon } from "./isEmojiIcon";
import {
  getVaultIndexDb,
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
  return { ...icons };
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
  try {
    const db = await getVaultIndexDb();
    const rows = await withDbLock(() =>
      db.select<{ path: string; frontmatter: string }[]>(
        `SELECT path, frontmatter FROM notes WHERE instr(frontmatter, '"icon"') > 0`,
      ),
    );
    return iconsFromNoteFrontmatter(rows);
  } catch {
    return {};
  }
}

export async function loadTreeIcons(): Promise<Record<string, string>> {
  const [mapped, notes] = await Promise.all([
    loadMappedIcons(),
    loadNoteIcons(),
  ]);
  // Mapped icons from .davinci/icons.json override any legacy note frontmatter
  return { ...notes, ...mapped };
}

async function persistMappedIcons(
  icons: Record<string, string>,
): Promise<void> {
  await withVaultWatchSuppressed(() =>
    writeNote(ICONS_JSON_PATH, serializeIconMap(icons)),
  );
}

export async function persistTreeIcon(
  path: string,
  icon: string,
  currentIcons: Record<string, string>,
): Promise<void> {
  if (!getMappedIcon({ [path]: icon }, path)) {
    throw new Error("Choose one emoji for the icon");
  }
  // Store all icons in .davinci/icons.json — never modify the markdown file
  await persistMappedIcons({ ...currentIcons, [path]: icon });
}
