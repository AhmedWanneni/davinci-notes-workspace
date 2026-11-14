import rawEmojiData from "./emojiData.json";

export interface EmojiEntry {
  emoji: string;
  label: string;
}

export interface EmojiCategoryGroup {
  key: string;
  label: string;
  emojis: EmojiEntry[];
}

export const EMOJI_CATEGORIES: EmojiCategoryGroup[] =
  rawEmojiData as EmojiCategoryGroup[];

export function searchEmojis(query: string): EmojiEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results: EmojiEntry[] = [];
  const seen = new Set<string>();

  for (const group of EMOJI_CATEGORIES) {
    for (const item of group.emojis) {
      if (item.label.toLowerCase().includes(q) && !seen.has(item.emoji)) {
        seen.add(item.emoji);
        results.push(item);
        if (results.length >= 120) return results;
      }
    }
  }
  return results;
}
