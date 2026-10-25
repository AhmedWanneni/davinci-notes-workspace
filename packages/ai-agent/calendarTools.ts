import type { AgentToolDefinition } from "@app/ai-api";
import type { NormalizedCalendarEvent } from "@app/google-calendar-api";

export interface AgentCalendarBackend {
  listEvents(timeMin?: string, timeMax?: string, calendarId?: string): Promise<NormalizedCalendarEvent[]>;
  createEvent(input: {
    summary: string;
    startIso: string;
    endIso: string;
    description?: string;
    location?: string;
    calendarId?: string;
  }): Promise<NormalizedCalendarEvent>;
}

export const CALENDAR_LIST_EVENTS_TOOL: AgentToolDefinition = {
  name: "calendar_list_events",
  description: "List upcoming events from Google Calendar within a given time range",
  parameters: {
    type: "object",
    properties: {
      timeMin: { type: "string", description: "Start time filter (ISO format, e.g. 2026-10-25T00:00:00Z)" },
      timeMax: { type: "string", description: "End time filter (ISO format, e.g. 2026-11-01T23:59:59Z)" },
      calendarId: { type: "string", description: "Calendar identifier (default: primary)" },
    },
  },
};

export const CALENDAR_CREATE_EVENT_TOOL: AgentToolDefinition = {
  name: "calendar_create_event",
  description: "Create a calendar event in Google Calendar",
  parameters: {
    type: "object",
    properties: {
      summary: { type: "string", description: "Title of the calendar event" },
      startIso: { type: "string", description: "Event start datetime in ISO format (e.g. 2026-10-26T10:00:00Z)" },
      endIso: { type: "string", description: "Event end datetime in ISO format (e.g. 2026-10-26T11:00:00Z)" },
      description: { type: "string", description: "Optional description or meeting notes" },
      location: { type: "string", description: "Optional location or virtual link" },
      calendarId: { type: "string", description: "Calendar identifier (default: primary)" },
    },
    required: ["summary", "startIso", "endIso"],
  },
};

export const CALENDAR_SYNC_TASKS_TOOL: AgentToolDefinition = {
  name: "calendar_sync_tasks",
  description: "Extract scheduled tasks with reminder tokens (@YYYY-MM-DD HH:mm) from note content and create Google Calendar events",
  parameters: {
    type: "object",
    properties: {
      noteContent: { type: "string", description: "Markdown note content containing checklist tasks" },
      calendarId: { type: "string", description: "Target calendar ID (default: primary)" },
    },
    required: ["noteContent"],
  },
};

export interface ExtractedTaskReminder {
  text: string;
  startIso: string;
  endIso: string;
}

const REMINDER_REGEX = /- \[[ xX]\]\s+(.*?)\s+\(@(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?\)/g;

export function extractTaskReminders(markdown: string): ExtractedTaskReminder[] {
  const tasks: ExtractedTaskReminder[] = [];
  let match: RegExpExecArray | null;

  while ((match = REMINDER_REGEX.exec(markdown)) !== null) {
    const rawText = match[1].replace(/\[repeat:[^\]]+\]/g, "").trim();
    const datePart = match[2];
    const timePart = match[3] || "09:00";

    const start = new Date(`${datePart}T${timePart}:00Z`);
    if (isNaN(start.getTime())) continue;

    const end = new Date(start.getTime() + 60 * 60 * 1000); // 1-hour default event duration
    tasks.push({
      text: rawText,
      startIso: start.toISOString(),
      endIso: end.toISOString(),
    });
  }

  return tasks;
}

export async function executeCalendarListEvents(
  args: Record<string, unknown>,
  backend: AgentCalendarBackend,
): Promise<{ events: NormalizedCalendarEvent[] }> {
  const timeMin = args.timeMin ? String(args.timeMin) : undefined;
  const timeMax = args.timeMax ? String(args.timeMax) : undefined;
  const calendarId = args.calendarId ? String(args.calendarId) : "primary";

  const events = await backend.listEvents(timeMin, timeMax, calendarId);
  return { events };
}

export async function executeCalendarCreateEvent(
  args: Record<string, unknown>,
  backend: AgentCalendarBackend,
): Promise<NormalizedCalendarEvent> {
  const summary = String(args.summary ?? "").trim();
  const startIso = String(args.startIso ?? "").trim();
  const endIso = String(args.endIso ?? "").trim();

  if (!summary) throw new Error("calendar_create_event: summary is required");
  if (!startIso || !endIso) throw new Error("calendar_create_event: startIso and endIso are required");

  return backend.createEvent({
    summary,
    startIso,
    endIso,
    description: args.description ? String(args.description) : undefined,
    location: args.location ? String(args.location) : undefined,
    calendarId: args.calendarId ? String(args.calendarId) : "primary",
  });
}

export async function executeCalendarSyncTasks(
  args: Record<string, unknown>,
  backend: AgentCalendarBackend,
): Promise<{ createdCount: number; events: NormalizedCalendarEvent[] }> {
  const content = String(args.noteContent ?? "");
  const calendarId = args.calendarId ? String(args.calendarId) : "primary";
  const tasks = extractTaskReminders(content);

  const createdEvents: NormalizedCalendarEvent[] = [];
  for (const t of tasks) {
    const event = await backend.createEvent({
      summary: t.text,
      startIso: t.startIso,
      endIso: t.endIso,
      description: `Task reminder scheduled from DaVinci Notes`,
      calendarId,
    });
    createdEvents.push(event);
  }

  return {
    createdCount: createdEvents.length,
    events: createdEvents,
  };
}
