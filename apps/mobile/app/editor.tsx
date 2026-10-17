import React, { useState, useEffect, useRef } from "react";
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
  useNotePath,
  useEditorNoteLoader,
  useEditorSaveManager,
} from "../vault";
import { useMediaCaptureActions } from "../capture";
import type { ToolbarActionType } from "../src/bridgeProtocol";
import { encodePayload } from "../src/base64Payload";

export default function EditorScreen(): React.ReactElement {
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

  const pathRef = useRef<string>(activePath);
  pathRef.current = activePath;

  const router = useRouter();
  const {
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
  } = useEditorSaveManager({
    noteId,
    pathRef,
    baseMtimeRef,
    setActivePath,
    setContent,
    onBack: () => router.back(),
  });

  const [actionTrigger, setActionTrigger] = useState<{
    id: number;
    action: ToolbarActionType;
  } | null>(null);
  const [insertTrigger, setInsertTrigger] = useState<{
    id: number;
    text: string;
  } | null>(null);

  const shouldAutoFocus = autoFocus === "1" || preset === "new";
  const [focusTrigger] = useState<number>(shouldAutoFocus ? 1 : 0);

  const { handleMediaAction } = useMediaCaptureActions((markdown) => {
    setInsertTrigger({ id: Date.now(), text: markdown });
  });

  useEffect(() => {
    const sub = AppState.addEventListener("change", (nextState) => {
      if (nextState !== "active") triggerAppBackgroundFlush();
    });
    return () => sub.remove();
  }, [triggerAppBackgroundFlush]);

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
            onFlushAck={handleFlushAck}
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
