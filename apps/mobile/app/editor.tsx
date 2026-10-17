import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, AppState } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useLocalSearchParams, useRouter } from "expo-router";
import EditorDom from "../components/EditorDom";
import { FormattingToolbar } from "../components/FormattingToolbar";
import { EditorConflictBanner } from "../components/EditorConflictBanner";
import { EditorHeader } from "../components/EditorHeader";
import { defaultVaultManager } from "../vault";
import {
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

export default function EditorScreen(): React.ReactElement {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { path: initialPath, preset } = useLocalSearchParams<{
    path?: string;
    preset?: string;
  }>();

  const [activePath, setActivePath] = useState<string>(
    initialPath ?? "Untitled.md",
  );
  const [content, setContent] = useState<string>("");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [conflictContent, setConflictContent] = useState<string | null>(null);
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

  const { handleMediaAction } = useMediaCaptureActions((markdown) => {
    setInsertTrigger({ id: Date.now(), text: markdown });
  });

  const baseMtimeRef = useRef<number>(0);
  const pathRef = useRef<string>(activePath);
  pathRef.current = activePath;

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;
      if (preset === "new") {
        const initial = "# Untitled\n\n";
        setContent(initial);
        const stat = await atomicWriteNote(adapter, activePath, initial);
        baseMtimeRef.current = stat.mtime;
      } else {
        try {
          const file = await adapter.readNote(activePath);
          baseMtimeRef.current = file.mtime;
          if (mounted) setContent(file.content);
        } catch {
          if (mounted) setContent(`# ${activePath.replace(/\.md$/i, "")}\n\n`);
        }
      }
      if (mounted) setIsLoaded(true);
    })();
    return () => {
      mounted = false;
    };
  }, [activePath, preset]);

  // App background save flush
  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") {
        setFlushTrigger(Date.now());
      }
    });
    return () => sub.remove();
  }, []);

  const handleDocChanged = useCallback(
    async (notification: DocChangeNotification, bytes: number) => {
      setLastPayloadBytes(bytes);
      const newText = notification.content;
      if (newText === undefined) return;

      const { adapter } = await defaultVaultManager.getActiveAdapter();
      if (!adapter) return;

      const currentPath = pathRef.current;
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

      const sync = await syncH1ToFilename(adapter, currentPath, newText);
      if (sync.renamed) setActivePath(sync.newPath);
      else await defaultVaultIndexer.indexVault(adapter, false);
    },
    [],
  );

  const handleOverwriteConflict = async () => {
    if (!conflictContent) return;
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
  };

  const handleReloadDisk = async () => {
    const { adapter } = await defaultVaultManager.getActiveAdapter();
    if (!adapter) return;
    try {
      const file = await adapter.readNote(pathRef.current);
      baseMtimeRef.current = file.mtime;
      setContent(file.content);
    } finally {
      setConflictContent(null);
    }
  };

  const handleBack = () => {
    setFlushTrigger(Date.now());
    setTimeout(() => {
      router.replace({ pathname: "/note", params: { path: pathRef.current } });
    }, 50);
  };

  const title = activePath.replace(/\.md$/i, "").split("/").pop() ?? activePath;

  return (
    <View
      className="flex-1 bg-bg-primary"
      style={{
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <StatusBar style="light" />
      <EditorHeader
        title={title}
        payloadBytes={lastPayloadBytes}
        onBack={handleBack}
      />

      {conflictContent !== null ? (
        <EditorConflictBanner
          onOverwrite={handleOverwriteConflict}
          onReload={handleReloadDisk}
        />
      ) : null}

      <View className="flex-1">
        {isLoaded ? (
          <EditorDom
            initialContent={content}
            notePath={activePath}
            onDocChanged={handleDocChanged}
            actionTrigger={actionTrigger}
            focusTrigger={preset === "new" ? 1 : 0}
            flushTrigger={flushTrigger}
            insertTrigger={insertTrigger}
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
