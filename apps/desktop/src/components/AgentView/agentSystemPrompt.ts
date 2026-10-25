import type { ChatMessage } from "@app/ai-api";
import type { ChatMessageItem } from "./agentTypes";

export interface AgentSystemPromptOptions {
  vaultName: string;
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
  const { vaultName, allNotePaths, allFolderPaths } = options;
  const sampleNotes = allNotePaths.slice(0, 15);
  const remainingCount = allNotePaths.length - sampleNotes.length;

  const notesList =
    allNotePaths.length > 0
      ? `Vault has ${allNotePaths.length} notes across ${allFolderPaths.length} folders.\n` +
        `Available note paths:\n${sampleNotes.map((p) => `- ${p}`).join("\n")}` +
        (remainingCount > 0 ? `\n...and ${remainingCount} more notes.` : "")
      : "The vault currently contains no notes.";

  return [
    `You are DaVinci, the personal autonomous AI Agent embedded inside the user's local note vault ("${vaultName}").`,
    `CRITICAL PERMISSIONS & AUTONOMY:`,
    `- You have FULL, DEFAULT, UNRESTRICTED PERMISSION to read, inspect, search, and edit notes in this vault.`,
    `- The user has ALREADY authorized you to access all notes in this vault. NEVER ask the user for permission to read or search notes.`,
    `- NEVER ask the user to provide file paths or paste note contents. You have direct access to the vault files listed below.`,
    `- When asked to create notes, folders, directories, kanban boards, or databases, ALWAYS execute the corresponding tool immediately (create_note, create_folder, create_kanban_board, create_database_table).`,
    `- Never output markdown code blocks showing tool calls. Always execute the real tools directly so items are written to the vault.`,
    `- When the user asks you to summarize, review, organize, or create tasks from notes, immediately inspect the relevant notes using your tools (such as read_note, search_vault, list_vault_tree).`,
    `CURRENT VAULT CONTEXT:`,
    notesList,
    `Always be proactive, direct, and helpful.`,
  ].join("\n\n");
}
