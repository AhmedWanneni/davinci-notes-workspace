import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, AppState, BackHandler, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { NavigationBar } from "expo-navigation-bar";
import { useImmersiveNavigationBar } from "../settings";
import EditorDom from "../components/EditorDom";
import { FormattingToolbar } from "../components/FormattingToolbar";
import { EditorConflictBanner } from "../components/EditorConflictBanner";
import { EditorSaveErrorBanner } from "../components/EditorSaveErrorBanner";
import { EditorHeader } from "../components/EditorHeader";
import { EditorPreviewView } from "../components/EditorPreviewView";
import { buildEditorInjectedScript } from "../components/editorInjectedScript";
import { Text } from "../components/primitives";
import {
  useNotePath,
  useEditorNoteLoader,
  useEditorSaveManager,
} from "../vault";
import { useMediaCaptureActions } from "../capture";
import type { ToolbarActionType } from "../src/bridgeProtocol";
import { encodePayload } from "../src/base64Payload";
import { useTheme } from "../theme";

export default function EditorScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens, themeCss } = useTheme();
  useImmersiveNavigationBar();
  const {
    path: initialPath,
    noteId,
    preset,
    autoFocus,
    mode: initialMode,
  } = useLocalSearchParams<{
    path?: string;
    noteId?: string;
    preset?: string;
    autoFocus?: string;
    mode?: "edit" | "preview";
  }>();

  const [viewMode, setViewMode] = useState<"edit" | "preview">(
    initialMode === "edit" || preset === "new" ? "edit" : "preview",
  );

  const storePath = useNotePath(noteId, initialPath ?? "Untitled.md");
  const {
    activePath,
    setActivePath,
    content,
    setContent,
    isLoaded,
    loadError,
    baseMtimeRef,
    loadCounter,
    reloadNote,
  } = useEditorNoteLoader({ storePath, noteId, preset });

  useFocusEffect(
    useCallback(() => {
      void reloadNote();
    }, [reloadNote]),
  );

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
      className="flex-1"
      style={{
        flex: 1,
        backgroundColor: tokens.color.bg.primary,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      {Platform.OS === "android" ? <NavigationBar hidden={true} /> : null}
      <EditorHeader
        title={title}
        payloadBytes={lastPayloadBytes}
        saveStatus={saveStatus}
        onBack={handleBack}
        mode={viewMode}
        onToggleMode={(next) => setViewMode(next)}
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
        {viewMode === "preview" ? (
          <EditorPreviewView
            content={content}
            title={title}
            onEditPress={() => setViewMode("edit")}
            onWikilinkPress={(target) =>
              router.push({
                pathname: "/editor",
                params: { path: `${target}.md`, mode: "preview" },
              })
            }
            onTagPress={(tag) =>
              router.push({ pathname: "/(tabs)/search", params: { q: tag } })
            }
          />
        ) : isLoaded ? (
          <EditorDom
            key={`${noteId ?? activePath}-${loadCounter}`}
            dom={{
              useExpoDOMWebView: false,
              matchContents: false,
              scrollEnabled: true,
              focusable: true,
              injectedJavaScriptBeforeContentLoaded: buildEditorInjectedScript(
                content,
                activePath,
                themeCss ?? "",
              ),
              containerStyle: { flex: 1, width: "100%", height: "100%" },
              style: { flex: 1, width: "100%", height: "100%" },
            }}
            initialContent={encodePayload(content)}
            notePath={activePath}
            themeCss={themeCss}
            onDocChanged={handleDocChanged}
            onFlushAck={handleFlushAck}
            onMetricsUpdate={() => {}}
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

      {viewMode === "edit" ? (
        <FormattingToolbar
          onAction={(action) => {
            if (
              action === "camera" ||
              action === "photo" ||
              action === "audio"
            ) {
              void handleMediaAction(action);
            } else {
              setActionTrigger({ id: Date.now(), action });
            }
          }}
        />
      ) : null}
    </View>
  );
}
