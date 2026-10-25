import type { AgentIntent } from "../prompts/index.js";

const VALID_INTENTS = new Set<AgentIntent>([
  "search_vault",
  "read_note",
  "create_note",
  "edit_note",
  "organize",
  "chat",
]);

export function isAgentIntent(val: string): val is AgentIntent {
  return VALID_INTENTS.has(val as AgentIntent);
}

const REGEX_CREATE =
  /\b(create|make|write|generate|new|add)\b.*\b(note|file|doc|document|folder|dir|directory|kanban|database|table|todo|tasks?)\b/i;
const REGEX_EDIT =
  /\b(edit|update|append|prepend|modify|replace|rewrite|change|delete|remove)\b.*\b(note|file|content|body|paragraph)?\b/i;
const REGEX_ORGANIZE =
  /\b(organize|sort|tidy|clean\s*up|rearrange)\b/i;
const REGEX_MOVE =
  /\b(move|rename|relocate)\b.*\b(note|file|folder|to)\b/i;
const REGEX_READ =
  /\b(read|open|show|view|display|check|inspect|look\s*at)\b.*\b(note|file|document)\b/i;
const REGEX_SEARCH =
  /\b(search|find|look\s*for|where\s*is|grep|locate|query)\b/i;
const REGEX_CHAT =
  /^(hi|hello|hey|howdy|good\s*(morning|afternoon|evening)|who\s+are\s+you|what\s+can\s+you\s+do|thanks|thank\s+you|help)\b[!.?]*$/i;

export function classifyIntentFast(text: string): AgentIntent | null {
  const trimmed = text.trim();
  if (!trimmed) return "chat";
  if (REGEX_CHAT.test(trimmed)) return "chat";

  // Check create before edit
  if (REGEX_CREATE.test(trimmed)) return "create_note";

  // Check organize/move before general edit
  if (REGEX_MOVE.test(trimmed) || REGEX_ORGANIZE.test(trimmed)) {
    return "organize";
  }

  // Check read before search
  if (REGEX_READ.test(trimmed)) return "read_note";

  // Check edit
  if (REGEX_EDIT.test(trimmed)) return "edit_note";

  // Check search
  if (REGEX_SEARCH.test(trimmed)) return "search_vault";

  return null;
}

export const INTENT_MODEL_PROMPT = `Classify this user request into exactly one of these intents:
- search_vault
- read_note
- create_note
- edit_note
- organize
- chat

Respond with ONLY the intent name.`;

export async function routeIntent(
  userText: string,
  callModel?: (prompt: string) => Promise<string>,
): Promise<AgentIntent> {
  const fast = classifyIntentFast(userText);
  if (fast) return fast;

  if (callModel) {
    try {
      const prompt = `${INTENT_MODEL_PROMPT}\n\nRequest:\n"${userText}"`;
      const res = await callModel(prompt);
      const cleaned = res.trim().toLowerCase().replace(/[^a-z_]/g, "");
      if (isAgentIntent(cleaned)) {
        return cleaned;
      }
    } catch {
      // fallback to chat
    }
  }

  return "chat";
}
