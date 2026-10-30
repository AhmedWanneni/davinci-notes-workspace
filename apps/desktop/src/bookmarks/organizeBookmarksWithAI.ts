import type { AIProvider } from "@app/ai-api";
import type { WebBookmarkItem } from "./bookmarkTypes";
import { extractDomainFromUrl } from "./bookmarkStorage";

export interface BookmarkOrganizationUpdate {
  id: string;
  folder: string;
  tags: string[];
}

export interface OrganizeBookmarksResult {
  updates: BookmarkOrganizationUpdate[];
  usedAI: boolean;
  organizedCount: number;
}

const DOMAIN_CATEGORY_RULES: ReadonlyArray<{
  pattern: RegExp;
  folder: string;
  tags: string[];
}> = [
  {
    pattern:
      /github\.com|gitlab\.com|bitbucket\.org|stackoverflow\.com|npmjs\.com|crates\.io|pypi\.org|pkg\.go\.dev|vercel\.com|netlify\.com|cloudflare\.com|docker\.com/i,
    folder: "Development",
    tags: ["dev", "code"],
  },
  {
    pattern:
      /developer\.mozilla\.org|docs\.|readthedocs\.io|devdocs\.io|react\.dev|typescriptlang\.org|rust-lang\.org|tauri\.app/i,
    folder: "Documentation",
    tags: ["docs", "reference"],
  },
  {
    pattern:
      /arxiv\.org|scholar\.google|huggingface\.co|openai\.com|anthropic\.com|deepmind\.google|kaggle\.com|paperswithcode\.com/i,
    folder: "AI & Research",
    tags: ["ai", "research"],
  },
  {
    pattern:
      /figma\.com|dribbble\.com|behance\.net|awwwards\.com|linear\.app|unsplash\.com|fonts\.google\.com/i,
    folder: "Design & UI",
    tags: ["design", "ui"],
  },
  {
    pattern:
      /youtube\.com|youtu\.be|vimeo\.com|twitch\.tv|spotify\.com|podcasts\.apple\.com/i,
    folder: "Media & Video",
    tags: ["video", "media"],
  },
  {
    pattern:
      /news\.ycombinator\.com|medium\.com|substack\.com|dev\.to|hashnode\.com|nytimes\.com|theverge\.com|wired\.com|wikipedia\.org/i,
    folder: "Reading & Articles",
    tags: ["reading", "article"],
  },
  {
    pattern:
      /notion\.so|obsidian\.md|trello\.com|asana\.com|calendar\.google\.com|mail\.google\.com|drive\.google\.com/i,
    folder: "Productivity & Tools",
    tags: ["tools", "productivity"],
  },
  {
    pattern:
      /amazon\.|ebay\.com|stripe\.com|bloomberg\.com|yahoo\.com\/finance|coinbase\.com/i,
    folder: "Finance & Shopping",
    tags: ["finance", "shopping"],
  },
];

export function classifyBookmarkDeterministically(
  item: WebBookmarkItem,
): BookmarkOrganizationUpdate {
  const domain = item.domain ?? extractDomainFromUrl(item.url) ?? "";
  const haystack = `${domain} ${item.url} ${item.title} ${item.description ?? ""}`;

  for (const rule of DOMAIN_CATEGORY_RULES) {
    if (rule.pattern.test(haystack)) {
      const mergedTags = Array.from(
        new Set([...(item.tags ?? []), ...rule.tags]),
      ).slice(0, 5);
      return {
        id: item.id,
        folder: rule.folder,
        tags: mergedTags,
      };
    }
  }

  const cleanDomainTag = domain
    .split(".")[0]
    ?.replace(/[^a-z0-9-]/gi, "")
    .toLowerCase();
  const fallbackTags = Array.from(
    new Set([
      ...(item.tags ?? []),
      ...(cleanDomainTag && cleanDomainTag.length > 2 ? [cleanDomainTag] : ["web"]),
    ]),
  ).slice(0, 4);

  return {
    id: item.id,
    folder: item.folder || "General & Reference",
    tags: fallbackTags,
  };
}

