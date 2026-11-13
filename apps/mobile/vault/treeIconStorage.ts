import { defaultVaultManager } from "./vaultManager";
import { atomicWriteNote } from "./atomicNoteWriter";
import { isEmojiIcon } from "./isEmojiIcon";

export const ICONS_JSON_PATH = ".davinci/icons.json";

export function parseIconMap(content: string): Record<string, string> {
  try {
    const raw = JSON.parse(content) as unknown;
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    const valid: Record<string, string> = {};
    for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof val === "string" && isEmojiIcon(val)) {
        valid[key] = val;
      }
    }
    return valid;
  } catch {
    return {};
  }
}

export function serializeIconMap(icons: Record<string, string>): string {
  return JSON.stringify(icons, null, 2);
}

export async function loadTreeIcons(): Promise<Record<string, string>> {
  try {
    const { adapter } = await defaultVaultManager.getActiveAdapter();
    if (!adapter) return {};
    const stat = await adapter.statFile(ICONS_JSON_PATH);
    if (!stat.exists) return {};
    const file = await adapter.readNote(ICONS_JSON_PATH);
    return parseIconMap(file.content);
  } catch {
    return {};
  }
}

export async function persistTreeIcon(
  path: string,
  icon: string | null,
  currentIcons: Record<string, string>,
): Promise<Record<string, string>> {
  const next = { ...currentIcons };
  if (icon === null) {
    delete next[path];
  } else {
    if (!isEmojiIcon(icon)) {
      throw new Error("Invalid emoji icon");
    }
    next[path] = icon;
  }
  const { adapter } = await defaultVaultManager.getActiveAdapter();
  if (adapter) {
    if (!(await adapter.statFile(".davinci")).exists) {
      await adapter.createFolder(".davinci");
    }
    await atomicWriteNote(adapter, ICONS_JSON_PATH, serializeIconMap(next));
  }
  return next;
}
