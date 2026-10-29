export interface TaskItemDef {
  text: string;
  done?: boolean;
  dueAtUtc?: string;
  recurrence?: string;
}

export interface TaskListNoteOptions {
  title?: string;
  tasks: TaskItemDef[];
  heading?: string;
}

function formatReminderToken(dueAtUtc: string): string {
  try {
    const d = new Date(dueAtUtc);
    if (Number.isNaN(d.getTime())) return "";
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    const h = String(d.getUTCHours()).padStart(2, "0");
    const min = String(d.getUTCMinutes()).padStart(2, "0");
    return h === "00" && min === "00" ? `(@${y}-${m}-${day})` : `(@${y}-${m}-${day} ${h}:${min})`;
  } catch {
    return "";
  }
}

export function generateTaskListMarkdown(options: TaskListNoteOptions): string {
  const lines: string[] = [];

  if (options.title) {
    lines.push(`# ${options.title}`, "");
  }
  if (options.heading) {
    lines.push(`## ${options.heading}`, "");
  }

  for (const t of options.tasks) {
    const mark = t.done ? "[x]" : "[ ]";
    const token = t.dueAtUtc ? formatReminderToken(t.dueAtUtc) : "";
    const recToken = t.recurrence ? `[repeat: ${t.recurrence}]` : "";
    const parts = [
      `- ${mark} ${t.text.trim()}`,
      token,
      recToken,
    ].filter(Boolean);
    lines.push(parts.join(" "));
  }

  lines.push("");
  return lines.join("\n");
}