export function parseAIOrganizationResponse(
  rawContent: string,
  validIds: ReadonlySet<string>,
): BookmarkOrganizationUpdate[] {
  const fencedMatch = rawContent.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fencedMatch ? fencedMatch[1] : rawContent).trim();
  const startBracket = candidate.indexOf("[");
  const endBracket = candidate.lastIndexOf("]");
  if (startBracket === -1 || endBracket === -1 || endBracket <= startBracket) {
    return [];
  }

  try {
    const parsed = JSON.parse(
      candidate.slice(startBracket, endBracket + 1),
    ) as unknown;
    if (!Array.isArray(parsed)) return [];
    const updates: BookmarkOrganizationUpdate[] = [];

    for (const entry of parsed) {
      if (!entry || typeof entry !== "object") continue;
      const rec = entry as Record<string, unknown>;
      const id = typeof rec.id === "string" ? rec.id.trim() : "";
      const folder = typeof rec.folder === "string" ? rec.folder.trim() : "";
      if (!id || !validIds.has(id) || !folder) continue;
      const tags = Array.isArray(rec.tags)
        ? rec.tags
            .filter((t): t is string => typeof t === "string")
            .map((t) => t.trim().replace(/^#/, "").toLowerCase())
            .filter(Boolean)
            .slice(0, 5)
        : [];
      updates.push({ id, folder, tags });
    }
    return updates;
  } catch {
    return [];
  }
}

import { useWorkspaceStore } from "../state/useWorkspaceStore";

async function resolveDefaultProvider(): Promise<AIProvider | null> {
  if (!useWorkspaceStore.getState().vaultPath) return null;
  try {
    const aiMod = await import("../ai/AISubsystem");
    const providerId = await aiMod.loadSelectedProvider();
    return await aiMod.createConfiguredProvider(providerId);
  } catch {
    return null;
  }
}

export async function organizeBookmarksWithAI(
  items: readonly WebBookmarkItem[],
  options: {
    existingFolders?: readonly string[];
    customInstruction?: string;
    providerFactory?: () => Promise<AIProvider | null>;
  } = {},
): Promise<OrganizeBookmarksResult> {
  if (items.length === 0) {
    return { updates: [], usedAI: false, organizedCount: 0 };
  }

  const getProvider = options.providerFactory ?? resolveDefaultProvider;
  const provider = await getProvider();

  if (!provider) {
    const updates = items.map(classifyBookmarkDeterministically);
    return { updates, usedAI: false, organizedCount: updates.length };
  }

  try {
    const validIds = new Set(items.map((i) => i.id));
    const batchItems = items.slice(0, 50).map((i) => ({
      id: i.id,
      title: i.title.slice(0, 120),
      domain: i.domain ?? extractDomainFromUrl(i.url) ?? "",
      folder: i.folder ?? "",
      tags: i.tags ?? [],
    }));

    const existingHint =
      options.existingFolders && options.existingFolders.length > 0
        ? `Existing folders to reuse when appropriate: ${options.existingFolders.join(", ")}.`
        : "Create concise, clear category folder names (e.g. Development, AI & Research, Design & UI, Documentation, Reading & Articles, Productivity & Tools).";

    const response = await provider.complete({
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            "You are an expert bookmark librarian. Categorize each bookmark into a clean folder name and 1-4 lowercase tags. Respond ONLY with a valid JSON array of objects: [{\"id\": \"...\", \"folder\": \"...\", \"tags\": [\"...\"]}].",
        },
        {
          role: "user",
          content: `${existingHint}\n${options.customInstruction ? `User instruction: ${options.customInstruction}\n` : ""}Bookmarks:\n${JSON.stringify(batchItems)}`,
        },
      ],
    });

    const aiUpdates = parseAIOrganizationResponse(response.content, validIds);
    const aiMap = new Map(aiUpdates.map((u) => [u.id, u]));

    const finalUpdates = items.map(
      (item) => aiMap.get(item.id) ?? classifyBookmarkDeterministically(item),
    );

    return {
      updates: finalUpdates,
      usedAI: aiUpdates.length > 0,
      organizedCount: finalUpdates.length,
    };
  } catch {
    const updates = items.map(classifyBookmarkDeterministically);
    return { updates, usedAI: false, organizedCount: updates.length };
  } finally {
    await provider.dispose().catch(() => undefined);
  }
}
