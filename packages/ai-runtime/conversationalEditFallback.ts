import type { AgentToolCall } from "@app/ai-api";
import { cleanPath, INVALID_WORDS } from "./conversationalPathUtils.js";

const EDIT_PROMPT_PATTERN =
  /\b(?:edit|update|replace|rewrite|modify|append(?:\s+to)?)\b\s+(?:the\s+)?(?:(?:note|file|document|doc|page)\s+)?["'‘“]?([a-zA-Z0-9_./-]+\.md|[a-zA-Z0-9_./-]+)(?:["'’”\s]|$)/i;

const IN_NOTE_EDIT_PATTERN =
  /\b(?:in|into|to|on)\s+(?:the\s+)?(?:(?:note|file|document|doc|page)\s+)?["'‘“]?([a-zA-Z0-9_./-]+\.md)["'’”]?\s+(?:add|append|write|insert|update|edit)\b/i;

const EDIT_TEXT_PATTERN =
  /(?:I(?:'ve| have)?|I)\s+(?:updated|edited|modified|appended\s+to|rewritten|replaced)\s+(?:the\s+)?(?:(?:note|file|document|doc|page)\s+)?["'‘“]?([a-zA-Z0-9_./-]+\.md|[a-zA-Z0-9_./-]+)(?:["'’”\s]|$)/i;

const PASSIVE_EDIT_TEXT_PATTERN =
  /\b(?:Updated|Edited|Modified)\s+(?:the\s+)?(?:(?:note|file|document|doc|page)\s+)?["'‘“]?([a-zA-Z0-9_./-]+\.md|[a-zA-Z0-9_./-]+)(?:["'’”\s]|$)/i;

export function extractEditToolCall(
  prompt: string,
  text: string,
  extractCodeBlock: (t: string) => string,
): AgentToolCall | null {
  const match =
    EDIT_PROMPT_PATTERN.exec(prompt) ||
    IN_NOTE_EDIT_PATTERN.exec(prompt) ||
    EDIT_TEXT_PATTERN.exec(text) ||
    PASSIVE_EDIT_TEXT_PATTERN.exec(text);

  if (!match || !match[1]) return null;
  const rawTarget = match[1].trim().replace(/^["'‘“]+|["'’”.,!]+$/g, "");
  if (!rawTarget || INVALID_WORDS.has(rawTarget.toLowerCase())) return null;

  const editPath = cleanPath(rawTarget);
  return {
    id: `call_conv_edit_${Date.now()}`,
    name: "edit_note",
    arguments: { path: editPath, content: extractCodeBlock(text) },
  };
}
