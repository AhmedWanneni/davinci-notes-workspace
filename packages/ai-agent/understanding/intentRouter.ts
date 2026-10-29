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
const REGEX_ORGANIZE_FILES =
  /\b(put|move|place|organize|relocate|shift|transfer)\b.*\b(files?|notes?|docs?|everything|them|it)\b.*\b(in|into|under|to)\b/i;
const REGEX_FOLDER_AND_PUT =
  /\b(create|make)\b.*\b(folder|dir|directory)\b.*\b(put|move|place|relocate|transfer)\b/i;
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

  // Check organize/move before create so "create folder and put files in it" routes to organize
  if (
    REGEX_MOVE.test(trimmed) ||
    REGEX_ORGANIZE.test(trimmed) ||
    REGEX_ORGANIZE_FILES.test(trimmed) ||
    REGEX_FOLDER_AND_PUT.test(trimmed)
  ) {
    return "organize";
  }

  // Check create
  if (REGEX_CREATE.test(trimmed)) return "create_note";

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
