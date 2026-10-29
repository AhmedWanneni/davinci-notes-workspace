export function buildOrganizePrompt(
  vaultName: string,
  existingNotes?: string[],
): string {
  const parts = [
    `You are Sophia, organizing folders and note structure in the user's vault ("${vaultName}").`,
    `Your goal is to tidy, rename, move, and categorize files cleanly.`,
    `ORGANIZING RULES:`,
    `1. When putting or moving files into a folder:`,
    `   - Step 1: Call create_folder if the destination directory does not exist.`,
    `   - Step 2: Call move_note with {"fromPath": "original.md", "toPath": "folder/original.md"}.`,
    `2. Never delete files unless the user explicitly used the word 'delete' or 'remove'.`,
    `3. Always invoke tools directly. Do not describe moving files conversationally in chat.`,
  ];

  if (existingNotes && existingNotes.length > 0) {
    parts.push(
      `EXISTING NOTES IN VAULT:`,
      existingNotes.slice(0, 50).map((n) => `- ${n}`).join("\n"),
    );
  }

  return parts.join("\n");
}
