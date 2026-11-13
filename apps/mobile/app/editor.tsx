import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, AppState, BackHandler, Keyboard } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter, useFocusEffect } from "expo-router";
import { TodoView } from "../components/todos";
import { useImmersiveNavigationBar } from "../settings";
import EditorDom from "../components/EditorDom";
import { FormattingToolbar } from "../components/FormattingToolbar";
import { EditorBottomBar } from "../components/EditorBottomBar";
import { EditorDrawer } from "../components/EditorDrawer";
import { NewTabPage } from "../components/NewTabPage";
import { TabSwitcherModal } from "../components/TabSwitcherModal";
import { NoteActionSheet, SelectFolderModal } from "../components/shell";
import { EditorConflictBanner } from "../components/EditorConflictBanner";
import { EditorSaveErrorBanner } from "../components/EditorSaveErrorBanner";
import { EditorHeader } from "../components/EditorHeader";
import { EditorTitleHeader } from "../components/EditorTitleHeader";
import { buildEditorInjectedScript } from "../components/editorInjectedScript";
import { Text } from "../components/primitives";
import {
  useNotePath, useEditorNoteLoader, useEditorSaveManager, useEditorTabManager,
  openNewTabLanding, updateActiveTabContent, createUnsavedNewTab,
  getNoteMode, setNoteModeInContent, type NoteEditorMode,
} from "../vault";
import { useMediaCaptureActions } from "../capture";
import type { ToolbarActionType, DocChangeNotification } from "../src/bridgeProtocol";
import { encodePayload } from "../src/base64Payload";
import { useTheme } from "../theme";

