import { useState, useCallback, useEffect, useRef } from "react";
import { defaultVaultManager } from "./vaultManager";
import { atomicWriteNote } from "./atomicNoteWriter";
import { defaultVaultIndexer } from "../indexer";
import { scheduleTodoReminder } from "../notifications/todoNotifications";
import { addReminderToGoogleCalendar } from "./googleCalendarService";
import type { MobileReminderEvent } from "../components/todos/types";

const DEFAULT_REMINDERS_PATH = "Reminders/Events.md";
const INITIAL_REMINDERS_CONTENT = `## Events
- [ ] Team Design Sync (@2026-11-13 09:00) [Work]
- [ ] Product Strategy Review (@2026-11-13 14:30) [Work]
- [ ] Conference Keynote (@2026-11-14 10:00) [Events]
- [x] Morning Standup (@2026-11-13 08:30) [Daily]
`;

export interface ReminderMetrics {
  nextTime: string;
  todayCount: number;
  upcomingCount: number;
}

export interface UseVaultRemindersResult {
  reminders: MobileReminderEvent[];
  projects: string[];
  selectedProject: string;
  setSelectedProject: (p: string) => void;
  metrics: ReminderMetrics;
  isLoading: boolean;
  refresh: () => Promise<void>;
  addReminder: (
    title: string,
    dateTime: string,
    project: string,
  ) => Promise<void>;
  toggleReminder: (item: MobileReminderEvent) => Promise<void>;
  deleteReminder: (item: MobileReminderEvent) => Promise<void>;
}

