import type { AgentToolDefinition } from "@app/ai-api";
import { SafetyJailError, validateVaultRelativePath } from "./safetyJail.js";

export const DEFAULT_WIKI_FOLDER = "Wiki";
export const DEFAULT_WIKI_INDEX_PATH = "Wiki/Index.md";

export interface WikiSourceRef {
  path: string;
  excerpt?: string;
}

export interface WikiTopicPayload {
  topicName: string;
  summary: string;
  keyConcepts: string[];
  sources: WikiSourceRef[];
  existingContent?: string | null;
}

export interface WikiCategoryEntry {
  category: string;
  topics: Array<{ name: string; path: string; summary: string }>;
}

export const WIKI_SYNTHESIZE_TOOL: AgentToolDefinition = {
  name: "wiki_synthesize_topic",
  description: "Synthesize or update an evergreen wiki note in the Wiki/ folder with cross-links",
  parameters: {
    type: "object",
    properties: {
      topicName: { type: "string", description: "Name of the topic (e.g. 'Distributed Systems')" },
      summary: { type: "string", description: "Comprehensive synthesis of the concept" },
      keyConcepts: {
        type: "array",
        description: "List of key terms to interlink with [[Wikilinks]]",
      },
      sources: {
        type: "array",
        description: "Source notes that contributed to this topic: [{ path: string, excerpt?: string }]",
      },
      folder: { type: "string", description: "Wiki folder (default: 'Wiki')" },
    },
    required: ["topicName", "summary", "keyConcepts"],
  },
};

export const WIKI_UPDATE_INDEX_TOOL: AgentToolDefinition = {
  name: "wiki_update_index",
  description: "Update the Wiki Map of Content (Wiki/Index.md) with categorized topic links",
  parameters: {
    type: "object",
    properties: {
      categories: {
        type: "array",
        description: "Categorized topics: [{ category: string, topics: [{ name: string, path: string, summary: string }] }]",
      },
      folder: { type: "string", description: "Wiki folder (default: 'Wiki')" },
    },
    required: ["categories"],
  },
};

export const WIKI_TOOLS: AgentToolDefinition[] = [
  WIKI_SYNTHESIZE_TOOL,
  WIKI_UPDATE_INDEX_TOOL,
];

export function generateWikiTopicMarkdown(payload: WikiTopicPayload): string {
  const safeName = payload.topicName.replace(/[\\/:*?"<>|]/g, "").trim();
  const conceptsSection = payload.keyConcepts
    .map((c) => `- [[${c.trim()}]]`)
    .join("\n");

  const sourcesSection = payload.sources.length > 0
    ? payload.sources
        .map((s) => `- [[${s.path.replace(/\.md$/, "")}]]${s.excerpt ? `: _${s.excerpt}_` : ""}`)
        .join("\n")
    : "- _No direct note citations._";

  const lines = [
    "---",
    "type: wiki-topic",
    `topic: "${safeName.replace(/"/g, '\\"')}"`,
    "tags:",
    "  - wiki",
    "  - evergreen",
    "---",
    "",
    `# ${safeName}`,
    "",
    "## Overview",
    payload.summary.trim(),
    "",
    "## Key Concepts",
    conceptsSection,
    "",
    "## Related Sources",
    sourcesSection,
    "",
  ];

  return lines.join("\n");
}

export function generateWikiIndexMarkdown(categories: WikiCategoryEntry[]): string {
  const lines = [
    "---",
    "type: moc",
    "title: Wiki Index",
    "---",
    "",
    "# Knowledge Index (Map of Content)",
    "",
    "_Auto-maintained by DaVinci AI Agent._",
    "",
  ];

  for (const cat of categories) {
    lines.push(`## ${cat.category}`, "");
    if (cat.topics.length === 0) {
      lines.push("_No topics in this category yet._", "");
    } else {
      for (const t of cat.topics) {
        const linkPath = t.path.replace(/\.md$/, "");
        lines.push(`- [[${linkPath}|${t.name}]] — ${t.summary}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

export function buildWikiTopicPath(topicName: string, folder = DEFAULT_WIKI_FOLDER): string {
  const safeFolder = validateVaultRelativePath(folder);
  if (topicName.includes("/") || topicName.includes("\\") || topicName.includes("..")) {
    throw new SafetyJailError("traversal-detected", `Invalid topic name with path characters: "${topicName}"`);
  }
  const cleanTopic = topicName.replace(/[:*?"<>|]/g, "").trim();
  if (!cleanTopic) {
    throw new SafetyJailError("empty-path", "Topic name cannot be empty");
  }
  const rawPath = `${safeFolder}/${cleanTopic}.md`;
  return validateVaultRelativePath(rawPath);
}
