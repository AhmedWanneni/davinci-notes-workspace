import type { AgentToolCall } from "@app/ai-api";

const INVALID_WORDS = new Set([
  "having", "hacing", "with", "about", "for", "in", "on", "at", "to", "from",
  "of", "by", "containing", "listing", "including", "summarizing", "called",
  "named", "titled", "that", "which", "a", "an", "the", "some", "all", "any",
  "and", "or", "but", "this", "my", "your",
]);

function cleanPath(raw: string, isFolder = false): string {
  let cleaned = raw
    .trim()
    .replace(/^["'‘“]+|["'’”]+$/g, "")
    .replace(/^\/+|\/+$/g, "");
  if (!isFolder && !cleaned.toLowerCase().endsWith(".md")) {
    cleaned = `${cleaned}.md`;
  }
  return cleaned;
}

export function isConversationalMeta(text: string): boolean {
  if (!text) return true;
  const lower = text.toLowerCase();
  return (
    lower.includes("staged-for-approval") ||
    lower.includes("staged for approval") ||
    lower.includes("pending approval") ||
    lower.includes("confirm or modify") ||
    lower.includes("staged for review") ||
    lower.includes("staged for your confirmation") ||
    lower.includes("please provide") ||
    lower.includes("what are the") ||
    lower.includes("what books") ||
    lower.includes("i'll need to know") ||
    lower.includes("could you provide") ||
    lower.includes("can you provide") ||
    lower.includes("do you want me to") ||
    lower.includes("would you like me to") ||
    lower.includes("to proceed, i'll need")
  );
}

function extractCodeBlock(text: string): string {
  const codeBlockMatch = /```(?:markdown|md)?\s*\n([\s\S]*?)\n```/.exec(text);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  // If text is conversational chatter, questions, or approval notices, it's not note content
  if (isConversationalMeta(text)) return "";

  // Only consider text as substantive content if it contains markdown structure
  const hasMarkdownStructure =
    /(?:^|\n)\s*(?:#{1,6}\s|[-*+]\s|\d+\.\s|\||- \[[ x]\])/.test(text);
  if (!hasMarkdownStructure) return "";

  const stripped = text
    .replace(
      /(?:I(?:'ve| have)?|I)\s+(?:created|made|added|am creating)\s+(?:a\s+)?(?:new\s+)?(?:note|file|document|doc|page|folder)[^\n]*\n?/gi,
      "",
    )
    .replace(
      /(?:The\s+)?(?:note|file)\s+is\s+(?:currently\s+|initially\s+)?empty[^\n]*\n?/gi,
      "",
    )
    .replace(/Here (?:is|are) (?:the|your)[^:\n]*:?\n?/gi, "")
    .trim();

  return stripped;
}

function deriveNoteNameFromTopic(prompt: string): string | null {
  const match =
    /(?:having|hacing|with|containing|about|for|listing)\s+(?:the\s+|a\s+)?(?:list\s+of\s+(?:the\s+|a\s+)?)?([a-zA-Z0-9_\-]+)/i.exec(
      prompt,
    );
  if (match && match[1] && !INVALID_WORDS.has(match[1].toLowerCase())) {
    return cleanPath(match[1]);
  }
  return null;
}

function matchEntityName(pattern: RegExp, text: string): string | null {
  const match = pattern.exec(text);
  if (!match) return null;
  const raw = (match[1] || match[2] || "").trim();
  if (!raw || INVALID_WORDS.has(raw.toLowerCase())) return null;
  return raw;
}

/**
 * Recovers one or more tool calls when models output conversational text
 * instead of executing structured tool JSON.
 */
export function extractConversationalToolCalls(
  assistantText: string,
  userPrompt?: string,
): AgentToolCall[] {
  const text = assistantText.trim();
  const prompt = userPrompt?.trim() || "";
  const results: AgentToolCall[] = [];

  if (isConversationalMeta(text) && !prompt) {
    return results;
  }

  // Check for folder creation in prompt or text
  const folderPromptPattern =
    /(?:create|make|add|new)\s+(?:a\s+)?(?:folder|directory)(?:\s+(?:named|called|titled))?\s*(?:["'‘“]([^"'’”]*)["'’”]|([a-zA-Z0-9_\-/\.]+))/i;
  const folderTextPattern =
    /(?:I(?:'ve| have)?|I)\s+(?:created|made|added|am creating)\s+(?:a\s+)?(?:new\s+)?(?:folder|directory)(?:\s+(?:named|called|titled))?\s*(?:["'‘“]([^"'’”]*)["'’”]|([a-zA-Z0-9_\-/\.]+))/i;

  const rawFolder =
    matchEntityName(folderPromptPattern, prompt) ||
    matchEntityName(folderTextPattern, text);

  let folderName: string | null = null;
  if (rawFolder) {
    folderName = cleanPath(rawFolder, true);
    results.push({
      id: `call_conv_folder_${Date.now()}`,
      name: "create_folder",
      arguments: { path: folderName },
    });
  }

  // Check for web search in prompt
  const searchMatch =
    /(?:search(?:\s+for)?|look\s+up|find)\s+([^,\n\r]+?)\s+(?:in|on|using|from)\s+(?:the\s+)?(?:internet|web|google|duckduckgo)/i.exec(
      prompt,
    );
  if (searchMatch && searchMatch[1]) {
    const query = searchMatch[1].trim();
    results.push({
      id: `call_conv_search_${Date.now()}`,
      name: "web_search",
      arguments: { query },
    });
  }


  // Check for note/file creation in assistant text (only if not conversational meta)
  const noteTextPattern =
    /(?:I(?:'ve| have)?|I)\s+(?:created|made|added|am creating)\s+(?:a\s+)?(?:new\s+)?(?:note|file|document|doc|page)(?:\s+(?:named|called|titled))?\s*(?:["'‘“]([^"'’”]*)["'’”]|([a-zA-Z0-9_\-/\.]+))/i;
  const rawNoteInText = isConversationalMeta(text)
    ? null
    : matchEntityName(noteTextPattern, text);

  if (rawNoteInText) {
    const rawNoteClean = cleanPath(rawNoteInText);
    const path =
      folderName && !rawNoteClean.includes("/")
        ? `${folderName}/${rawNoteClean}`
        : rawNoteClean;
    const content = extractCodeBlock(text);
    results.push({
      id: `call_conv_note_${Date.now()}`,
      name: "create_note",
      arguments: { path, content },
    });
    return results;
  }

  // Check for Kanban
  const kanbanPattern =
    /(?:create|make|add|new|I(?:'ve| have)?\s+created)\s+(?:a\s+)?(?:kanban(?:\s+board)?|board)(?:\s+(?:named|called|titled))?\s*(?:["'‘“]([^"'’”]*)["'’”]|([a-zA-Z0-9_\-/\.]+))/i;
  const rawKanban =
    matchEntityName(kanbanPattern, text) || matchEntityName(kanbanPattern, prompt);
  if (rawKanban) {
    results.push({
      id: `call_conv_kanban_${Date.now()}`,
      name: "create_kanban_board",
      arguments: { path: cleanPath(rawKanban), title: rawKanban.replace(/\.md$/i, "") },
    });
    return results;
  }

  // Check for Database
  const dbPattern =
    /(?:create|make|add|new|I(?:'ve| have)?\s+created)\s+(?:a\s+)?(?:database(?:\s+table)?|table)(?:\s+(?:named|called|titled))?\s*(?:["'‘“]([^"'’”]*)["'’”]|([a-zA-Z0-9_\-/\.]+))/i;
  const rawDb =
    matchEntityName(dbPattern, text) || matchEntityName(dbPattern, prompt);
  if (rawDb) {
    results.push({
      id: `call_conv_db_${Date.now()}`,
      name: "create_database_table",
      arguments: { path: cleanPath(rawDb), title: rawDb.replace(/\.md$/i, "") },
    });
    return results;
  }

  // Fallback single note creation from user prompt
  const userNotePattern =
    /(?:create|make|add|new)\s+(?:a\s+)?(?:note|file|document|doc|page)(?:\s+(?:named|called|titled))?\s*(?:["'‘“]([^"'’”]*)["'’”]|([a-zA-Z0-9_\-/\.]+))/i;
  const rawUserNote = matchEntityName(userNotePattern, prompt);

  let noteTarget = rawUserNote ? cleanPath(rawUserNote) : deriveNoteNameFromTopic(prompt);

  if (noteTarget) {
    const fullPath = folderName ? `${folderName}/${noteTarget}` : noteTarget;
    results.push({
      id: `call_conv_note_${Date.now()}`,
      name: "create_note",
      arguments: { path: fullPath, content: extractCodeBlock(text) },
    });
  }

  return results;
}

export function extractConversationalToolCall(
  assistantText: string,
  userPrompt?: string,
): AgentToolCall | null {
  const calls = extractConversationalToolCalls(assistantText, userPrompt);
  return calls.length > 0 ? calls[0] : null;
}
