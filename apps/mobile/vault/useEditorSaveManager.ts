import { useState, useRef, useCallback } from "react";
import { defaultVaultManager } from "./vaultManager";
import { defaultNoteStore } from "./noteStore";
import { defaultSaveQueue } from "./saveQueue";
import {
  atomicWriteNote,
  checkForExternalConflict,
} from "./atomicNoteWriter";
import { syncH1ToFilename } from "./h1SyncService";
import { defaultVaultIndexer } from "../indexer";
import type { DocChangeNotification } from "../src/bridgeProtocol";

export interface UseEditorSaveManagerParams {
  noteId?: string;
  pathRef: React.MutableRefObject<string>;
  baseMtimeRef: React.MutableRefObject<number>;
  setActivePath: (path: string) => void;
  setContent: (content: string) => void;
  onBack: () => void;
}

export interface UseEditorSaveManagerResult {
  saveStatus: "saved" | "saving" | "unsaved" | "error";
  saveError: string | null;
  conflictContent: string | null;
  lastPayloadBytes: number;
  flushTrigger: number;
  handleDocChanged: (
    notification: DocChangeNotification,
    bytes: number,
  ) => Promise<void>;
  handleFlushAck: (id: number) => void;
  handleBack: () => Promise<void>;
  handleRetrySave: () => void;
  handleOverwriteConflict: () => Promise<void>;
  handleReloadDisk: () => Promise<void>;
  triggerAppBackgroundFlush: () => void;
}

export function useEditorSaveManager({
  noteId,
  pathRef,
  baseMtimeRef,
  setActivePath,
  setContent,
  onBack,
}: UseEditorSaveManagerParams): UseEditorSaveManagerResult {
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "unsaved" | "error"
  >("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [conflictContent, setConflictContent] = useState<string | null>(null);
  const [lastPayloadBytes, setLastPayloadBytes] = useState<number>(0);
  const [flushTrigger, setFlushTrigger] = useState<number>(0);

  const unsavedContentRef = useRef<string | null>(null);
  const flushAckResolverRef = useRef<((id: number) => void) | null>(null);
  const isBackingRef = useRef(false);

  const handleDocChanged = useCallback(
    async (notification: DocChangeNotification, bytes: number) => {
      setLastPayloadBytes(bytes);
      const newText = notification.content;
      if (newText === undefined) return;
      unsavedContentRef.current = newText;
      setSaveStatus("unsaved");

      const noteKey = noteId ?? pathRef.current;
      await defaultSaveQueue.enqueue(noteKey, async () => {
        try {
          setSaveStatus("saving");
          const { adapter } = await defaultVaultManager.getActiveAdapter();
          if (!adapter) throw new Error("No active vault adapter");

          const currentPath = noteId
            ? (defaultNoteStore.getPath(noteId) ?? pathRef.current)
            : pathRef.current;

          const conflict = await checkForExternalConflict(
            adapter,
            currentPath,
            baseMtimeRef.current,
          );
          if (conflict.hasConflict) {
            setConflictContent(newText);
            return;
          }

          const stat = await atomicWriteNote(adapter, currentPath, newText);
          baseMtimeRef.current = stat.mtime;
          unsavedContentRef.current = null;
          setSaveStatus("saved");
          setSaveError(null);
          console.log(
            `[editor] Saved to disk: ${currentPath} size=${stat.size} content=${JSON.stringify(newText)}`,
          );

          const sync = await syncH1ToFilename(adapter, currentPath, newText);
          if (sync.renamed) {
            setActivePath(sync.newPath);
            defaultNoteStore.rename(currentPath, sync.newPath);
          } else {
            await defaultVaultIndexer.indexVault(adapter, false);
          }
        } catch (err) {
          console.error("[editor] Save failed:", err);
          setSaveStatus("error");
          setSaveError(err instanceof Error ? err.message : "Couldn't save");
        }
      });
    },
    [baseMtimeRef, noteId, pathRef, setActivePath],
  );

  const handleFlushAck = useCallback((id: number) => {
    if (flushAckResolverRef.current) {
      flushAckResolverRef.current(id);
      flushAckResolverRef.current = null;
    }
  }, []);

  const handleBack = useCallback(async () => {
    if (isBackingRef.current) return;
    isBackingRef.current = true;

    try {
      const triggerId = Date.now();
      const flushPromise = new Promise<void>((resolve) => {
        const timeout = setTimeout(() => resolve(), 1200);
        flushAckResolverRef.current = (ackId) => {
          if (ackId === triggerId) {
            clearTimeout(timeout);
            resolve();
          }
        };
      });

      setFlushTrigger(triggerId);
      await flushPromise;

      const noteKey = noteId ?? pathRef.current;
      await defaultSaveQueue.enqueue(noteKey, async () => {});

      if (unsavedContentRef.current !== null) {
        try {
          const { adapter } = await defaultVaultManager.getActiveAdapter();
          if (adapter) {
            const currentPath = noteId
              ? (defaultNoteStore.getPath(noteId) ?? pathRef.current)
              : pathRef.current;
            await atomicWriteNote(
              adapter,
              currentPath,
              unsavedContentRef.current,
            );
            unsavedContentRef.current = null;
          }
        } catch (err) {
          console.warn("[editor] Fallback emergency save failed:", err);
        }
      }
    } finally {
      onBack();
    }
  }, [noteId, onBack, pathRef]);

  const handleRetrySave = useCallback(() => {
    if (unsavedContentRef.current !== null) {
      void handleDocChanged(
        {
          docLength: unsavedContentRef.current.length,
          changeCount: 0,
          excerpt: "",
          timestamp: Date.now(),
          content: unsavedContentRef.current,
        },
        0,
      );
    }
  }, [handleDocChanged]);

  const handleOverwriteConflict = useCallback(async () => {
    if (!conflictContent) return;
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      const stat = await atomicWriteNote(
        adapter,
        pathRef.current,
        conflictContent,
      );
      baseMtimeRef.current = stat.mtime;
      setConflictContent(null);
      await defaultVaultIndexer.indexVault(adapter, false);
    } catch (err) {
      console.error("[editor] Overwrite conflict failed:", err);
    }
  }, [baseMtimeRef, conflictContent, pathRef]);

  const handleReloadDisk = useCallback(async () => {
    try {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      const file = await adapter.readNote(pathRef.current);
      baseMtimeRef.current = file.mtime;
      setContent(file.content);
    } catch (err) {
      console.error("[editor] Reload from disk failed:", err);
    } finally {
      setConflictContent(null);
    }
  }, [baseMtimeRef, pathRef, setContent]);

  const triggerAppBackgroundFlush = useCallback(() => {
    setFlushTrigger(Date.now());
  }, []);

  return {
    saveStatus,
    saveError,
    conflictContent,
    lastPayloadBytes,
    flushTrigger,
    handleDocChanged,
    handleFlushAck,
    handleBack,
    handleRetrySave,
    handleOverwriteConflict,
    handleReloadDisk,
    triggerAppBackgroundFlush,
  };
}
