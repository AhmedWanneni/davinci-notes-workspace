import type { ChatMessage } from "@app/ai-api";
import type { ChatMessageItem } from "./agentTypes";

export interface AgentSystemPromptOptions {
  vaultName: string;
  vaultPath?: string;
  allNotePaths: string[];
  allFolderPaths: string[];
}

export const MAX_WORKING_HISTORY_MESSAGES = 8;
export const MAX_TOOL_CONTENT_LENGTH = 1000;

function truncateContent(content?: string): string {
  if (!content) return "";
  if (content.length <= MAX_TOOL_CONTENT_LENGTH) return content;
  return `${content.slice(0, MAX_TOOL_CONTENT_LENGTH)}\n...[truncated for memory optimization]`;
}

export function buildAgentWorkingHistory(
  systemPrompt: string,
  messages: ChatMessageItem[],
): ChatMessage[] {
  // Prune history to sliding window of recent messages per PERFORMANCE.md Rule 3
  const boundedMessages =
    messages.length > MAX_WORKING_HISTORY_MESSAGES
      ? messages.slice(-MAX_WORKING_HISTORY_MESSAGES)
      : messages;

  return [
    { role: "system", content: systemPrompt },
    ...boundedMessages.map((m) => ({
      role: m.role,
      content:
        m.role === "tool" || m.toolCalls?.length
          ? truncateContent(m.content)
          : m.content || "",
      toolCalls: m.toolCalls,
      toolCallId: m.toolCallId,
      name: m.name,
    })),
  ];
}

export function buildAgentSystemPrompt(
  options: AgentSystemPromptOptions,
): string {
  const { vaultName, vaultPath, allNotePaths, allFolderPaths } = options;
  const sampleNotes = allNotePaths.slice(0, 60);
  const remainingCount = allNotePaths.length - sampleNotes.length;

  const notesList =
    allNotePaths.length > 0
      ? `Vault has ${allNotePaths.length} notes across ${allFolderPaths.length} folders.\n` +
        `Available note paths:\n${sampleNotes.map((p) => `- ${p}`).join("\n")}` +
        (remainingCount > 0 ? `\n...and ${remainingCount} more notes.` : "")
      : "The vault currently contains no notes.";

  const pathDesc = vaultPath ? ` at "${vaultPath}"` : "";

  return [
    `You are DaVinci, the personal autonomous AI Agent embedded inside the user's active opened note vault ("${vaultName}"${pathDesc}).`,
    `CRITICAL VAULT ANCHORING & PERMISSIONS:`,
    `- You ALWAYS point to this opened vault workspace. Every file read, search, edit, creation, or organization action MUST target this vault.`,
    `- You have FULL, DEFAULT, UNRESTRICTED PERMISSION to read, inspect, search, and edit notes in this vault.`,
    `- The user has ALREADY authorized you to access all notes in this vault. NEVER ask the user for permission to read or search notes.`,
    `- NEVER ask the user to provide file paths or paste note contents. You have direct access to the vault files listed below.`,
    `- When the user asks questions or mentions characters, topics, tasks, or projects, proactively use search_vault or read_note to consult the notes in this vault before answering.`,
    `- When asked to create notes, folders, directories, kanban boards, or databases, ALWAYS execute the corresponding tool immediately (create_note, create_folder, create_kanban_board, create_database_table).`,
    `- When asked to edit, update, or append to notes, ALWAYS execute edit_note or append_to_note to write changes directly to the opened vault.`,
    `- Never output markdown code blocks showing tool calls. Always execute the real tools directly so items are written to the vault.`,
    `STRICT MINIMAL MUTATION & SINGLE RESPONSIBILITY:`,
    `- When asked to create a folder, execute ONLY create_folder. DO NOT call create_note or populate the folder with placeholder or index files unless explicitly asked.`,
    `- When asked to create a note, create ONLY that specific requested note.`,
    `- When asked to edit, update, or append to a note, execute ONLY edit_note or append_to_note on that specific note. NEVER create auxiliary summary notes, backup files, or changelogs.`,
    `- Never create companion, auxiliary, or extra files unless the user explicitly requested multiple files.`,
    `INTERACTIVE WIDGETS & VISUAL EXPLAINERS:`,
    `- When explaining visual concepts, physics, math, charts, algorithms, or interactive models, emit a self-contained fenced code block with language "widget" (\`\`\`widget ... \`\`\`).`,
    `- Widget code must be strictly self-contained HTML/SVG/JS with NO external CDN scripts, NO remote stylesheets, NO remote images, and NO network calls (fetch/XHR).`,
    `- Use app theme CSS variables: var(--color-bg-primary), var(--color-bg-secondary), var(--color-text-normal), var(--color-text-muted), var(--color-border-subtle), var(--color-text-accent).`,
    `- Keep widgets compact (height ~300-500px). If animated, provide play/pause and reset controls.`,
    `- Always provide prose explanations in the markdown surrounding the widget block.`,
    `CURRENT OPENED VAULT CONTEXT:`,
    notesList,
    `Always be proactive, direct, and operate directly on this opened vault.`,
  ].join("\n\n");
}
