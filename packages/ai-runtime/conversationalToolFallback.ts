import type { AgentToolCall } from "@app/ai-api";

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
  return codeBlockMatch ? codeBlockMatch[1] : "";
}

const NAME_PATTERN =
  /(?:["'‘“]([^"'’”\n\r]+)["'’”]|(?:named|called|titled)?\s*([a-zA-Z0-9_\-/\.]+)(?:\s+(?:in|with|for|at|under)\b|\.|$|\s))/i;

/**
 * Recovers intent when conversational models hallucinate having performed
 * a vault action (e.g. "I've created a new note named 'sisi'...") without emitting a tool call.
 */
export function extractConversationalToolCall(
  assistantText: string,
  userPrompt?: string,
): AgentToolCall | null {
  const text = assistantText.trim();
  if (!text) return null;

  // 1. Note / file creation match in assistant text
  const notePrefix =
    /(?:I(?:'ve| have)?|I)\s+(?:created|made|added|am creating)\s+(?:a\s+)?(?:new\s+)?(?:note|file|document|doc|page)\s+(?:named|called|titled\s+)?/i;
  const createdNotePrefix =
    /(?:^|\n)(?:Created|Added)\s+(?:a\s+)?(?:new\s+)?(?:note|file|document|doc|page)\s+(?:named|called|titled\s+)?/i;

  if (notePrefix.test(text) || createdNotePrefix.test(text)) {
    const after = text.replace(notePrefix, "").replace(createdNotePrefix, "");
    const match = NAME_PATTERN.exec(after);
    const raw = match ? match[1] || match[2] : null;
    if (raw) {
      const path = cleanPath(raw);
      const content = extractCodeBlock(text);
      return {
        id: `call_conv_${Date.now()}`,
        name: "create_note",
        arguments: { path, content },
      };
    }
  }

  // 2. Folder creation match in assistant text
  const folderPrefix =
    /(?:I(?:'ve| have)?|I)\s+(?:created|made|added|am creating)\s+(?:a\s+)?(?:new\s+)?(?:folder|directory)\s+(?:named|called|titled\s+)?/i;
  const createdFolderPrefix =
    /(?:^|\n)(?:Created|Added)\s+(?:a\s+)?(?:new\s+)?(?:folder|directory)\s+(?:named|called|titled\s+)?/i;

  if (folderPrefix.test(text) || createdFolderPrefix.test(text)) {
    const after = text.replace(folderPrefix, "").replace(createdFolderPrefix, "");
    const match = NAME_PATTERN.exec(after);
    const raw = match ? match[1] || match[2] : null;
    if (raw) {
      const path = cleanPath(raw, true);
      return {
        id: `call_conv_${Date.now()}`,
        name: "create_folder",
        arguments: { path },
      };
    }
  }

  // 3. Kanban board creation match in assistant text
  const kanbanPrefix =
    /(?:I(?:'ve| have)?|I)\s+(?:created|made|added|am creating)\s+(?:a\s+)?(?:new\s+)?(?:kanban(?:\s+board)?|board)\s+(?:named|called|titled\s+)?/i;
  const createdKanbanPrefix =
    /(?:^|\n)(?:Created|Added)\s+(?:a\s+)?(?:new\s+)?(?:kanban(?:\s+board)?|board)\s+(?:named|called|titled\s+)?/i;

  if (kanbanPrefix.test(text) || createdKanbanPrefix.test(text)) {
    const after = text.replace(kanbanPrefix, "").replace(createdKanbanPrefix, "");
    const match = NAME_PATTERN.exec(after);
    const raw = match ? match[1] || match[2] : null;
    if (raw) {
      const title = raw.replace(/\.md$/i, "");
      const path = cleanPath(raw);
      return {
        id: `call_conv_${Date.now()}`,
        name: "create_kanban_board",
        arguments: { path, title },
      };
    }
  }

  // 4. Database creation match in assistant text
  const dbPrefix =
    /(?:I(?:'ve| have)?|I)\s+(?:created|made|added|am creating)\s+(?:a\s+)?(?:new\s+)?(?:database(?:\s+table)?|table)\s+(?:named|called|titled\s+)?/i;
  const createdDbPrefix =
    /(?:^|\n)(?:Created|Added)\s+(?:a\s+)?(?:new\s+)?(?:database(?:\s+table)?|table)\s+(?:named|called|titled\s+)?/i;

  if (dbPrefix.test(text) || createdDbPrefix.test(text)) {
    const after = text.replace(dbPrefix, "").replace(createdDbPrefix, "");
    const match = NAME_PATTERN.exec(after);
    const raw = match ? match[1] || match[2] : null;
    if (raw) {
      const title = raw.replace(/\.md$/i, "");
      const path = cleanPath(raw);
      return {
        id: `call_conv_${Date.now()}`,
        name: "create_database_table",
        arguments: { path, title },
      };
    }
  }

  // 5. Fallback from user prompt if assistant confirmed or attempted action
  if (
    userPrompt &&
    /(?:sure|i(?:'ll| will)|okay|done|creating|created|right away|empty initially)/i.test(
      text,
    )
  ) {
    const userNote =
      /(?:create|make|add|new)\s+(?:a\s+)?(?:note|file|document|doc|page)(?:\s+(?:named|called|titled))?\s+["'‘“]?([a-zA-Z0-9_\-/\.]+)["'’”]?/i.exec(
        userPrompt,
      );
    if (userNote && userNote[1]) {
      return {
        id: `call_conv_${Date.now()}`,
        name: "create_note",
        arguments: {
          path: cleanPath(userNote[1]),
          content: extractCodeBlock(text),
        },
      };
    }

    const userFolder =
      /(?:create|make|add|new)\s+(?:a\s+)?(?:folder|directory)(?:\s+(?:named|called|titled))?\s+["'‘“]?([a-zA-Z0-9_\-/\.]+)["'’”]?/i.exec(
        userPrompt,
      );
    if (userFolder && userFolder[1]) {
      return {
        id: `call_conv_${Date.now()}`,
        name: "create_folder",
        arguments: { path: cleanPath(userFolder[1], true) },
      };
    }
  }

  return null;
}
