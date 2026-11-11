import type { VaultMutationBackend } from "@app/ai-agent";

export interface BuildCliAgentPromptOptions {
  vaultName: string;
  vaultPath: string;
  allNotePaths?: string[];
  memoryContext?: string;
  projectName?: string;
  projectInstructions?: string;
  sisterContext?: string;
  projectSources?: string[];
  mutationBackend?: VaultMutationBackend;
  webSearchContext?: string;
  historyTurns?: string;
  promptText: string;
}

export async function buildCliAgentPrompt(
  opts: BuildCliAgentPromptOptions,
): Promise<string> {
  const {
    vaultName,
    vaultPath,
    allNotePaths,
    memoryContext,
    projectName,
    projectInstructions,
    sisterContext,
    projectSources = [],
    mutationBackend,
    webSearchContext,
    historyTurns,
    promptText,
  } = opts;

  const noteList =
    allNotePaths && allNotePaths.length > 0
      ? `Available notes in vault (${allNotePaths.length} notes):\n${allNotePaths
          .slice(0, 60)
          .map((n) => `- ${n}`)
          .join(
            "\n",
          )}${allNotePaths.length > 60 ? `\n...and ${allNotePaths.length - 60} more notes` : ""}`
      : "The vault currently contains no notes.";

  const promptSections: string[] = [];

  promptSections.push(
    `[Active Vault Workspace]\n` +
      `Vault Name: ${vaultName}\n` +
      `Vault Directory Path: ${vaultPath}\n` +
      `You are executing directly inside the user's active local vault directory (${vaultPath}).\n` +
      `${noteList}\n\n` +
      `VAULT INSTRUCTIONS:\n` +
      `- You ALWAYS point to this opened vault workspace. Every file operation targets this vault.\n` +
      `- You have full permission to inspect, read, search, create, and edit notes in this vault directory.\n` +
      `- When answering questions about user notes, characters, stories, ideas, or projects, read the vault files directly.\n` +
      `- When asked to add, create, or update files, folders, or notes, DO NOT merely describe what you would write. You MUST write or edit the actual files in this vault directory immediately so they appear in the vault.\n` +
      `- To guarantee your vault operations are applied and linked in the UI, also emit <vault_action> tags for any folder or note you create/edit/move:\n` +
      `  <vault_action type="create_folder" path="FolderName" />\n` +
      `  <vault_action type="create_note" path="FolderName/Note.md">Markdown content here</vault_action>\n` +
      `  <vault_action type="edit_note" path="FolderName/Note.md">Updated markdown content</vault_action>\n` +
      `  <vault_action type="move_note" from="Old.md" to="FolderName/Old.md" />\n\n` +
      `STRICT MINIMAL MUTATION & SCOPE CONSTRAINTS:\n` +
      `- Exact action only: Only create or update the EXACT file(s) or folder(s) explicitly requested by the user.\n` +
      `- Folder creation: When asked to create a folder, create ONLY that folder (e.g. \`mkdir FolderName\`). NEVER create any note, placeholder file, README.md, index file, or .gitkeep inside that folder unless explicitly asked.\n` +
      `- File creation: When asked to create a file, create ONLY that single file.\n` +
      `- File update: When asked to update, edit, or append to a file, modify ONLY that existing file. NEVER create backup files (e.g. .bak, .old), summary notes, changelog notes, or companion files.\n` +
      `- Forbidden files: NEVER create README.md, index.md, walkthrough.md, implementation_plan.md, scratchpad files, test files, or plan files in the vault.`,
  );

  if (memoryContext && memoryContext.trim()) {
    promptSections.push(
      `[Long-Term Memory & Saved Context]\n${memoryContext.trim()}`,
    );
  }

  if (projectName || projectInstructions?.trim()) {
    const projHeader = projectName ? ` (${projectName})` : "";
    const instr = projectInstructions?.trim() || "";
    if (instr) {
      promptSections.push(`[Project Instructions${projHeader}]\n${instr}`);
    }
  }

  if (sisterContext && sisterContext.trim()) {
    promptSections.push(sisterContext.trim());
  }

  if (projectSources.length > 0 && mutationBackend?.readNote) {
    const sourceTexts: string[] = [];
    for (const src of projectSources.slice(0, 5)) {
      try {
        const raw = await mutationBackend.readNote(src);
        if (raw) sourceTexts.push(`### File: ${src}\n${raw.slice(0, 1500)}`);
      } catch {
        // ignore unreadable sources
      }
    }
    if (sourceTexts.length > 0) {
      promptSections.push(`[Project Sources]\n${sourceTexts.join("\n\n")}`);
    }
  }

  if (webSearchContext && webSearchContext.trim()) {
    promptSections.push(`[Web Search Results]\n${webSearchContext.trim()}`);
  }

  if (historyTurns && historyTurns.trim()) {
    promptSections.push(`[Conversation History]\n${historyTurns.trim()}`);
  }

  promptSections.push(`[Current User Request]\n${promptText}`);

  return promptSections.join("\n\n");
}
