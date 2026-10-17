import { useState, useEffect, useRef, useCallback } from "react";
import { defaultVaultManager } from "./vaultManager";
import { defaultNoteStore } from "./noteStore";
import { generateUniqueNotePath } from "./uniqueNoteName";
import { atomicWriteNote } from "./atomicNoteWriter";

export interface UseEditorNoteLoaderParams {
  storePath: string;
  noteId?: string;
  preset?: string;
}

export interface UseEditorNoteLoaderResult {
  activePath: string;
  setActivePath: (path: string) => void;
  content: string;
  setContent: (content: string) => void;
  isLoaded: boolean;
  loadError: string | null;
  baseMtimeRef: React.MutableRefObject<number>;
  loadCounter: number;
  reloadNote: () => Promise<void>;
}

export function useEditorNoteLoader({
  storePath,
  noteId,
  preset,
}: UseEditorNoteLoaderParams): UseEditorNoteLoaderResult {
  const [activePath, setActivePath] = useState<string>(storePath);
  const [content, setContent] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadCounter, setLoadCounter] = useState<number>(0);
  const baseMtimeRef = useRef<number>(0);
  const hasCreatedNewRef = useRef<boolean>(false);

  const loadNote = useCallback(async () => {
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) {
        setLoadError("No vault configured.");
        return;
      }

      if (preset === "new" && !hasCreatedNewRef.current) {
        hasCreatedNewRef.current = true;
        let resolvedPath = storePath;
        const statCheck = await adapter.statFile(resolvedPath);
        if (statCheck.exists) {
          resolvedPath = await generateUniqueNotePath(
            adapter,
            "",
            "Untitled",
          );
        }
        setActivePath(resolvedPath);
        defaultNoteStore.register(resolvedPath, noteId);
        const title =
          resolvedPath.replace(/\.md$/i, "").split("/").pop() ?? "Untitled";
        const initial = `# ${title}\n\n`;
        setContent(initial);
        const stat = await atomicWriteNote(adapter, resolvedPath, initial);
        baseMtimeRef.current = stat.mtime;
      } else {
        const resolvedPath = noteId
          ? (defaultNoteStore.getPath(noteId) ?? storePath)
          : storePath;
        setActivePath(resolvedPath);
        try {
          const file = await adapter.readNote(resolvedPath);
          baseMtimeRef.current = file.mtime;
          setContent(file.content);
        } catch {
          const title =
            resolvedPath.replace(/\.md$/i, "").split("/").pop() ?? "Untitled";
          setContent(`# ${title}\n\n`);
        }
      }
      setLoadError(null);
      setIsLoaded(true);
      setLoadCounter((c) => c + 1);
    } catch (err) {
      console.error("[editor] Initialization failed:", err);
      setLoadError(
        err instanceof Error ? err.message : "Failed to load note.",
      );
    }
  }, [noteId, preset, storePath]);

  useEffect(() => {
    void loadNote();
  }, [loadNote]);

  return {
    activePath,
    setActivePath,
    content,
    setContent,
    isLoaded,
    loadError,
    baseMtimeRef,
    loadCounter,
    reloadNote: loadNote,
  };
}
