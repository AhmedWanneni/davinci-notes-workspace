import type { NormalizedCalendarEvent } from "@app/google-calendar-api";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { createNoteInVault } from "../vault/createNoteInVault";
import { readNote, writeNote } from "../vault/vaultCommands";
import {
  buildMeetingNotePath,
  generateMeetingNoteMarkdown,
  isEventNoteMatch,
  linkMeetingInDailyNote,
  getMeetingDateString,
  type MeetingNoteOptions,
} from "./meetingNoteGenerator";

/**
 * Creates a meeting note for the event, or opens it if already present.
 * Also appends a backlink to the meeting note inside the corresponding daily note if it exists.
 */
export async function createOrOpenMeetingNote(
  event: NormalizedCalendarEvent,
  options?: MeetingNoteOptions,
): Promise<string> {
  const store = useWorkspaceStore.getState();
  const { allNotePaths, notesContent, openNote, setIsCalendarOpen } = store;

  // 1. Idempotency Check: look through loaded notes for matching event ID
  for (const [path, content] of Object.entries(notesContent)) {
    if (isEventNoteMatch(content, event.id)) {
      await openNote(path);
      setIsCalendarOpen(false);
      return path;
    }
  }

  // Check expected path
  const preferredPath = buildMeetingNotePath(event, options?.meetingsFolder);
  if (allNotePaths.includes(preferredPath)) {
    try {
      const file = await readNote(preferredPath);
      if (isEventNoteMatch(file.content, event.id)) {
        await openNote(preferredPath);
        setIsCalendarOpen(false);
        return preferredPath;
      }
    } catch {
      // File read error; continue with unique path allocation
    }
  }

  // 2. Generate content & write to vault
  const markdown = generateMeetingNoteMarkdown(event, options);
  let targetPath = preferredPath;
  let counter = 1;
  while (allNotePaths.includes(targetPath)) {
    const withoutExt = preferredPath.replace(/\.md$/i, "");
    targetPath = `${withoutExt} (${counter++}).md`;
  }

  await createNoteInVault(targetPath, markdown);

  // 3. Daily note linking
  const dateStr = getMeetingDateString(event);
  const dailyPath = options?.dailyNotesFolder
    ? `${options.dailyNotesFolder.replace(/^\/+|\/+$/g, "")}/${dateStr}.md`
    : `${dateStr}.md`;

  if (allNotePaths.includes(dailyPath)) {
    try {
      const dailyContent =
        notesContent[dailyPath] ?? (await readNote(dailyPath)).content;
      const updatedDaily = linkMeetingInDailyNote(
        dailyContent,
        targetPath,
        event.title,
      );
      if (updatedDaily !== dailyContent) {
        await writeNote(dailyPath, updatedDaily);
        store.updateNoteContent(dailyPath, updatedDaily);
      }
    } catch (e) {
      console.warn(
        `[calendar] Could not cross-link meeting in daily note ${dailyPath}:`,
        e,
      );
    }
  }

  // 4. Open note & close calendar view
  await openNote(targetPath);
  setIsCalendarOpen(false);
  return targetPath;
}
