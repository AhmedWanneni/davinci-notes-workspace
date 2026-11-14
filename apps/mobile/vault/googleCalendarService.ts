import { defaultSecureTokenStore } from "../sync/secureTokenStore";

export interface GoogleCalendarEventInput {
  title: string;
  dateTime: string; // e.g. "2025-05-13 09:00" or ISO string
  project?: string;
  notePath?: string;
}

export interface GoogleCalendarEventResult {
  success: boolean;
  eventId?: string;
  htmlLink?: string;
  skipped?: boolean;
  error?: string;
}

export function parseEventDates(dateTimeStr: string): {
  startIso: string;
  endIso: string;
  timeZone: string;
} {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  let startDate: Date;

  if (dateTimeStr.includes("T")) {
    startDate = new Date(dateTimeStr);
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateTimeStr.trim())) {
    startDate = new Date(`${dateTimeStr.trim()}T09:00:00`);
  } else if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}/.test(dateTimeStr.trim())) {
    const formatted = dateTimeStr.trim().replace(/\s+/, "T");
    startDate = new Date(
      formatted.length === 16 ? `${formatted}:00` : formatted,
    );
  } else {
    startDate = new Date();
    startDate.setHours(startDate.getHours() + 1);
  }

  if (Number.isNaN(startDate.getTime())) {
    startDate = new Date();
  }

  const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // 1 hour duration

  return {
    startIso: startDate.toISOString(),
    endIso: endDate.toISOString(),
    timeZone,
  };
}

export async function addReminderToGoogleCalendar(
  input: GoogleCalendarEventInput,
): Promise<GoogleCalendarEventResult> {
  try {
    const token = await defaultSecureTokenStore.load();
    if (!token?.accessToken) {
      return {
        success: false,
        skipped: true,
        error: "Google account not authenticated",
      };
    }

    const { startIso, endIso, timeZone } = parseEventDates(input.dateTime);

    const eventPayload = {
      summary: input.title,
      description: `Project: ${input.project || "Events"}\nCreated from DaVinci Notes${
        input.notePath ? ` (${input.notePath})` : ""
      }`,
      start: {
        dateTime: startIso,
        timeZone,
      },
      end: {
        dateTime: endIso,
        timeZone,
      },
      reminders: {
        useDefault: true,
      },
    };

    const response = await fetch(
      "https://www.googleapis.com/calendar/v3/calendars/primary/events",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(eventPayload),
      },
    );

    if (!response.ok) {
      const errBody = (await response.json().catch(() => ({}))) as {
        error?: { message?: string };
      };
      return {
        success: false,
        error:
          errBody.error?.message ||
          `Google Calendar API error: ${response.status}`,
      };
    }

    const created = (await response.json()) as {
      id?: string;
      htmlLink?: string;
    };

    return {
      success: true,
      eventId: created.id,
      htmlLink: created.htmlLink,
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
