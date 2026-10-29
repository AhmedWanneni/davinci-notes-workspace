import {
  validateStructuredUserRequest,
  type StructuredUserRequest,
  type ValidationResult,
} from "./rewriteSchema.js";

export const REWRITE_SYSTEM_PROMPT = `You are a user request analyzer for a personal note-taking app.
Convert the raw user message into a clean structured JSON object with these exact fields:
- "goal": concise summary of what the user wants to achieve.
- "intent": primary action (search_vault, read_note, create_note, edit_note, organize, chat).
- "target": target note path, folder path, or search query string (or null if unspecified/unclear).
- "constraints": array of explicit constraints mentioned by the user (or empty array []).
- "ambiguities": array of missing or vague details that prevent execution without guessing (e.g. vague references like "that note", "the thing", unspecified title, or ambiguous targets).

CRITICAL: Output ONLY valid JSON matching this schema. No markdown formatting, no conversational text.
Example:
{"goal": "Create note with shopping list", "intent": "create_note", "target": "shopping.md", "constraints": [], "ambiguities": []}`;

export const REWRITE_RETRY_PROMPT = `Your previous output was invalid JSON or did not match the required schema:
{"goal": string, "intent": string, "target": string | null, "constraints": string[], "ambiguities": string[]}
Fix the output now. Return ONLY the raw JSON object with no explanations or markdown.`;

export function parseRewriteResponse(
  text: string,
): ValidationResult<StructuredUserRequest> {
  const trimmed = text.trim();
  const jsonMatch = /```(?:json)?\s*([\s\S]*?)\s*```/.exec(trimmed);
  let rawJson = jsonMatch ? jsonMatch[1].trim() : trimmed;

  if (!rawJson.startsWith("{") || !rawJson.endsWith("}")) {
    const embeddedMatch = /\{[\s\S]*?"goal"[\s\S]*?\}/.exec(trimmed);
    if (embeddedMatch) {
      rawJson = embeddedMatch[0].trim();
    }
  }

  try {
    const parsed = JSON.parse(rawJson);
    return validateStructuredUserRequest(parsed);
  } catch (err) {
    return {
      success: false,
      error: `JSON parse error: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}
