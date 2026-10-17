import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, AppState, BackHandler } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import EditorDom from "../components/EditorDom";
import { FormattingToolbar } from "../components/FormattingToolbar";
import { EditorConflictBanner } from "../components/EditorConflictBanner";
import { EditorSaveErrorBanner } from "../components/EditorSaveErrorBanner";
import { EditorHeader } from "../components/EditorHeader";
import { Text } from "../components/primitives";
import {
  defaultVaultManager,
  defaultNoteStore,
  defaultSaveQueue,
  useNotePath,
  useEditorNoteLoader,
  atomicWriteNote,
  checkForExternalConflict,
  syncH1ToFilename,
} from "../vault";
import { defaultVaultIndexer } from "../indexer";
import { useMediaCaptureActions } from "../capture";
import type {
  DocChangeNotification,
  ToolbarActionType,
} from "../src/bridgeProtocol";
import { encodePayload } from "../src/base64Payload";

export default function EditorScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    path: initialPath,
    noteId,
    preset,
    autoFocus,
  } = useLocalSearchParams<{
    path?: string;
    noteId?: string;
    preset?: string;
    autoFocus?: string;
  }>();

  const storePath = useNotePath(noteId, initialPath ?? "Untitled.md");
  const {
    activePath,
    setActivePath,
    content,
    setContent,
    isLoaded,
    loadError,
    baseMtimeRef,
  } = useEditorNoteLoader({ storePath, noteId, preset });

  const [conflictContent, setConflictContent] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "saving" | "unsaved" | "error"
  >("saved");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [actionTrigger, setActionTrigger] = useState<{
    id: number;
    action: ToolbarActionType;
  } | null>(null);
  const [insertTrigger, setInsertTrigger] = useState<{
    id: number;
    text: string;
  } | null>(null);
  const [flushTrigger, setFlushTrigger] = useState<number>(0);
  const [lastPayloadBytes, setLastPayloadBytes] = useState<number>(0);

  const unsavedContentRef = useRef<string | null>(null);
  const pathRef = useRef<string>(activePath);
  pathRef.current = activePath;

  const shouldAutoFocus = autoFocus === "1" || preset === "new";
  const [focusTrigger] = useState<number>(shouldAutoFocus ? 1 : 0);

  const { handleMediaAction } = useMediaCaptureActions((markdown) => {
    setInsertTrigger({ id: Date.now(), text: markdown });
  });

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") setFlushTrigger(Date.now());
    });
    return () => sub.remove();
  }, []);

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
    [baseMtimeRef, noteId, setActivePath],
  );

  const handleRetrySave = () => {
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
  };

  const handleOverwriteConflict = async () => {
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
  };

  const handleReloadDisk = async () => {
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
  };

  const handleBack = useCallback(async () => {
    setFlushTrigger(Date.now());
    const noteKey = noteId ?? pathRef.current;
    await new Promise((r) => setTimeout(r, 200));
    if (defaultSaveQueue.isPending(noteKey)) {
      await defaultSaveQueue.enqueue(noteKey, async () => {});
    }
    router.back();
  }, [noteId, router]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      void handleBack();
      return true;
    });
    return () => sub.remove();
  }, [handleBack]);

  const title = activePath.replace(/\.md$/i, "").split("/").pop() ?? activePath;

  return (
    <View
      className="flex-1 bg-bg-primary"
      style={{ flex: 1, paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <StatusBar style="light" />
      <EditorHeader
        title={title}
        payloadBytes={lastPayloadBytes}
        saveStatus={saveStatus}
        onBack={handleBack}
      />

      {loadError ? (
        <View className="m-4 p-4 rounded-lg bg-accent-critical/10 border border-accent-critical">
          <Text variant="body" color="error">
            {loadError}
          </Text>
        </View>
      ) : null}

      {saveError ? (
        <EditorSaveErrorBanner error={saveError} onRetry={handleRetrySave} />
      ) : null}

      {conflictContent !== null ? (
        <EditorConflictBanner
          onOverwrite={() => void handleOverwriteConflict()}
          onReload={() => void handleReloadDisk()}
        />
      ) : null}

      <View style={{ flex: 1, width: "100%" }}>
        {isLoaded ? (
          <EditorDom
            key={noteId ?? "editor-dom"}
            dom={{
              useExpoDOMWebView: false,
              matchContents: false,
              scrollEnabled: true,
              focusable: true,
              injectedJavaScriptBeforeContentLoaded:
                "window.$$EXPO_DOM_HOST_OS = 'android'; true;",
              containerStyle: { flex: 1, width: "100%", height: "100%" },
              style: { flex: 1, width: "100%", height: "100%" },
            }}
            initialContent={encodePayload(content)}
            notePath={activePath}
            onDocChanged={handleDocChanged}
            actionTrigger={actionTrigger}
            focusTrigger={focusTrigger}
            flushTrigger={flushTrigger}
            insertTrigger={
              insertTrigger
                ? {
                    id: insertTrigger.id,
                    text: encodePayload(insertTrigger.text),
                  }
                : null
            }
          />
        ) : null}
      </View>

      <FormattingToolbar
        onAction={(action) => {
          if (action === "camera" || action === "photo" || action === "audio") {
            void handleMediaAction(action);
          } else {
            setActionTrigger({ id: Date.now(), action });
          }
        }}
      />
    </View>
  );
}
