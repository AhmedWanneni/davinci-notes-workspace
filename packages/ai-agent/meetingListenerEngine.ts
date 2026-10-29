import type { VaultInspectionBackend } from "./vaultInspectionTools.js";
import {
  createMeetingSynthesisPrompt,
  extractActionItemsPrompt,
} from "./prompts/meetingPrompts.js";

export interface SuggestedVaultLink {
  id: string;
  title: string;
  path: string;
  reason: string;
  relevanceScore?: number;
  accepted?: boolean;
}

const STOP_WORDS = new Set([
  "the",
  "and",
  "that",
  "have",
  "for",
  "not",
  "with",
  "you",
  "this",
  "but",
  "his",
  "from",
  "they",
  "say",
  "her",
  "she",
  "will",
  "one",
  "all",
  "would",
  "there",
  "their",
  "what",
  "out",
  "about",
  "who",
  "get",
  "which",
  "go",
  "me",
  "when",
  "make",
  "can",
  "like",
  "time",
  "no",
  "just",
  "him",
  "know",
  "take",
  "people",
  "into",
  "year",
  "your",
  "good",
  "some",
  "could",
  "them",
  "see",
  "other",
  "than",
  "then",
  "now",
  "look",
  "only",
  "come",
  "its",
  "over",
  "think",
  "also",
  "back",
  "after",
  "use",
  "two",
  "how",
  "our",
  "work",
  "first",
  "well",
  "way",
  "even",
  "new",
  "want",
  "because",
  "any",
  "these",
  "give",
  "day",
  "most",
  "us",
  "need",
]);

export function extractSearchTerms(text: string, maxTerms = 5): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !STOP_WORDS.has(w));

  const frequencies = new Map<string, number>();
  for (const word of words) {
    frequencies.set(word, (frequencies.get(word) ?? 0) + 1);
  }

  return Array.from(frequencies.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTerms)
    .map(([term]) => term);
}

export async function findSuggestedVaultLinks(
  transcriptText: string,
  backend: VaultInspectionBackend,
  existingSuggested: Set<string> = new Set(),
): Promise<SuggestedVaultLink[]> {
  if (!backend.searchFts || !transcriptText.trim()) {
    return [];
  }

  const terms = extractSearchTerms(transcriptText, 3);
  if (terms.length === 0) return [];

  const candidates: SuggestedVaultLink[] = [];
  const seenPaths = new Set<string>();

  for (const term of terms) {
    try {
      const results = await backend.searchFts(term, undefined, 3);
      for (const item of results) {
        if (seenPaths.has(item.path) || existingSuggested.has(item.path))
          continue;
        seenPaths.add(item.path);

        const title =
          item.path.replace(/\.md$/i, "").split("/").pop() ?? item.path;
        candidates.push({
          id: `link_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          title,
          path: item.path,
          reason: `Matches topic keyword "${term}"`,
          relevanceScore: item.score ?? 0.8,
          accepted: undefined,
        });

        if (candidates.length >= 5) break;
      }
    } catch {
      // Gracefully continue next term
    }
    if (candidates.length >= 5) break;
  }

  return candidates;
}

const ACTION_ITEM_REGEX =
  /(?:need to|we should|i will|let's|action item:?|follow up on|make sure to)\s+([^.!?\n]+)/gi;

export async function detectActionItems(
  transcriptText: string,
  llmCaller?: (prompt: string) => Promise<string>,
): Promise<string[]> {
  if (llmCaller) {
    try {
      const response = await llmCaller(
        extractActionItemsPrompt(transcriptText),
      );
      const lines = response
        .split("\n")
        .map((l) => l.replace(/^[-*]\s*(\[[ x]\])?\s*/i, "").trim())
        .filter((l) => l.length > 5);
      if (lines.length > 0) return lines;
    } catch {
      // Fallback to regex
    }
  }

  const items: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = ACTION_ITEM_REGEX.exec(transcriptText)) !== null) {
    const raw = match[1].trim();
    if (raw.length > 5 && raw.length < 120) {
      items.push(raw.charAt(0).toUpperCase() + raw.slice(1));
    }
  }

  return Array.from(new Set(items));
}

export async function synthesizeMeetingSummary(
  transcriptText: string,
  existingSummary?: string,
  llmCaller?: (prompt: string) => Promise<string>,
): Promise<string> {
  if (!transcriptText.trim()) return existingSummary ?? "";

  if (llmCaller) {
    try {
      return await llmCaller(
        createMeetingSynthesisPrompt(transcriptText, existingSummary),
      );
    } catch {
      // Fallback
    }
  }

  return existingSummary || "Key discussion captured from live meeting stream.";
}
