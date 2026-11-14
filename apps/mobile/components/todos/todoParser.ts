import type { MobileTodoItem, MobileTodoSection } from "./types";

const CHECKBOX_REGEX = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\]\s*)(.*)$/;
const HEADING_REGEX = /^(#{1,6})\s+(.+)$/;
const REMINDER_TOKEN_REGEX = /\(@([^)]+)\)/;
const DURATION_BRACKET_REGEX = /\[(\d+\s*(?:min|mins|hours|h|m))\]/i;
const STREAK_REGEX = /streak\s*(\d+)\s*(?:days)?/i;

function inferIconName(text: string): MobileTodoItem["iconName"] {
  const lower = text.toLowerCase();
  if (lower.includes("water") || lower.includes("drink") || lower.includes("hydration")) return "water";
  if (lower.includes("meditate") || lower.includes("bike") || lower.includes("cycle")) return "bicycle";
  if (lower.includes("stretch") || lower.includes("yoga") || lower.includes("gym")) return "stretch";
  if (lower.includes("walk") || lower.includes("run") || lower.includes("step") || lower.includes("jog")) return "walk";
  if (lower.includes("read") || lower.includes("book") || lower.includes("study")) return "book";
  return "check";
}

export function parseTodosFromMarkdown(
  content: string,
  notePath?: string,
  project?: string,
): MobileTodoSection[] {
  const lines = content.split(/\r?\n/);
  const sections: MobileTodoSection[] = [];
  let currentSection: MobileTodoSection = { name: "Daily routine", todos: [] };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const headingMatch = HEADING_REGEX.exec(line);
    if (headingMatch) {
      if (currentSection.todos.length > 0) {
        sections.push(currentSection);
      }
      currentSection = { name: headingMatch[2].trim(), todos: [] };
      continue;
    }

    const checkMatch = CHECKBOX_REGEX.exec(line);
    if (!checkMatch) continue;

    const completed = checkMatch[2].toLowerCase() === "x";
    let rawText = checkMatch[4].trim();

    // Extract reminder (@YYYY-MM-DD HH:mm)
    let reminder: string | undefined;
    let dueDate: string | undefined;
    const remMatch = REMINDER_TOKEN_REGEX.exec(rawText);
    if (remMatch) {
      reminder = remMatch[1].trim();
      const datePart = reminder.split(" ")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        dueDate = datePart;
      }
      rawText = rawText.replace(REMINDER_TOKEN_REGEX, "").trim();
    }

    // Extract duration [5 min]
    let duration: string | undefined;
    const durationMatch = DURATION_BRACKET_REGEX.exec(rawText);
    if (durationMatch) {
      duration = durationMatch[1].trim();
      rawText = rawText.replace(DURATION_BRACKET_REGEX, "").trim();
    }

    // Extract streak
    let streakDays: number | undefined;
    const streakMatch = STREAK_REGEX.exec(rawText);
    if (streakMatch) {
      streakDays = parseInt(streakMatch[1], 10);
      rawText = rawText.replace(STREAK_REGEX, "").trim();
    }

    const cleanText = rawText.replace(/\s+/g, " ").trim();
    const iconName = inferIconName(cleanText);

    currentSection.todos.push({
      id: notePath ? `${notePath}#L${i + 1}` : `line-${i + 1}`,
      text: cleanText || "Task",
      completed,
      lineIndex: i,
      section: currentSection.name,
      reminder,
      duration: duration ?? "5 min",
      streakDays: streakDays ?? (i % 3 + 3),
      iconName,
      notePath,
      project: project ?? (notePath ? notePath.replace(/\.md$/i, "").split("/")[0] : undefined),
      dueDate,
    });
  }

  if (currentSection.todos.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

export function toggleTodoInMarkdown(content: string, lineIndex: number, completed: boolean): string {
  const lines = content.split(/\r?\n/);
  if (lineIndex < 0 || lineIndex >= lines.length) return content;
  const line = lines[lineIndex];
  const nextLine = line.replace(CHECKBOX_REGEX, (_match, prefix, _mark, suffix, rest) => {
    return `${prefix}${completed ? "x" : " "}${suffix}${rest}`;
  });
  lines[lineIndex] = nextLine;
  return lines.join("\n");
}

export function removeTodoFromMarkdown(content: string, lineIndex: number): string {
  const lines = content.split(/\r?\n/);
  if (lineIndex < 0 || lineIndex >= lines.length) return content;
  lines.splice(lineIndex, 1);
  return lines.join("\n");
}

export function appendTodoToMarkdown(
  content: string,
  sectionName: string,
  text: string,
  duration?: string,
  reminder?: string,
): string {
  const lines = content.split(/\r?\n/);
  let sectionIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = HEADING_REGEX.exec(lines[i]);
    if (headingMatch && headingMatch[2].trim().toLowerCase() === sectionName.trim().toLowerCase()) {
      sectionIndex = i;
      break;
    }
  }

  let formattedLine = `- [ ] ${text.trim()}`;
  if (duration) formattedLine += ` [${duration}]`;
  if (reminder) formattedLine += ` (@${reminder})`;

  if (sectionIndex === -1) {
    const prefix = content.trim().length > 0 ? `${content.trimEnd()}\n\n` : "";
    return `${prefix}## ${sectionName}\n${formattedLine}\n`;
  }

  let insertAt = lines.length;
  for (let i = sectionIndex + 1; i < lines.length; i++) {
    if (HEADING_REGEX.test(lines[i])) {
      insertAt = i;
      break;
    }
  }

  lines.splice(insertAt, 0, formattedLine);
  return lines.join("\n");
}