export default function EditorScreen(): React.ReactElement {
  const insets = useSafeAreaInsets();
  const { tokens, themeCss } = useTheme();
  useImmersiveNavigationBar();
  const { path: initialPath, noteId, preset, template, autoFocus, folder } =
    useLocalSearchParams<{ path?: string; noteId?: string; preset?: string; template?: string; autoFocus?: string; folder?: string }>();

  const router = useRouter();
  const [editorMode, setEditorMode] = useState<NoteEditorMode>("note");
  const [todoEditMode, setTodoEditMode] = useState(false);
  const [actionSheetVisible, setActionSheetVisible] = useState(false);
  const [folderPickerVisible, setFolderPickerVisible] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  const storePath = useNotePath(noteId, initialPath ?? (template === "todo" ? "Todos/Daily routine.md" : "Untitled.md"));
  const { activePath, setActivePath, content, setContent, isLoaded, loadError, baseMtimeRef, reloadNote } =
    useEditorNoteLoader({ storePath, noteId, preset, template, folder });

  const isTodoNote =
    template === "todo" || /todos[/$]/i.test(activePath) || activePath.toLowerCase().endsWith("todos.md") || Boolean(initialPath?.toLowerCase().includes("todo"));

  useEffect(() => {
    if (content) setEditorMode(getNoteMode(content));
  }, [activePath, content]);

  useFocusEffect(useCallback(() => { void reloadNote(); }, [reloadNote]));

  const {
    tabs, activeTabId, isNewTabPage: tabIsNewTab, drawerVisible, setDrawerVisible,
    tabSwitcherVisible, setTabSwitcherVisible, handleSelectTab,
    handleCloseTab, handleSelectNoteFromDrawer,
  } = useEditorTabManager({
    activePath, content, router,
    onSelectNotePath: (note) => { setActivePath(note); setTodoEditMode(false); },
  });

  const isNewTabPage = !initialPath && tabIsNewTab;
  const pathRef = useRef<string>(activePath);
  pathRef.current = activePath;

  const { saveError, conflictContent, flushTrigger, handleDocChanged, handleFlushAck, handleBack, handleRetrySave, handleOverwriteConflict, handleReloadDisk, triggerAppBackgroundFlush } =
    useEditorSaveManager({
      noteId, pathRef, baseMtimeRef, setActivePath, setContent,
      onBack: () => { if (router.canGoBack()) router.back(); },
    });

  const onDocChangedWrapped = useCallback((notif: DocChangeNotification, bytes: number) => {
    handleDocChanged(notif, bytes);
    if (notif.content) updateActiveTabContent(notif.content);
  }, [handleDocChanged]);

  const handleToggleEditorMode = useCallback((nextMode: NoteEditorMode) => {
    setEditorMode(nextMode);
    const updated = setNoteModeInContent(content, nextMode);
    setContent(updated);
    onDocChangedWrapped({ docLength: updated.length, changeCount: 1, excerpt: updated.slice(0, 50), timestamp: Date.now(), content: updated }, updated.length);
  }, [content, setContent, onDocChangedWrapped]);

  const handleTodoContentChange = useCallback((newText: string) => {
    setContent(newText);
    onDocChangedWrapped({ docLength: newText.length, changeCount: 1, excerpt: newText.slice(0, 50), timestamp: Date.now(), content: newText }, newText.length);
  }, [setContent, onDocChangedWrapped]);

  const [actionTrigger, setActionTrigger] = useState<{ id: number; action: ToolbarActionType } | null>(null);
  const [insertTrigger, setInsertTrigger] = useState<{ id: number; text: string } | null>(null);
  const shouldAutoFocus = autoFocus === "1" || preset === "new";
  const [focusTrigger] = useState<number>(shouldAutoFocus ? 1 : 0);

  const { handleMediaAction } = useMediaCaptureActions((markdown) => {
    setInsertTrigger({ id: Date.now(), text: markdown });
  });

  useEffect(() => {
    const s = Keyboard.addListener("keyboardDidShow", () => setIsKeyboardVisible(true));
    const h = Keyboard.addListener("keyboardDidHide", () => setIsKeyboardVisible(false));
    return () => { s.remove(); h.remove(); };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => { if (state !== "active") triggerAppBackgroundFlush(); });
    return () => sub.remove();
  }, [triggerAppBackgroundFlush]);

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => { void handleBack(); return true; });
    return () => sub.remove();
  }, [handleBack]);

  const handleCreateNoteInFolder = useCallback((chosenFolder: string) => {
    createUnsavedNewTab();
    router.replace({ pathname: "/editor", params: { preset: "new", autoFocus: "1", folder: chosenFolder } });
  }, [router]);

  const title = activePath.replace(/\.md$/i, "").split("/").pop() ?? "Untitled";

  return (
    <View className="flex-1" style={{ flex: 1, backgroundColor: tokens.color.bg.primary, paddingTop: insets.top }}>
      {isNewTabPage ? (
        <NewTabPage
          onOpenSidebar={() => setDrawerVisible(true)}
          onOpenActions={() => setActionSheetVisible(true)}
          onOpenSettings={() => router.push("/settings")}
          onOpenSearch={() => router.push("/search")}
          onOpenTodos={() => router.push("/todos")}
          onNewNote={() => setFolderPickerVisible(true)}
          onNewTodoList={() => handleCreateNoteInFolder("Todos")}
        />
      ) : (
        <>
          <EditorHeader
            mode={editorMode}
            onBack={handleBack}
            onToggleMode={handleToggleEditorMode}
            onOpenDrawer={() => setDrawerVisible(true)}
            onOpenActions={() => setActionSheetVisible(true)}
            onOpenSearch={() => router.push("/search")}
            onOpenTodos={() => router.push("/todos")}
          />

          {!isTodoNote || todoEditMode ? (
            <EditorTitleHeader
              activePath={activePath}
              textColor={tokens.color.text.normal}
              onPathChange={(nextPath) => { setActivePath(nextPath); router.setParams({ path: nextPath }); }}
            />
          ) : null}

          {loadError ? (
            <View className="m-4 p-4 rounded-lg bg-accent-critical/10 border border-accent-critical">
              <Text variant="body" color="error">{loadError}</Text>
            </View>
          ) : null}

          {saveError ? <EditorSaveErrorBanner error={saveError} onRetry={handleRetrySave} /> : null}
          {conflictContent !== null ? (
            <EditorConflictBanner onOverwrite={() => void handleOverwriteConflict()} onReload={() => void handleReloadDisk()} />
          ) : null}

          <View style={{ flex: 1, width: "100%" }}>
            {isTodoNote && !todoEditMode ? (
              <TodoView content={content} onContentChange={handleTodoContentChange} onSwitchToEditor={() => setTodoEditMode(true)} title={title} />
            ) : isLoaded ? (
              <EditorDom
                key={`${noteId || activePath}-${editorMode}`}
                dom={{
                  useExpoDOMWebView: false, matchContents: false, scrollEnabled: true, focusable: true,
                  injectedJavaScriptBeforeContentLoaded: buildEditorInjectedScript(content, activePath, themeCss ?? ""),
                  containerStyle: { flex: 1, width: "100%", height: "100%" },
                  style: { flex: 1, width: "100%", height: "100%" },
                }}
                initialContent={encodePayload(content)}
                notePath={activePath}
                editorMode={editorMode}
                themeCss={themeCss}
                onDocChanged={onDocChangedWrapped}
                onFlushAck={handleFlushAck}
                onMetricsUpdate={() => {}}
                actionTrigger={actionTrigger}
                focusTrigger={focusTrigger}
                flushTrigger={flushTrigger}
                insertTrigger={insertTrigger ? { id: insertTrigger.id, text: encodePayload(insertTrigger.text) } : null}
              />
            ) : null}
          </View>
        </>
      )}

      {!isNewTabPage && isKeyboardVisible ? (
        <FormattingToolbar
          onAction={(action) => {
            if (action === "camera" || action === "photo" || action === "audio") void handleMediaAction(action);
            else setActionTrigger({ id: Date.now(), action });
          }}
        />
      ) : null}

      <EditorBottomBar
        onBack={handleBack}
        onForward={() => {}}
        onSearch={() => router.push("/search")}
        onNewNote={() => setFolderPickerVisible(true)}
        onTabs={() => setTabSwitcherVisible(true)}
        onMenu={() => router.push("/settings")}
        tabCount={tabs.length}
      />

      <EditorDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onSelectNote={handleSelectNoteFromDrawer}
        onCreateNote={() => setFolderPickerVisible(true)}
      />

      <TabSwitcherModal
        visible={tabSwitcherVisible}
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={() => { openNewTabLanding(); setTabSwitcherVisible(false); }}
        onDone={() => setTabSwitcherVisible(false)}
      />

      <NoteActionSheet
        visible={actionSheetVisible}
        onClose={() => setActionSheetVisible(false)}
        editorMode={editorMode}
        onSelectMode={(mode) => { handleToggleEditorMode(mode); setActionSheetVisible(false); }}
        onOpenSettings={() => { setActionSheetVisible(false); router.push("/settings"); }}
      />

      <SelectFolderModal visible={folderPickerVisible} onClose={() => setFolderPickerVisible(false)} onSelectFolder={handleCreateNoteInFolder} />
    </View>
  );
}
