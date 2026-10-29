import type { AgentToolCall } from "@app/ai-api";
import { isConversationalMeta } from "./conversationalMeta.js";
export { isConversationalMeta };

const INVALID_WORDS = new Set([
  "having", "hacing", "with", "about", "for", "in", "on", "at", "to", "from",
  "of", "by", "containing", "listing", "including", "summarizing", "called",
  "named", "titled", "that", "which", "a", "an", "the", "some", "all", "any",
  "and", "or", "but", "this", "my", "your", "it", "them",
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

function extractMoveToolCalls(
  prompt: string,
  text: string,
  folderName: string | null,
): AgentToolCall[] {
  const calls: AgentToolCall[] = [];
  const combined = `${prompt} ${text}`.trim();
  const addMove = (from: string, to: string) => {
    if (!calls.some((c) => c.arguments.fromPath === from && c.arguments.toPath === to)) {
      calls.push({ id: `call_conv_move_${Date.now()}_${calls.length}`, name: "move_note", arguments: { fromPath: from, toPath: to } });
    }
  };

  const explicitPattern =
    /(?:move|moved|put|place|placed|relocate)\s+(?:the\s+)?(?:note|file\s+)?["'‘“]?([a-zA-Z0-9_\-\.]+\.md|[a-zA-Z0-9_\-]+)["'’”]?\s+(?:in|into|to|under)\s+(?:the\s+)?(?:folder|directory\s+)?["'‘“]?([a-zA-Z0-9_\-/\.]+)["'’”]?/gi;
  let match: RegExpExecArray | null;
  while ((match = explicitPattern.exec(combined)) !== null) {
    const rawFrom = match[1]?.trim().replace(/^["'‘“]+|["'’”\.\,\!]+$/g, "");
    const rawDest = match[2]?.trim().replace(/^["'‘“]+|["'’”\.\,\!]+$/g, "");
    if (rawFrom && rawDest && !INVALID_WORDS.has(rawFrom.toLowerCase()) && !INVALID_WORDS.has(rawDest.toLowerCase())) {
      const fromPath = cleanPath(rawFrom);
      const destClean = cleanPath(rawDest, true);
      const toPath = destClean.endsWith(".md") ? destClean : `${destClean}/${fromPath.split("/").pop()}`;
      addMove(fromPath, toPath);
    }
  }

  if (calls.length === 0 && folderName) {
    const putInItPattern =
      /(?:put|move|place|relocate)\s+(?:the\s+)?(?:note|file\s+)?["'‘“]?([a-zA-Z0-9_\-\.]+\.md|[a-zA-Z0-9_\-]+)["'’”]?\s+(?:in|into|under|to)\s+(?:it|the\s+folder|the\s+directory)/i;
    const itMatch = putInItPattern.exec(combined);
    const rawItFrom = itMatch?.[1]?.trim().replace(/^["'‘“]+|["'’”\.\,\!]+$/g, "");
    if (rawItFrom && !INVALID_WORDS.has(rawItFrom.toLowerCase())) {
      const fromPath = cleanPath(rawItFrom);
      const toPath = `${folderName}/${fromPath.split("/").pop()}`;
      addMove(fromPath, toPath);
    }
  }
  return calls;
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

  // Check for move/put existing files into folder
  const moveCalls = extractMoveToolCalls(prompt, text, folderName);
  if (moveCalls.length > 0) {
    results.push(...moveCalls);
    return results;
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
