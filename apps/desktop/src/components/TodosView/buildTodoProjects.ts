import { parseNoteTodos } from "./todoParser";
import type { TodoNote, TodoProject, TodoSection } from "./types";

export function buildTodoProjects(
  allFolderPaths: string[],
  todoPaths: string[],
  notesContent: Record<string, string>,
): TodoProject[] {
  const folderMap = new Map<string, { name: string; folderPath: string }>();

  for (const f of allFolderPaths) {
    const norm = f.replace(/\\/g, "/").replace(/\/+$/, "");
    const parts = norm.split("/");
    if (parts.length === 2 && parts[0].toLowerCase() === "todos") {
      folderMap.set(norm, { name: parts[1], folderPath: norm });
    }
  }

  for (const p of todoPaths) {
    const norm = p.replace(/\\/g, "/");
    const parts = norm.split("/");
    if (parts.length >= 3 && parts[0].toLowerCase() === "todos") {
      const key = `todos/${parts[1]}`;
      if (!folderMap.has(key)) {
        folderMap.set(key, { name: parts[1], folderPath: key });
      }
    } else if (parts.length === 2 && parts[0].toLowerCase() === "todos") {
      if (!folderMap.has("todos")) {
        folderMap.set("todos", { name: "General", folderPath: "todos" });
      }
    }
  }

  const result: TodoProject[] = [];
  for (const { name, folderPath } of folderMap.values()) {
    const childNotes: TodoNote[] = [];
    const prefix = folderPath === "todos" ? "todos/" : `${folderPath}/`;

    for (const notePath of todoPaths) {
      const norm = notePath.replace(/\\/g, "/");
      const isDirect =
        folderPath === "todos"
          ? norm.startsWith("todos/") && norm.split("/").length === 2
          : norm.startsWith(prefix);

      if (isDirect) {
        const parts = norm.split("/");
        const fileName = parts[parts.length - 1].replace(/\.md$/, "");
        const content = notesContent[notePath] ?? "";
        const sections = parseNoteTodos(content, notePath, name, fileName);
        childNotes.push({ id: notePath, name: fileName, notePath, sections });
      }
    }

    const allSections: TodoSection[] = childNotes.flatMap((n) => n.sections);
    result.push({
      id: folderPath,
      name,
      folderPath,
      notePath: childNotes[0]?.notePath ?? "",
      notes: childNotes,
      folder: name,
      sections: allSections,
    });
  }

  return result;
}
