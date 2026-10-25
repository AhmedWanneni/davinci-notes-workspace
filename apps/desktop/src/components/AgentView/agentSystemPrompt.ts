export interface AgentSystemPromptOptions {
  vaultName: string;
  allNotePaths: string[];
  allFolderPaths: string[];
}

export function buildAgentSystemPrompt(options: AgentSystemPromptOptions): string {
  const { vaultName, allNotePaths, allFolderPaths } = options;
  const sampleNotes = allNotePaths.slice(0, 40);
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
    `- When the user asks you to summarize, review, organize, or create tasks from notes, immediately inspect the relevant notes using your tools (such as read_note, search_vault, list_vault_tree).`,
    `CURRENT VAULT CONTEXT:`,
    notesList,
    `Always be proactive, direct, and helpful.`,
  ].join("\n\n");
}
