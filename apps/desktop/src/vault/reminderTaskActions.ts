import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { readNote } from "./vaultCommands";
import { writeAndIndexNote } from "./performSaveNote";

export interface ReminderTaskTarget {
  line?: number;
  text: string;
  dueAtUtc?: string;
}

const CHECKBOX_PATTERN = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\].*)$/;

/**
 * Toggles a reminder checklist item in Markdown content between `[ ]` and `[x]`.
 * Matches by line number with fallback to task text matching.
 */
export function toggleReminderInMarkdown(
  content: string,
  target: ReminderTaskTarget,
  done: boolean,
): string {
  const isCrlf = content.includes("\r\n");
  const eol = isCrlf ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);

  let targetIndex = -1;

  // 1. Try 0-based index from target.line
  if (
    target.line !== undefined &&
    target.line >= 1 &&
    target.line <= lines.length
  ) {
    const candidate = lines[target.line - 1];
    if (CHECKBOX_PATTERN.test(candidate) && candidate.includes(target.text)) {
      targetIndex = target.line - 1;
    }
  }

  // 2. Fallback: Search lines for task containing text and checklist checkbox
  if (targetIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (CHECKBOX_PATTERN.test(line) && line.includes(target.text)) {
        targetIndex = i;
        break;
      }
    }
  }

  if (targetIndex === -1) {
    return content;
  }

  const line = lines[targetIndex];
  const newMark = done ? "x" : " ";
  lines[targetIndex] = line.replace(CHECKBOX_PATTERN, `$1${newMark}$3`);

  return lines.join(eol);
}

/**
 * Persists reminder checkbox toggle to the note file on disk and updates index.
 */
export async function markReminderDoneInVault(
  notePath: string,
  target: ReminderTaskTarget,
  done = true,
): Promise<void> {
  const store = useWorkspaceStore.getState();
  const currentContent = store.notesContent[notePath];

  if (currentContent !== undefined) {
    const updated = toggleReminderInMarkdown(currentContent, target, done);
    if (updated !== currentContent) {
      store.updateNoteContent(notePath, updated);
      await store.saveNoteNow(notePath);
    }
    return;
  }

  // Note not currently loaded in memory: read from disk and write
  const file = await readNote(notePath);
  const updated = toggleReminderInMarkdown(file.content, target, done);
  if (updated !== file.content) {
    await writeAndIndexNote(
      notePath,
      updated,
      {
        allNotePaths: store.allNotePaths,
        graph: store.graph,
        tagIndex: store.tagIndex,
      },
      useWorkspaceStore.setState,
    );
  }
}
