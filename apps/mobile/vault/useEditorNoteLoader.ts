import { useState, useEffect, useRef, useCallback } from "react";
import { defaultVaultManager } from "./vaultManager";
import { defaultNoteStore } from "./noteStore";
import { generateUniqueNotePath } from "./uniqueNoteName";
import { atomicWriteNote } from "./atomicNoteWriter";
import { defaultVaultIndexer } from "../indexer";

export interface UseEditorNoteLoaderParams {
  storePath: string;
  noteId?: string;
  preset?: string;
  template?: string;
  folder?: string;
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

export function stripLeadingH1Title(content: string, isTodo: boolean = false): string {
  const stripRegex = isTodo ? /^\s*#{1,6}\s+[^\r\n]*(?:\r?\n)+/ : /^\s*#\s+[^\r\n]*(?:\r?\n)+/;
  const fmMatch = /^(---\r?\n[\s\S]*?\r?\n---\r?\n?)/.exec(content);
  if (fmMatch) {
    const fm = fmMatch[1];
    return fm + content.slice(fm.length).replace(stripRegex, "");
  }
  return content.replace(stripRegex, "");
}

export function useEditorNoteLoader({
  storePath,
  noteId,
  preset,
  template,
  folder,
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
        const targetFolder = folder !== undefined ? folder : (template === "todo" ? "Todos" : "");
        const baseStem = template === "todo" ? "Daily routine" : "Untitled";
        let resolvedPath = targetFolder ? `${targetFolder}/${baseStem}.md` : `${baseStem}.md`;
        const statCheck = await adapter.statFile(resolvedPath);
        if (statCheck.exists) {
          resolvedPath = await generateUniqueNotePath(
            adapter,
            targetFolder,
            baseStem,
          );
        }
        setActivePath(resolvedPath);
        defaultNoteStore.register(resolvedPath, noteId);
        const initialTodoContent =
          "## Daily routine\n- [x] Drink a glass of water [5 min]\n- [x] Meditate to relax [15 min]\n- [ ] Stretch for 10 minutes [10 min]\n- [ ] Go for a short walk [20 min]\n";
        const initialContent = template === "todo" ? stripLeadingH1Title(initialTodoContent, true) : "";
        setContent(initialContent);
        // Write file immediately so new document is always created in the vault
        const stat = await atomicWriteNote(adapter, resolvedPath, initialContent);
        baseMtimeRef.current = stat.mtime;
        void defaultVaultIndexer.indexVault(adapter, false);
      } else {
        const resolvedPath = noteId
          ? (defaultNoteStore.getPath(noteId) ?? storePath)
          : storePath;
        setActivePath(resolvedPath);
        const isTodoNote = template === "todo" || /todos[/\\]/i.test(resolvedPath);
        try {
          const file = await adapter.readNote(resolvedPath);
          baseMtimeRef.current = file.mtime;
          setContent(stripLeadingH1Title(file.content, isTodoNote));
        } catch {
          setContent("");
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
  }, [noteId, preset, storePath, template]);

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
