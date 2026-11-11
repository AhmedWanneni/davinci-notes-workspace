import {
  AI_LIBRARY_DIR,
  serializeLibraryItemToMarkdown,
  parseMarkdownToLibraryItem,
  getLibraryItemFilePath,
  type AgentProject,
  type LibraryItem,
} from "@app/ai-agent";
import {
  readNote,
  writeNote,
  deleteNote,
  listNotes,
} from "../../../vault/vaultCommands";
import { useWorkspaceStore } from "../../../state/useWorkspaceStore";
import { DEFAULT_LIBRARY_ITEMS } from "./agentLibraryDefaults";

export async function loadLibraryItemsFromVault(
  knownProjects: AgentProject[] = [],
): Promise<LibraryItem[]> {
  try {
    let notePaths: string[] = [];
    const statePaths = useWorkspaceStore.getState().allNotePaths;
    if (statePaths && statePaths.length > 0) {
      notePaths = statePaths;
    } else {
      notePaths = await listNotes();
    }

    const libraryFilePaths = notePaths.filter(
      (p) => p.startsWith(`${AI_LIBRARY_DIR}/`) && p.endsWith(".md"),
    );

    if (libraryFilePaths.length === 0) {
      return await initializeDefaultLibraryInVault();
    }

    const loadedItems: LibraryItem[] = [];
    for (const filePath of libraryFilePaths) {
      try {
        const file = await readNote(filePath);
        if (file && typeof file.content === "string") {
          const item = parseMarkdownToLibraryItem(
            file.content,
            filePath,
            knownProjects,
          );
          loadedItems.push(item);
        }
      } catch (err) {
        console.warn(`[libraryVaultStorage] Failed to read ${filePath}:`, err);
      }
    }

    return loadedItems.length > 0 ? loadedItems : DEFAULT_LIBRARY_ITEMS;
  } catch (err) {
    console.warn(
      "[libraryVaultStorage] Failed to load library from vault:",
      err,
    );
    return DEFAULT_LIBRARY_ITEMS;
  }
}

export async function initializeDefaultLibraryInVault(): Promise<
  LibraryItem[]
> {
  const initializedItems: LibraryItem[] = [];

  for (const item of DEFAULT_LIBRARY_ITEMS) {
    const filePath = getLibraryItemFilePath(item);
    const itemWithFile: LibraryItem = { ...item, filePath };
    const markdown = serializeLibraryItemToMarkdown(itemWithFile);

    try {
      await writeNote(filePath, markdown);
      initializedItems.push(itemWithFile);
    } catch (err) {
      console.warn(`[libraryVaultStorage] Could not seed ${filePath}:`, err);
      initializedItems.push(item);
    }
  }

  return initializedItems.length > 0 ? initializedItems : DEFAULT_LIBRARY_ITEMS;
}

export async function saveLibraryItemToVault(
  item: LibraryItem,
  knownProjects: AgentProject[] = [],
): Promise<LibraryItem> {
  const project = knownProjects.find((p) => p.id === item.projectId);
  const targetPath = getLibraryItemFilePath(item, project?.name);

  // If item was previously saved at a different path (e.g. renamed or moved), delete old note
  if (item.filePath && item.filePath !== targetPath) {
    try {
      await deleteNote(item.filePath);
    } catch (err) {
      console.warn(
        `[libraryVaultStorage] Failed to delete old file ${item.filePath}:`,
        err,
      );
    }
  }

  const updatedItem: LibraryItem = {
    ...item,
    filePath: targetPath,
    updatedAt: Date.now(),
  };

  const markdown = serializeLibraryItemToMarkdown(updatedItem, project?.name);
  await writeNote(targetPath, markdown);
  return updatedItem;
}

export async function deleteLibraryItemFromVault(
  item: LibraryItem,
  knownProjects: AgentProject[] = [],
): Promise<void> {
  const project = knownProjects.find((p) => p.id === item.projectId);
  const filePath = item.filePath || getLibraryItemFilePath(item, project?.name);

  try {
    await deleteNote(filePath);
  } catch (err) {
    console.warn(`[libraryVaultStorage] Failed to delete ${filePath}:`, err);
  }
}
