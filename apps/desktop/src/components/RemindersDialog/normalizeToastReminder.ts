export interface ActiveToastReminder {
  id: number;
  reminderKey?: string;
  notePath: string;
  line: number;
  dueAtUtc: string;
  text: string;
  whatsappClickUrl?: string;
}

export interface RawReminderPayload {
  id: number;
  reminder_key?: string;
  reminderKey?: string;
  note_path?: string;
  notePath?: string;
  line?: number;
  due_at_utc?: string;
  dueAtUtc?: string;
  tz?: string;
  text?: string;
  done?: boolean;
  whatsapp_click_url?: string;
  whatsappClickUrl?: string;
}

/**
 * Normalizes reminder payloads from Tauri IPC events (which may be snake_case
 * from Rust serde or camelCase from frontend interfaces).
 */
export function normalizeReminder(
  raw: RawReminderPayload,
): ActiveToastReminder {
  return {
    id: raw.id,
    reminderKey: raw.reminderKey ?? raw.reminder_key,
    notePath: raw.notePath ?? raw.note_path ?? "",
    line: raw.line ?? 1,
    dueAtUtc: raw.dueAtUtc ?? raw.due_at_utc ?? "",
    text: raw.text ?? "",
    whatsappClickUrl: raw.whatsappClickUrl ?? raw.whatsapp_click_url,
  };
}

/**
 * Merges incoming toast reminders while deduplicating by reminderKey or target tuple.
 */
export function mergeUniqueReminders(
  existing: ActiveToastReminder[],
  incoming: ActiveToastReminder[],
): ActiveToastReminder[] {
  const seen = new Set(
    existing.map(
      (r) => r.reminderKey || `${r.notePath}:${r.line}:${r.dueAtUtc}`,
    ),
  );
  const result = [...existing];
  for (const item of incoming) {
    const key =
      item.reminderKey || `${item.notePath}:${item.line}:${item.dueAtUtc}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(item);
    }
  }
  return result;
}
