import { useState, useEffect, useRef } from "react";
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
  const baseMtimeRef = useRef<number>(0);

  const lastLoadedKeyRef = useRef<string>("");

  useEffect(() => {
    const currentKey = `${noteId ?? ""}:${storePath}:${preset ?? ""}`;
    if (lastLoadedKeyRef.current === currentKey) return;
    lastLoadedKeyRef.current = currentKey;

    let mounted = true;
    (async () => {
      try {
        const { adapter } = await defaultVaultManager.getActiveAdapter();
        if (!adapter) {
          if (mounted) setLoadError("No vault configured.");
          return;
        }

        if (preset === "new") {
          let resolvedPath = storePath;
          const statCheck = await adapter.statFile(resolvedPath);
          if (statCheck.exists) {
            resolvedPath = await generateUniqueNotePath(
              adapter,
              "",
              "Untitled",
            );
          }
          if (mounted) {
            setActivePath(resolvedPath);
          }
          defaultNoteStore.register(resolvedPath, noteId);
          const title =
            resolvedPath.replace(/\.md$/i, "").split("/").pop() ?? "Untitled";
          const initial = `# ${title}\n\n`;
          if (mounted) setContent(initial);
          const stat = await atomicWriteNote(adapter, resolvedPath, initial);
          baseMtimeRef.current = stat.mtime;
        } else {
          const resolvedPath = noteId
            ? (defaultNoteStore.getPath(noteId) ?? storePath)
            : storePath;
          if (mounted) {
            setActivePath(resolvedPath);
          }
          try {
            const file = await adapter.readNote(resolvedPath);
            baseMtimeRef.current = file.mtime;
            if (mounted) setContent(file.content);
          } catch {
            const title =
              resolvedPath.replace(/\.md$/i, "").split("/").pop() ?? "Untitled";
            if (mounted) setContent(`# ${title}\n\n`);
          }
        }
        if (mounted) {
          setLoadError(null);
          setIsLoaded(true);
        }
      } catch (err) {
        console.error("[editor] Initialization failed:", err);
        if (mounted) {
          setLoadError(
            err instanceof Error ? err.message : "Failed to load note.",
          );
        }
      }
    })().catch((err) => {
      console.error("[editor] Uncaught error during init:", err);
    });

    return () => {
      mounted = false;
    };
  }, [storePath, preset, noteId]);

  return {
    activePath,
    setActivePath,
    content,
    setContent,
    isLoaded,
    loadError,
    baseMtimeRef,
  };
}
