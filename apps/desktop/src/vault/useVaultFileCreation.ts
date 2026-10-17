import { useCallback, useRef } from "react";
import { useWorkspaceStore } from "../state/useWorkspaceStore";
import { createNoteInVault } from "./createNoteInVault";
import { createFolderInVault } from "./createFolderInVault";
import { initialNoteContent } from "./initialNoteContent";
import { resolveUniqueNotePath } from "./resolveUniqueNotePath";
import { resolveUniqueCanvasPath } from "./resolveUniqueCanvasPath";
import { writeNote } from "./vaultCommands";
import { withVaultWatchSuppressed } from "./vaultWatchSession";

interface VaultFileCreationOptions {
  append: (line: string) => void;
}

export function useVaultFileCreation({ append }: VaultFileCreationOptions) {
  const noteCreationQueue = useRef<Promise<void>>(Promise.resolve());
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const updateAllPaths = useWorkspaceStore((state) => state.updateAllPaths);

  const createNewNote = useCallback(
    (title?: string, parentFolder = "") => {
      const create = async () => {
        const workspace = useWorkspaceStore.getState();
        const currentPaths = Array.from(
          new Set([...workspace.allNotePaths, ...workspace.openNotes]),
        );
        const cleanTitle = title?.trim();
        const prefix = parentFolder
          ? `${parentFolder.replace(/\/+$/, "")}/`
          : "";
        const preferredPath = cleanTitle
          ? cleanTitle.endsWith(".md")
            ? `${prefix}${cleanTitle}`
            : `${prefix}${cleanTitle}.md`
          : `${prefix}Untitled.md`;
        const newPath = resolveUniqueNotePath(currentPaths, preferredPath);

        if (currentPaths.includes(newPath)) {
          append(`Note already exists: ${newPath}`);
          await openNote(newPath);
          return newPath;
        }

        const defaultContent = initialNoteContent(newPath);
        try {
          await createNoteInVault(newPath, defaultContent);
          useWorkspaceStore.setState((state) => ({
            allNotePaths: Array.from(
              new Set([...state.allNotePaths, ...currentPaths, newPath]),
            ),
            notesContent: { ...state.notesContent, [newPath]: defaultContent },
          }));
          await openNote(newPath);
          append(`Created new note: ${newPath}`);
          return newPath;
        } catch (e) {
          append(
            `Error creating note: ${e instanceof Error ? e.message : String(e)}`,
          );
          return null;
        }
      };

      const result = noteCreationQueue.current.then(create);
      noteCreationQueue.current = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
    [append, openNote],
  );

  const createNewFolder = useCallback(
    async (parentFolder = "") => {
      try {
        const folderPath = await createFolderInVault(parentFolder);
        append(`Created folder: ${folderPath}`);
        return folderPath;
      } catch (e) {
        append(
          `Error creating folder: ${e instanceof Error ? e.message : String(e)}`,
        );
        return null;
      }
    },
    [append],
  );

  const createNewCanvas = useCallback(
    async (title?: string) => {
      const currentPaths = useWorkspaceStore.getState().allNotePaths;
      const cleanTitle = title?.trim();
      const newPath = cleanTitle
        ? cleanTitle.endsWith(".canvas")
          ? cleanTitle
          : `${cleanTitle}.canvas`
        : resolveUniqueCanvasPath(currentPaths);

      if (currentPaths.includes(newPath)) {
        append(`Canvas already exists: ${newPath}`);
        await openNote(newPath);
        return;
      }

      const defaultContent = JSON.stringify({ nodes: [], edges: [] }, null, 2);
      try {
        await withVaultWatchSuppressed(async () => {
          await writeNote(newPath, defaultContent);
          updateAllPaths([...currentPaths, newPath]);
          useWorkspaceStore.setState((state) => ({
            notesContent: { ...state.notesContent, [newPath]: defaultContent },
          }));
          await openNote(newPath);
        });
        append(`Created new canvas: ${newPath}`);
      } catch (e) {
        append(
          `Error creating canvas: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
    },
    [append, openNote, updateAllPaths],
  );

  const handleLinkClick = useCallback(
    async (targetRaw: string) => {
      const targetLower = targetRaw.toLowerCase();
      const foundPath = allNotePaths.find((path) => {
        const stem =
          path
            .replace(/\.(md|canvas)$/i, "")
            .split("/")
            .pop() ?? path;
        return stem.toLowerCase() === targetLower;
      });
      if (foundPath) {
        await openNote(foundPath);
      } else {
        await createNewNote(targetRaw);
      }
    },
    [allNotePaths, createNewNote, openNote],
  );

  return {
    createNewNote,
    createNewFolder,
    createNewCanvas,
    handleLinkClick,
  };
}
