import type { StorageArea } from "../storage/storageArea";
import {
  MAX_HIGHLIGHTS,
  MAX_HIGHLIGHTS_PER_URL,
  MAX_HIGHLIGHT_TEXT_LENGTH,
  type HighlightRecord,
} from "./HighlightRecord";

export const HIGHLIGHTS_KEY = "clipper.highlights";

function canonicalUrl(url: string): string | undefined {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:")
      return undefined;
    parsed.hash = "";
    return parsed.href;
  } catch {
    return undefined;
  }
}

function asRecord(value: unknown): HighlightRecord | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    return undefined;
  const item = value as Record<string, unknown>;
  const url = typeof item.url === "string" ? canonicalUrl(item.url) : undefined;
  if (
    url === undefined ||
    typeof item.id !== "string" ||
    typeof item.text !== "string" ||
    typeof item.occurrence !== "number" ||
    !Number.isInteger(item.occurrence) ||
    item.occurrence < 0 ||
    typeof item.createdAt !== "string"
  ) {
    return undefined;
  }
  const text = item.text.trim().slice(0, MAX_HIGHLIGHT_TEXT_LENGTH);
  return text.length === 0
    ? undefined
    : {
        id: item.id,
        url,
        text,
        occurrence: item.occurrence,
        createdAt: item.createdAt,
      };
}

export function boundedHighlights(value: unknown): HighlightRecord[] {
  if (!Array.isArray(value)) return [];
  const byUrl = new Map<string, HighlightRecord[]>();
  for (const candidate of value
    .map(asRecord)
    .filter((item): item is HighlightRecord => item !== undefined)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
    const records = byUrl.get(candidate.url) ?? [];
    records.push(candidate);
    if (records.length > MAX_HIGHLIGHTS_PER_URL) records.shift();
    byUrl.set(candidate.url, records);
  }
  return [...byUrl.values()]
    .flat()
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .slice(-MAX_HIGHLIGHTS);
}

export async function loadHighlights(
  area: StorageArea,
  url: string,
): Promise<HighlightRecord[]> {
  const canonical = canonicalUrl(url);
  if (canonical === undefined) return [];
  const stored = await area.get(HIGHLIGHTS_KEY);
  return boundedHighlights(stored[HIGHLIGHTS_KEY]).filter(
    (item) => item.url === canonical,
  );
}

export async function saveHighlight(
  area: StorageArea,
  record: HighlightRecord,
): Promise<void> {
  const stored = await area.get(HIGHLIGHTS_KEY);
  const next = boundedHighlights([
    ...boundedHighlights(stored[HIGHLIGHTS_KEY]),
    record,
  ]);
  await area.set({ [HIGHLIGHTS_KEY]: next.slice(-MAX_HIGHLIGHTS) });
}
