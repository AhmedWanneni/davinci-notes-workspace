export const AGENT_MEMORY_PATH = ".davinci/agent/memory.json";

export interface AgentMemoryEntry {
  id: string;
  content: string;
  category?: "preference" | "fact" | "project" | "general";
  createdAt: number;
}

export interface AgentMemoryData {
  version: 1;
  entries: AgentMemoryEntry[];
}

export function parseMemoryData(raw: string | null): AgentMemoryData {
  if (!raw || !raw.trim()) {
    return { version: 1, entries: [] };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<AgentMemoryData>;
    return {
      version: 1,
      entries: Array.isArray(parsed.entries)
        ? parsed.entries.filter((e) => e && typeof e.content === "string")
        : [],
    };
  } catch {
    return { version: 1, entries: [] };
  }
}

export function serializeMemoryData(data: AgentMemoryData): string {
  return JSON.stringify(data, null, 2);
}

export function addMemoryEntry(
  data: AgentMemoryData,
  content: string,
  category: AgentMemoryEntry["category"] = "general",
): { data: AgentMemoryData; entry: AgentMemoryEntry } {
  const trimmed = content.trim();
  const existing = data.entries.find(
    (e) => e.content.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) {
    return { data, entry: existing };
  }

  const entry: AgentMemoryEntry = {
    id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    content: trimmed,
    category,
    createdAt: Date.now(),
  };

  return {
    data: {
      version: 1,
      entries: [...data.entries, entry],
    },
    entry,
  };
}

export function deleteMemoryEntry(
  data: AgentMemoryData,
  id: string,
): AgentMemoryData {
  return {
    version: 1,
    entries: data.entries.filter((e) => e.id !== id),
  };
}

export function formatMemoryPrompt(data: AgentMemoryData): string {
  if (!data.entries || data.entries.length === 0) return "";
  const lines = ["AGENT LONG-TERM MEMORY (Learned User Facts & Preferences):"];
  for (const e of data.entries) {
    const cat = e.category && e.category !== "general" ? `[${e.category}] ` : "";
    lines.push(`- ${cat}${e.content}`);
  }
  return lines.join("\n");
}
