import { advanceRecurringReminder } from "@app/indexer";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { readNote, statNote } from "./vaultCommands";
import { writeAndIndexNote } from "./performSaveNote";

export interface ReminderTaskTarget {
  line?: number;
  text: string;
  dueAtUtc?: string;
}

const CHECKBOX_PATTERN = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\].*)$/;

function findTargetLineIndex(lines: string[], target: ReminderTaskTarget): number {
  if (
    target.line !== undefined &&
    target.line >= 1 &&
    target.line <= lines.length
  ) {
    const candidate = lines[target.line - 1];
    if (CHECKBOX_PATTERN.test(candidate) && candidate.includes(target.text)) {
      return target.line - 1;
    }
  }
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (CHECKBOX_PATTERN.test(line) && line.includes(target.text)) {
      return i;
    }
  }
  return -1;
}

/**
 * Toggles a reminder checklist item in Markdown content between `[ ]` and `[x]`.
 * If the reminder has a recurrence rule and is marked done, rolls the due date
 * forward in-place and leaves the checkbox unchecked.
 */
export function toggleReminderInMarkdown(
  content: string,
  target: ReminderTaskTarget,
  done: boolean,
): string {
  const isCrlf = content.includes("\r\n");
  const eol = isCrlf ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  const targetIndex = findTargetLineIndex(lines, target);
  if (targetIndex === -1) return content;

  const line = lines[targetIndex];

  if (done) {
    const tokenMatch = /\(@([^)]+)\)/.exec(line);
    if (tokenMatch && tokenMatch[1].includes("/")) {
      const rawToken = tokenMatch[1].trim();
      const dateMatch = /^(\d{4}-\d{2}-\d{2})/.exec(rawToken);
      const slashIdx = rawToken.indexOf("/");
      if (dateMatch && slashIdx !== -1) {
        const dateStr = dateMatch[1];
        const rest = rawToken.slice(dateMatch[0].length, slashIdx).trim();
        let timeStr: string | null = null;
        const timeMatch = /^(\d{1,2}:\d{2}(?::\d{2})?)/.exec(rest);
        if (timeMatch) timeStr = timeMatch[1];

        const recurrence = rawToken.slice(slashIdx + 1).trim();
        const advanced = advanceRecurringReminder(dateStr, timeStr, recurrence);
        if (advanced) {
          lines[targetIndex] = line.replace(
            tokenMatch[0],
            advanced.nextTokenStr,
          );
          return lines.join(eol);
        }
      }
    }
  }

  const newMark = done ? "x" : " ";
  lines[targetIndex] = line.replace(CHECKBOX_PATTERN, `$1${newMark}$3`);
  return lines.join(eol);
}

/**
 * Updates a reminder line text and due date token in Markdown content.
 */
export function editReminderInMarkdown(
  content: string,
  oldTarget: ReminderTaskTarget,
  newDetails: { text: string; dueToken: string },
): string {
  const isCrlf = content.includes("\r\n");
  const eol = isCrlf ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  const idx = findTargetLineIndex(lines, oldTarget);
  if (idx === -1) return content;

  const line = lines[idx];
  const checkboxMatch = CHECKBOX_PATTERN.exec(line);
  if (!checkboxMatch) return content;

  const prefix = `${checkboxMatch[1]}${checkboxMatch[2]}] `;
  lines[idx] = `${prefix}${newDetails.text} (${newDetails.dueToken})`;
  return lines.join(eol);
}

/**
 * Removes a reminder task line from Markdown content.
 */
export function deleteReminderInMarkdown(
  content: string,
  target: ReminderTaskTarget,
): string {
  const isCrlf = content.includes("\r\n");
  const eol = isCrlf ? "\r\n" : "\n";
  const lines = content.split(/\r?\n/);
  const idx = findTargetLineIndex(lines, target);
  if (idx === -1) return content;

  lines.splice(idx, 1);
  return lines.join(eol);
}

/**
 * Appends a new reminder task to Markdown content.
 */
export function addReminderToMarkdown(
  content: string,
  details: { text: string; dueToken: string },
): string {
  const isCrlf = content.includes("\r\n");
  const eol = isCrlf ? "\r\n" : "\n";
  const line = `- [ ] ${details.text} (${details.dueToken})`;
  if (!content.trim()) return line;
  return `${content.trimEnd()}${eol}${line}${eol}`;
}

async function applyAndSaveNote(
  notePath: string,
  transform: (content: string) => string,
): Promise<void> {
  const store = useWorkspaceStore.getState();
  const currentContent = store.notesContent[notePath];

  if (currentContent !== undefined) {
    const updated = transform(currentContent);
    if (updated !== currentContent) {
      store.updateNoteContent(notePath, updated);
      await store.saveNoteNow(notePath);
    }
    return;
  }

  let existing = "";
  try {
    const stat = await statNote(notePath);
    if (stat.exists) {
      existing = (await readNote(notePath)).content;
    }
  } catch {
    existing = "";
  }
  const updated = transform(existing);
  if (updated !== existing) {
    const allNotePaths = store.allNotePaths.includes(notePath)
      ? store.allNotePaths
      : [...store.allNotePaths, notePath];
    await writeAndIndexNote(
      notePath,
      updated,
      {
        allNotePaths,
        graph: store.graph,
        tagIndex: store.tagIndex,
      },
      useWorkspaceStore.setState,
    );
  }
}

/**
 * Persists reminder checkbox toggle to the note file on disk and updates index.
 */
export async function markReminderDoneInVault(
  notePath: string,
  target: ReminderTaskTarget,
  done = true,
): Promise<void> {
  await applyAndSaveNote(notePath, (c) => toggleReminderInMarkdown(c, target, done));
}

/**
 * Persists reminder line edits to the note file on disk and updates index.
 */
export async function editReminderInVault(
  notePath: string,
  oldTarget: ReminderTaskTarget,
  newDetails: { text: string; dueToken: string },
): Promise<void> {
  await applyAndSaveNote(notePath, (c) => editReminderInMarkdown(c, oldTarget, newDetails));
}

/**
 * Deletes a reminder task line from the note file on disk and updates index.
 */
export async function deleteReminderInVault(
  notePath: string,
  target: ReminderTaskTarget,
): Promise<void> {
  await applyAndSaveNote(notePath, (c) => deleteReminderInMarkdown(c, target));
}

/**
 * Appends a reminder line to the note file on disk and updates index.
 */
export async function addReminderToVaultNote(
  notePath: string,
  details: { text: string; dueToken: string },
): Promise<void> {
  await applyAndSaveNote(notePath, (c) => addReminderToMarkdown(c, details));
}
