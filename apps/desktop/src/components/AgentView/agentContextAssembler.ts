import type { MentionItem } from "./agentTypes";
import { readNote } from "../../vault";

export const MAX_NOTE_TOKENS = 24_000;
export const MAX_FOLDER_TOKENS = 32_000;
export const CHARS_PER_TOKEN = 4;

export const MAX_NOTE_CHARS = MAX_NOTE_TOKENS * CHARS_PER_TOKEN; // 96,000
export const MAX_FOLDER_CHARS = MAX_FOLDER_TOKENS * CHARS_PER_TOKEN; // 128,000

export interface ContextAssemblerOptions {
  allNotePaths?: string[];
  readNoteFn?: (path: string) => Promise<{ content: string } | null>;
}

export async function assembleContextAttachments(
  mentions: MentionItem[],
  options?: ContextAssemblerOptions,
): Promise<string> {
  if (!mentions || mentions.length === 0) return "";

  const readFn =
    options?.readNoteFn ??
    (async (p: string) => {
      try {
        return await readNote(p);
      } catch {
        return null;
      }
    });

  const blocks: string[] = [];

  for (const item of mentions) {
    if (item.type === "file" || item.type === "current") {
      const file = await readFn(item.path);
      if (file && typeof file.content === "string") {
        let content = file.content;
        if (content.length > MAX_NOTE_CHARS) {
          content =
            content.slice(0, MAX_NOTE_CHARS) +
            "\n\n[... Truncated: note exceeds 24,000 token limit ...]";
        }
        blocks.push(`<note path="${item.path}">\n${content}\n</note>`);
      }
    } else if (item.type === "folder") {
      const folderPrefix = item.path.endsWith("/")
        ? item.path
        : `${item.path}/`;
      const allPaths = options?.allNotePaths ?? [];
      const matchingNotes = allPaths.filter((p) => p.startsWith(folderPrefix));

      const treeLines = matchingNotes.map(
        (p) => `- ${p.slice(folderPrefix.length)}`,
      );
      const treeSection = `<directory_tree>\n${treeLines.join("\n") || "(empty)"}\n</directory_tree>`;

      let folderBudgetChars = MAX_FOLDER_CHARS - treeSection.length;
      const fileSections: string[] = [];
      const topNotes = matchingNotes.slice(0, 5);

      for (const notePath of topNotes) {
        if (folderBudgetChars <= 500) break;
        const file = await readFn(notePath);
        if (file && typeof file.content === "string") {
          let fileContent = file.content;
          if (fileContent.length > folderBudgetChars) {
            fileContent =
              fileContent.slice(0, folderBudgetChars) +
              "\n\n[... Truncated due to folder token limit ...]";
          }
          folderBudgetChars -= fileContent.length;
          fileSections.push(
            `<file path="${notePath}">\n${fileContent}\n</file>`,
          );
        }
      }

      blocks.push(
        `<folder path="${folderPrefix}">\n${treeSection}\n<files>\n${fileSections.join("\n")}\n</files>\n</folder>`,
      );
    }
  }

  if (blocks.length === 0) return "";
  return `<context_attachments>\n${blocks.join("\n\n")}\n</context_attachments>`;
}
