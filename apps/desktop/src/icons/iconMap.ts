import { isEmojiIcon } from "./isEmojiIcon";

export type IconMap = Record<string, string>;

export function getMappedIcon(icons: IconMap, path: string): string | null {
  const icon = icons[path];
  return icon && isEmojiIcon(icon) ? icon : null;
}

export function setMappedIcon(
  icons: IconMap,
  path: string,
  icon: string,
): IconMap {
  if (!isEmojiIcon(icon)) throw new Error("Choose one emoji for the icon");
  return { ...icons, [path]: icon };
}

export function removeMappedIcon(icons: IconMap, path: string): IconMap {
  const next = { ...icons };
  delete next[path];
  return next;
}

export function parseIconMap(raw: string): IconMap {
  try {
    const value = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    return Object.fromEntries(
      Object.entries(value).filter(
        ([path, icon]) =>
          typeof path === "string" &&
          typeof icon === "string" &&
          isEmojiIcon(icon),
      ),
    );
  } catch {
    return {};
  }
}

export function serializeIconMap(icons: IconMap): string {
  return `${JSON.stringify(Object.fromEntries(Object.entries(icons).sort(([a], [b]) => a.localeCompare(b))), null, 2)}\n`;
}
