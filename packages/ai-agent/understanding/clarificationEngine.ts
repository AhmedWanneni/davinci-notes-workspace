import type { StructuredUserRequest } from "./rewriteSchema.js";

const INTENTS_REQUIRING_TARGET = new Set<string>([
  "read_note",
  "edit_note",
  "delete_note",
  "search_vault",
]);

export interface ClarificationCheckResult {
  needsClarification: boolean;
  reason?: string;
  question?: string;
}

export function shouldClarifyRequest(
  request: StructuredUserRequest,
): ClarificationCheckResult {
  // Check ambiguities
  if (request.ambiguities && request.ambiguities.length > 0) {
    const primaryAmbiguity = request.ambiguities[0];
    return {
      needsClarification: true,
      reason: `Ambiguity detected: ${primaryAmbiguity}`,
      question: formatClarifyingQuestion(request, primaryAmbiguity),
    };
  }

  // Check missing target for intents that require one
  if (INTENTS_REQUIRING_TARGET.has(request.intent) && !request.target) {
    return {
      needsClarification: true,
      reason: `Target is required for intent "${request.intent}" but was not specified`,
      question: formatMissingTargetQuestion(request),
    };
  }

  return { needsClarification: false };
}

function formatClarifyingQuestion(
  request: StructuredUserRequest,
  ambiguity: string,
): string {
  const lower = `${ambiguity} ${request.goal}`.toLowerCase();
  if (
    lower.includes("which note") ||
    lower.includes("vague") ||
    lower.includes("that note") ||
    lower.includes("the thing") ||
    lower.includes("unspecified note")
  ) {
    return `Could you specify which note you are referring to? Please provide the note title or keywords to search for.`;
  }
  return `Could you clarify: ${ambiguity}?`;
}

function formatMissingTargetQuestion(request: StructuredUserRequest): string {
  switch (request.intent) {
    case "read_note":
      return `Which note would you like me to read? Please provide the note title or path.`;
    case "edit_note":
      return `Which note would you like to edit? Please provide the note name or path.`;
    case "delete_note":
      return `Which note would you like to delete? Please specify the exact note path.`;
    case "search_vault":
      return `What topic or keyword would you like to search for in your vault?`;
    default:
      return `Could you please provide the specific note or folder name for this request?`;
  }
}
