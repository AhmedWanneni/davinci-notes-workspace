import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, AppState, BackHandler, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { NavigationBar } from "expo-navigation-bar";
import { useImmersiveNavigationBar, useImmersiveMode } from "../settings";
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
import { useTheme } from "../theme";

export default function EditorScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens, themeCss } = useTheme();
  const { isImmersiveMode } = useImmersiveMode();
  useImmersiveNavigationBar();
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
      {Platform.OS === "android" && isImmersiveMode ? (
        <NavigationBar hidden={true} />
      ) : null}
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
            key={`${noteId ?? activePath}-${loadCounter}`}
            dom={{
              useExpoDOMWebView: false,
              matchContents: false,
              scrollEnabled: true,
              focusable: true,
              injectedJavaScriptBeforeContentLoaded: `
                window.ReactNativeWebView = window.ReactNativeWebView || {};
                if (typeof window.ReactNativeWebView.injectedObjectJson !== 'function') {
                  window.ReactNativeWebView.injectedObjectJson = function() {
                    return JSON.stringify({
                      EXPO_DOM_HOST_OS: 'android',
                      initialProps: {
                        names: ['onDocChanged', 'onFlushAck', 'onMetricsUpdate'],
                        props: {
                          initialContent: ${JSON.stringify(encodePayload(content))},
                          notePath: ${JSON.stringify(activePath)},
                          themeCss: ${JSON.stringify(themeCss ?? "")}
                        }
                      }
                    });
                  };
                }
                window.$$EXPO_DOM_HOST_OS = window.$$EXPO_DOM_HOST_OS || 'android';
                window.$$EXPO_INITIAL_PROPS = window.$$EXPO_INITIAL_PROPS || {
                  names: ['onDocChanged', 'onFlushAck', 'onMetricsUpdate'],
                  props: {
                    initialContent: ${JSON.stringify(encodePayload(content))},
                    notePath: ${JSON.stringify(activePath)},
                    themeCss: ${JSON.stringify(themeCss ?? "")}
                  }
                };
                true;
              `,
              containerStyle: { flex: 1, width: "100%", height: "100%" },
              style: { flex: 1, width: "100%", height: "100%" },
            }}
            initialContent={encodePayload(content)}
            notePath={activePath}
            themeCss={themeCss}
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
