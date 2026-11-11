function formatYamlScalar(value: unknown): string {
  if (value === null || value === undefined || value === "") return '""';
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  const str = String(value);
  if (/[:#[\]{}&*!|>'"%@`]|^\s|\s$/.test(str)) {
    return JSON.stringify(str);
  }
  return str;
}

function formatPropertyYamlLine(key: string, value: unknown): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return `${key}: []`;
    return `${key}: [${value.map((item) => formatYamlScalar(item)).join(", ")}]`;
  }
  return `${key}: ${formatYamlScalar(value)}`;
}

export function parsePropertyInputValue(rawValue: string): unknown {
  const trimmed = rawValue.trim();
  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
      .filter(Boolean);
  }
  return trimmed;
}

export function formatPropertyValueForInput(
  key: string,
  value: unknown,
): string {
  if (value === null || value === undefined) return "";
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join(", ");
  }
  if (typeof value === "boolean" || typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function normalizeEditedPropertyValue(
  key: string,
  rawValue: string,
  previousValue?: unknown,
): unknown {
  const lowerKey = key.toLowerCase();
  if (lowerKey.includes("tag") || Array.isArray(previousValue)) {
    const trimmed = rawValue.trim();
    if (!trimmed) return [];
    const normalized = trimmed.replace(/^\[|\]$/g, "");
    return normalized
      .split(",")
      .map((item) => item.trim().replace(/^#/, ""))
      .filter(Boolean);
  }
  return parsePropertyInputValue(rawValue);
}

export function upsertNoteProperty(
  markdown: string,
  key: string,
  value: unknown,
): string {
  const cleanKey = key.trim();
  if (!cleanKey) return markdown;

  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;
  const match = markdown.match(fmRegex);
  const newYamlLine = formatPropertyYamlLine(cleanKey, value);

  if (!match) {
    return `---\n${newYamlLine}\n---\n${markdown}`;
  }

  const yamlBlock = match[1];
  const trailingNewline = match[2] || "\n";
  const body = markdown.slice(match[0].length);
  const lines = yamlBlock.split(/\r?\n/);
  const escapedKey = cleanKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyRegex = new RegExp(`^${escapedKey}\\s*:`);

  let replaced = false;
  const nextLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!replaced && keyRegex.test(line)) {
      nextLines.push(newYamlLine);
      replaced = true;
      while (i + 1 < lines.length && /^\s+(-\s|\S)/.test(lines[i + 1])) {
        i++;
      }
    } else {
      nextLines.push(line);
    }
  }

  if (!replaced) {
    if (nextLines.length === 1 && nextLines[0].trim() === "") {
      nextLines[0] = newYamlLine;
    } else {
      nextLines.push(newYamlLine);
    }
  }

  return `---\n${nextLines.join("\n")}\n---${trailingNewline}${body}`;
}

export function removeNoteProperty(markdown: string, key: string): string {
  const cleanKey = key.trim();
  if (!cleanKey) return markdown;

  const fmRegex = /^---\r?\n([\s\S]*?)\r?\n---(\r?\n|$)/;
  const match = markdown.match(fmRegex);
  if (!match) return markdown;

  const yamlBlock = match[1];
  const trailingNewline = match[2] || "\n";
  const body = markdown.slice(match[0].length);
  const lines = yamlBlock.split(/\r?\n/);
  const escapedKey = cleanKey.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const keyRegex = new RegExp(`^${escapedKey}\\s*:`);

  const nextLines: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (keyRegex.test(lines[i])) {
      while (i + 1 < lines.length && /^\s+(-\s|\S)/.test(lines[i + 1])) {
        i++;
      }
    } else {
      nextLines.push(lines[i]);
    }
  }

  if (nextLines.filter((l) => l.trim().length > 0).length === 0) {
    return body;
  }

  return `---\n${nextLines.join("\n")}\n---${trailingNewline}${body}`;
}
