import type { TodoSection } from "./types";

const CHECKBOX_REGEX = /^(\s*(?:[-*+]|\d+[.)])\s+\[)([ xX])(\]\s*)(.*)$/;
const HEADING_REGEX = /^(#{1,6})\s+(.+)$/;
const REMINDER_TOKEN_REGEX = /\(@([^)]+)\)/;
const BRACKET_DATE_REGEX = /\[(\d{1,2}\s+[A-Za-z]{3}|[A-Za-z]{3}\s+\d{1,2})\]/;
const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/;
const SUBTASK_COUNT_REGEX = /\[:=\s*(\d+)\]/;
const LABEL_PAREN_REGEX = /\(([A-Z][A-Za-z0-9_-]+)\)/;

export function parseNoteTodos(
  content: string,
  notePath: string,
  workspace = "Default",
  project = "General",
): TodoSection[] {
  const lines = content.split(/\r?\n/);
  const sections: TodoSection[] = [];
  let currentSection: TodoSection = { name: "General", todos: [] };

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

    // Extract reminder
    const remMatch = REMINDER_TOKEN_REGEX.exec(rawText);
    const hasReminder = Boolean(remMatch);

    // Extract due date and month
    let dueDate: string | undefined;
    let month: string | undefined;
    if (remMatch) {
      const token = remMatch[1].trim();
      const datePart = token.split(" ")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        dueDate = datePart;
        month = datePart.slice(0, 7); // e.g. "2026-11"
      }
    }

    const bracketDateMatch = BRACKET_DATE_REGEX.exec(rawText);
    if (bracketDateMatch) {
      dueDate = dueDate ?? bracketDateMatch[1];
      const monthNameMatch = /[A-Za-z]{3}/.exec(bracketDateMatch[1]);
      if (monthNameMatch && !month) {
        month = monthNameMatch[0];
      }
      rawText = rawText.replace(bracketDateMatch[0], "").trim();
    }

    // Extract wikilink
    let linkedNotePath: string | undefined;
    const wikiMatch = WIKILINK_REGEX.exec(rawText);
    if (wikiMatch) {
      linkedNotePath = wikiMatch[1];
    }

    // Extract subtasks count
    let subtasksCount: number | undefined;
    const subtaskMatch = SUBTASK_COUNT_REGEX.exec(rawText);
    if (subtaskMatch) {
      subtasksCount = parseInt(subtaskMatch[1], 10);
      rawText = rawText.replace(subtaskMatch[0], "").trim();
    }

    // Extract label
    let label: string | undefined;
    const labelMatch = LABEL_PAREN_REGEX.exec(rawText);
    if (labelMatch) {
      label = labelMatch[1];
    }

    const cleanText = rawText
      .replace(REMINDER_TOKEN_REGEX, "")
      .replace(WIKILINK_REGEX, "")
      .replace(LABEL_PAREN_REGEX, "")
      .trim();

    currentSection.todos.push({
      id: `${notePath}#L${i + 1}`,
      text: cleanText || rawText,
      completed,
      notePath,
      lineIndex: i,
      section: currentSection.name,
      workspace,
      project,
      dueDate,
      month,
      linkedNotePath,
      subtasksCount,
      label,
      hasReminder,
    });
  }

  if (currentSection.todos.length > 0) {
    sections.push(currentSection);
  }

  return sections;
}

export function toggleTodoInContent(content: string, lineIndex: number, completed: boolean): string {
  const lines = content.split(/\r?\n/);
  if (lineIndex < 0 || lineIndex >= lines.length) return content;
  const line = lines[lineIndex];
  const nextLine = line.replace(CHECKBOX_REGEX, (_match, prefix, _mark, suffix, rest) => {
    return `${prefix}${completed ? "x" : " "}${suffix}${rest}`;
  });
  lines[lineIndex] = nextLine;
  return lines.join("\n");
}

export function updateTodoTextInContent(content: string, lineIndex: number, newText: string): string {
  const lines = content.split(/\r?\n/);
  if (lineIndex < 0 || lineIndex >= lines.length) return content;
  const line = lines[lineIndex];
  const match = CHECKBOX_REGEX.exec(line);
  if (!match) return content;
  lines[lineIndex] = `${match[1]}${match[2]}${match[3]}${newText.trim()}`;
  return lines.join("\n");
}

export function addLinkToTodoInContent(content: string, lineIndex: number, noteName: string): string {
  const lines = content.split(/\r?\n/);
  if (lineIndex < 0 || lineIndex >= lines.length) return content;
  const line = lines[lineIndex];
  if (line.includes(`[[${noteName}]]`)) return content;
  lines[lineIndex] = `${line.trimEnd()} [[${noteName}]]`;
  return lines.join("\n");
}

export function addReminderToTodoInContent(content: string, lineIndex: number, dateStr: string): string {
  const lines = content.split(/\r?\n/);
  if (lineIndex < 0 || lineIndex >= lines.length) return content;
  let line = lines[lineIndex];
  if (REMINDER_TOKEN_REGEX.test(line)) {
    line = line.replace(REMINDER_TOKEN_REGEX, `(@${dateStr})`);
  } else {
    line = `${line.trimEnd()} (@${dateStr})`;
  }
  lines[lineIndex] = line;
  return lines.join("\n");
}

export function appendTodoToSectionInContent(content: string, sectionName: string, text: string): string {
  const lines = content.split(/\r?\n/);
  let sectionIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    const headingMatch = HEADING_REGEX.exec(lines[i]);
    if (headingMatch && headingMatch[2].trim().toLowerCase() === sectionName.trim().toLowerCase()) {
      sectionIndex = i;
      break;
    }
  }

  const newTodoLine = `- [ ] ${text.trim()}`;

  if (sectionIndex === -1) {
    // Append new section and todo at bottom
    return `${content.trimEnd()}\n\n## ${sectionName}\n${newTodoLine}\n`;
  }

  // Find end of section (next heading or end of file)
  let insertAt = lines.length;
  for (let i = sectionIndex + 1; i < lines.length; i++) {
    if (HEADING_REGEX.test(lines[i])) {
      insertAt = i;
      break;
    }
  }

  lines.splice(insertAt, 0, newTodoLine);
  return lines.join("\n");
}