export function useVaultReminders(): UseVaultRemindersResult {
  const [reminders, setReminders] = useState<MobileReminderEvent[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("All");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const loadReminders = useCallback(async () => {
    try {
      setIsLoading(true);
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) {
        setReminders([]);
        return;
      }

      if (!(await adapter.statFile("Reminders")).exists)
        await adapter.createFolder("Reminders");
      if (!(await adapter.statFile(DEFAULT_REMINDERS_PATH)).exists) {
        await atomicWriteNote(
          adapter,
          DEFAULT_REMINDERS_PATH,
          INITIAL_REMINDERS_CONTENT,
        );
      }

      const scan = await adapter.scanVault();
      const relevantNotes = scan.notes.filter(
        (p) => /reminders[/$\\]/i.test(p) || /todos[/$\\]/i.test(p),
      );
      const parsedList: MobileReminderEvent[] = [];

      for (const notePath of relevantNotes) {
        try {
          const file = await adapter.readNote(notePath);
          cacheRef.current.set(notePath, file.content);
          const lines = file.content.split(/\r?\n/);
          lines.forEach((line, lineIndex) => {
            const reminderMatch =
              /@(\d{4}-\d{2}-\d{2}(?:\s+\d{2}:\d{2})?)/.exec(line);
            if (!reminderMatch) return;
            const completed = /^[-*]\s*\[x\]/i.test(line.trim());
            const textMatch =
              /^[-*]\s*\[[ xX]\]\s*(.*?)(?=\s*\(@|\s*\[|$)/.exec(line.trim());
            const title = textMatch ? textMatch[1].trim() : "Untitled Reminder";
            const projectMatch = /\[(.*?)\](?!\()/.exec(
              line.replace(/^[-*]\s*\[[ xX]\]/, ""),
            );
            const defaultProj =
              notePath.replace(/\.md$/i, "").split("/").pop() ?? "Events";
            const project = projectMatch ? projectMatch[1].trim() : defaultProj;
            const dateTime = reminderMatch[1];

            let status: MobileReminderEvent["status"] = "upcoming";
            if (completed) {
              status = "completed";
            } else {
              const itemDate = new Date(dateTime.replace(" ", "T"));
              const now = new Date();
              if (itemDate < now) status = "late";
              else status = "upcoming";
            }

            parsedList.push({
              id: `${notePath}:${lineIndex}`,
              title,
              dateTime,
              project,
              status,
              notePath,
              lineIndex,
            });
          });
        } catch {
          // ignore error reading note
        }
      }

      parsedList.sort((a, b) => a.dateTime.localeCompare(b.dateTime));
      setReminders(parsedList);
    } catch (err) {
      console.warn("[useVaultReminders] Error loading reminders:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const projects = [
    "All",
    ...Array.from(new Set(reminders.map((r) => r.project).filter(Boolean))),
  ];

  const nowStr = new Date().toISOString().slice(0, 10);
  const todayReminders = reminders.filter((r) => r.dateTime.startsWith(nowStr));
  const upcomingReminders = reminders.filter((r) => r.status === "upcoming");
  const nextReminder = upcomingReminders[0];

  const metrics: ReminderMetrics = {
    nextTime: nextReminder
      ? (nextReminder.dateTime.split(" ")[1] ?? "09:00am")
      : "09:00am",
    todayCount: todayReminders.length,
    upcomingCount: upcomingReminders.length,
  };

  const addReminder = useCallback(
    async (title: string, dateTime: string, project: string) => {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      const projClean = project.trim() || "Events";
      const notePath = `Reminders/${projClean}.md`;
      let current = "";
      try {
        current = (await adapter.readNote(notePath)).content;
      } catch {
        current = `## ${projClean}\n`;
      }
      const newLine = `- [ ] ${title.trim()} (@${dateTime}) [${projClean}]\n`;
      const updated = current.endsWith("\n")
        ? current + newLine
        : current + "\n" + newLine;
      cacheRef.current.set(notePath, updated);
      await atomicWriteNote(adapter, notePath, updated);
      void defaultVaultIndexer.indexVault(adapter, false);
      void scheduleTodoReminder(title, dateTime, projClean);
      void addReminderToGoogleCalendar({
        title,
        dateTime,
        project: projClean,
        notePath,
      });
      await loadReminders();
    },
    [loadReminders],
  );

  const toggleReminder = useCallback(
    async (item: MobileReminderEvent) => {
      if (!item.notePath || item.lineIndex === undefined) return;
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      const current =
        cacheRef.current.get(item.notePath) ??
        (await adapter.readNote(item.notePath)).content;
      const lines = current.split(/\r?\n/);
      if (item.lineIndex < lines.length) {
        const line = lines[item.lineIndex];
        const isDone = /^[-*]\s*\[x\]/i.test(line.trim());
        lines[item.lineIndex] = isDone
          ? line.replace(/^([-*]\s*)\[[xX]\]/, "$1[ ]")
          : line.replace(/^([-*]\s*)\[ \]/, "$1[x]");
        const updated = lines.join("\n");
        cacheRef.current.set(item.notePath, updated);
        await atomicWriteNote(adapter, item.notePath, updated);
        void defaultVaultIndexer.indexVault(adapter, false);
        await loadReminders();
      }
    },
    [loadReminders],
  );

  const deleteReminder = useCallback(
    async (item: MobileReminderEvent) => {
      if (!item.notePath || item.lineIndex === undefined) return;
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      const current =
        cacheRef.current.get(item.notePath) ??
        (await adapter.readNote(item.notePath)).content;
      const lines = current.split(/\r?\n/);
      lines.splice(item.lineIndex, 1);
      const updated = lines.join("\n");
      cacheRef.current.set(item.notePath, updated);
      await atomicWriteNote(adapter, item.notePath, updated);
      void defaultVaultIndexer.indexVault(adapter, false);
      await loadReminders();
    },
    [loadReminders],
  );

  useEffect(() => {
    void loadReminders();
  }, [loadReminders]);

  return {
    reminders,
    projects,
    selectedProject,
    setSelectedProject,
    metrics,
    isLoading,
    refresh: loadReminders,
    addReminder,
    toggleReminder,
    deleteReminder,
  };
}
