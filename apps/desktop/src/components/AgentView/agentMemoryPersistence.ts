import {
  AGENT_MEMORY_PATH,
  parseMemoryData,
  addMemoryEntry,
  serializeMemoryData,
  formatMemoryPrompt,
  type VaultMutationBackend,
} from "@app/ai-agent";

const TAIL_REMEMBER_RE = /^(.+?)[,.]?\s+remember\s+that[.!]*$/i;
const REMEMBER_INLINE_RE =
  /(?:please\s+)?(?:remember\s+(?:that\s+)?|remember:\s*)(.+)/i;
const KEEP_IN_MIND_RE =
  /(?:please\s+)?(?:keep\s+in\s+mind\s+(?:that\s+)?)(.+)/i;
const DONT_FORGET_RE = /(?:please\s+)?(?:don't\s+forget\s+(?:that\s+)?)(.+)/i;

export function extractFactToRemember(promptText: string): string | null {
  const trimmed = promptText.trim();

  // Priority 1: "X is Y. remember that." — tail-remember pattern
  const tailMatch = TAIL_REMEMBER_RE.exec(trimmed);
  if (tailMatch && tailMatch[1]) {
    const fact = tailMatch[1].replace(/[.!?]+$/, "").trim();
    if (fact.length > 2) return fact;
  }

  // Priority 2: "keep in mind that X"
  const kimMatch = KEEP_IN_MIND_RE.exec(trimmed);
  if (kimMatch && kimMatch[1]) {
    const fact = kimMatch[1].replace(/[.!?]+$/, "").trim();
    if (fact.length > 2) return fact;
  }

  // Priority 3: "don't forget that X"
  const dfMatch = DONT_FORGET_RE.exec(trimmed);
  if (dfMatch && dfMatch[1]) {
    const fact = dfMatch[1].replace(/[.!?]+$/, "").trim();
    if (fact.length > 2) return fact;
  }

  // Priority 4: "remember that X" or "remember: X" (inline)
  const inlineMatch = REMEMBER_INLINE_RE.exec(trimmed);
  if (inlineMatch && inlineMatch[1]) {
    const fact = inlineMatch[1]
      .replace(/[.!?]+$/, "")
      .replace(/\.\s*remember\s+that[.!]*$/i, "")
      .trim();
    if (fact.length > 2) return fact;
  }

  return null;
}

export function getProjectMemoryPath(projectId?: string): string {
  return projectId
    ? `.sophia/agent-memory-${projectId}.json`
    : AGENT_MEMORY_PATH;
}

export async function autoSavePromptMemory(
  promptText: string,
  mutationBackend?: VaultMutationBackend,
  projectId?: string,
  appendLog?: (entry: string) => void,
): Promise<string | null> {
  if (!mutationBackend) return null;

  const factToSave = extractFactToRemember(promptText);
  if (!factToSave) return null;

  const memoryPath = getProjectMemoryPath(projectId);
  try {
    let rawJson = "";
    try {
      rawJson = await mutationBackend.readNote(memoryPath);
    } catch {
      rawJson = "";
    }
    const parsed = parseMemoryData(rawJson);
    const { data: updated } = addMemoryEntry(parsed, factToSave, "fact");
    await mutationBackend.writeNote(memoryPath, serializeMemoryData(updated));
    if (appendLog) {
      appendLog(`Saved to memory: "${factToSave}"`);
    }
    return factToSave;
  } catch (err) {
    if (appendLog) {
      appendLog(
        `Memory save warning: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
    return null;
  }
}

export async function loadMemoryContext(
  mutationBackend?: VaultMutationBackend,
  projectId?: string,
): Promise<string> {
  if (!mutationBackend) return "";
  const memoryPath = getProjectMemoryPath(projectId);
  try {
    const rawJson = await mutationBackend.readNote(memoryPath);
    const memData = parseMemoryData(rawJson);
    return formatMemoryPrompt(memData);
  } catch {
    return "";
  }
}
