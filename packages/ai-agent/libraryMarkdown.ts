import {
  AI_LIBRARY_DIR,
  type AgentProject,
  type LibraryItem,
  type LibraryItemType,
} from "./conversationTypes.js";

export type FrontmatterRecord = Record<string, string | string[]>;

export function parseLibraryItemFrontmatter(text: string): {
  frontmatter: FrontmatterRecord;
  content: string;
} {
  const match = /^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/.exec(text);
  if (!match) return { frontmatter: {}, content: text };
  const rawYaml = match[1];
  const content = text.slice(match[0].length);
  const frontmatter: FrontmatterRecord = {};

  const lines = rawYaml.split(/\r?\n/);
  let currentArrayKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (currentArrayKey && trimmed.startsWith("- ")) {
      const itemVal = trimmed
        .slice(2)
        .trim()
        .replace(/^['"]|['"]$/g, "");
      if (itemVal) {
        const arr = frontmatter[currentArrayKey];
        if (Array.isArray(arr)) arr.push(itemVal);
      }
      continue;
    }
    currentArrayKey = null;

    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    if (!val) {
      currentArrayKey = key;
      frontmatter[key] = [];
      continue;
    }

    if (val.startsWith("[") && val.endsWith("]")) {
      const items = val
        .slice(1, -1)
        .split(",")
        .map((s) => s.trim().replace(/^['"]|['"]$/g, ""))
        .filter(Boolean);
      frontmatter[key] = items;
      continue;
    }

    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    else if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    frontmatter[key] = val;
  }

  return { frontmatter, content };
}

export function serializeLibraryItemToMarkdown(
  item: LibraryItem,
  projectName?: string,
): string {
  const lines: string[] = ["---"];
  lines.push(`title: "${(item.title || "Untitled").replace(/"/g, '\\"')}"`);
  lines.push(`type: "${item.type || "prompt"}"`);
  if (projectName && projectName !== "General") {
    lines.push(`project: "${projectName.replace(/"/g, '\\"')}"`);
  }
  if (item.description) {
    lines.push(`description: "${item.description.replace(/"/g, '\\"')}"`);
  }
  if (item.tags && item.tags.length > 0) {
    lines.push(
      `tags: [${item.tags.map((t) => `"${t.replace(/"/g, '\\"')}"`).join(", ")}]`,
    );
  }
  if (item.id) lines.push(`id: "${item.id}"`);
  if (item.createdAt) lines.push(`createdAt: ${item.createdAt}`);
  if (item.updatedAt) lines.push(`updatedAt: ${item.updatedAt}`);
  lines.push("---");
  lines.push("");
  lines.push(item.content ? item.content.trim() : "");
  return lines.join("\n");
}

export function getLibraryItemFilePath(
  item: Partial<LibraryItem>,
  projectName?: string,
): string {
  const validTypes: LibraryItemType[] = ["prompt", "skill", "rule"];
  const itemType: LibraryItemType = validTypes.includes(
    item.type as LibraryItemType,
  )
    ? (item.type as LibraryItemType)
    : "prompt";
  const typeFolder = `${itemType}s`; // prompts, skills, rules

  const cleanTitle =
    (item.title || "Untitled").replace(/[/\\?%*:|"<>]/g, "-").trim() ||
    "untitled";
  const fileName = `${cleanTitle}.md`;

  if (projectName && projectName !== "General" && projectName.trim()) {
    const cleanProject = projectName.replace(/[/\\?%*:|"<>]/g, "-").trim();
    return `${AI_LIBRARY_DIR}/${cleanProject}/${typeFolder}/${fileName}`;
  }
  return `${AI_LIBRARY_DIR}/${typeFolder}/${fileName}`;
}

export function parseMarkdownToLibraryItem(
  markdown: string,
  filePath: string,
  knownProjects: AgentProject[] = [],
): LibraryItem {
  const { frontmatter, content } = parseLibraryItemFrontmatter(markdown);

  const cleanFileName = filePath.split("/").pop()?.replace(/\.md$/i, "").trim();
  const title = (frontmatter.title || cleanFileName || "Untitled").trim();

  let inferredType: LibraryItemType = "prompt";
  if (
    frontmatter.type === "prompt" ||
    frontmatter.type === "skill" ||
    frontmatter.type === "rule"
  ) {
    inferredType = frontmatter.type;
  } else if (filePath.includes("/skills/") || filePath.includes("/skill/")) {
    inferredType = "skill";
  } else if (filePath.includes("/rules/") || filePath.includes("/rule/")) {
    inferredType = "rule";
  }

  let projectId: string | null = null;
  const projectHint = frontmatter.project || "";
  if (projectHint && projectHint !== "General") {
    const match = knownProjects.find(
      (p) => p.name.toLowerCase() === projectHint.toLowerCase(),
    );
    projectId = match ? match.id : null;
  } else {
    // Check if subfolder denotes project: ai-library/{ProjectName}/{type}/...
    const parts = filePath.split("/");
    if (parts.length >= 4 && parts[0] === AI_LIBRARY_DIR) {
      const candidateProjectName = parts[1];
      if (
        !["prompts", "skills", "rules"].includes(candidateProjectName) &&
        candidateProjectName !== "General"
      ) {
        const match = knownProjects.find(
          (p) => p.name.toLowerCase() === candidateProjectName.toLowerCase(),
        );
        projectId = match ? match.id : null;
      }
    }
  }

  const cleanId =
    frontmatter.id ||
    `lib_${cleanFileName?.toLowerCase().replace(/\s+/g, "_") || Date.now()}`;
  const tags: string[] = Array.isArray(frontmatter.tags)
    ? frontmatter.tags
    : [];

  return {
    id: cleanId,
    projectId,
    type: inferredType,
    title,
    description: frontmatter.description || "",
    content: content.trim(),
    tags,
    filePath,
    createdAt: Number(frontmatter.createdAt) || Date.now(),
    updatedAt: Number(frontmatter.updatedAt) || Date.now(),
  };
}
