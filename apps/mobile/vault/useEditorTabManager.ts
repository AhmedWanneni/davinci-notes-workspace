import { useState, useEffect, useRef, useCallback } from "react";
import type { useRouter } from "expo-router";
import {
  useTabStore,
  getTabStoreState,
  openNoteInTab,
  createUnsavedNewTab,
  closeTab,
  setActiveTabId,
} from "./tabStore";

export interface UseEditorTabManagerParams {
  activePath: string;
  content: string;
  router: ReturnType<typeof useRouter>;
  onSelectNotePath?: (path: string) => void;
}

export function useEditorTabManager({
  activePath,
  content,
  router,
  onSelectNotePath,
}: UseEditorTabManagerParams) {
  const { tabs, activeTabId } = useTabStore();
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const isNewTabPage = activeTab?.isNewTab === true;

  const [drawerVisible, setDrawerVisible] = useState(false);
  const [tabSwitcherVisible, setTabSwitcherVisible] = useState(false);
  const lastRegisteredPathRef = useRef<string>("");

  useEffect(() => {
    if (!isNewTabPage && activePath && activePath !== lastRegisteredPathRef.current) {
      lastRegisteredPathRef.current = activePath;
      openNoteInTab(activePath, content);
    }
  }, [activePath, isNewTabPage, content]);

  const handleSelectTab = useCallback(
    (tabId: string) => {
      setActiveTabId(tabId);
      const t = getTabStoreState().tabs.find((x) => x.id === tabId);
      if (t && !t.isNewTab) {
        lastRegisteredPathRef.current = t.path;
        router.push({ pathname: "/editor", params: { path: t.path, mode: "edit" } });
      }
      setTabSwitcherVisible(false);
    },
    [router],
  );

  const handleCloseTab = useCallback(
    (tabId: string) => {
      const wasActive = tabId === getTabStoreState().activeTabId;
      closeTab(tabId);
      if (wasActive) {
        const nextState = getTabStoreState();
        const nextActive = nextState.tabs.find((x) => x.id === nextState.activeTabId);
        if (nextActive && !nextActive.isNewTab) {
          lastRegisteredPathRef.current = nextActive.path;
          router.replace({ pathname: "/editor", params: { path: nextActive.path, mode: "edit" } });
        }
      }
    },
    [router],
  );

  const handleCreateNewNote = useCallback(
    (template?: string) => {
      createUnsavedNewTab();
      const target = template === "todo" ? "Todos/Daily routine.md" : "Untitled.md";
      lastRegisteredPathRef.current = target;
      router.replace({
        pathname: "/editor",
        params: { preset: "new", autoFocus: "1", ...(template ? { template } : {}) },
      });
    },
    [router],
  );

  const handleSelectNoteFromDrawer = useCallback(
    (note: string) => {
      lastRegisteredPathRef.current = note;
      openNoteInTab(note);
      setDrawerVisible(false);
      if (onSelectNotePath) {
        onSelectNotePath(note);
      }
      router.setParams({ path: note, preset: undefined, template: undefined, mode: "edit" });
    },
    [router, onSelectNotePath],
  );

  return {
    tabs,
    activeTabId,
    isNewTabPage,
    drawerVisible,
    setDrawerVisible,
    tabSwitcherVisible,
    setTabSwitcherVisible,
    handleSelectTab,
    handleCloseTab,
    handleCreateNewNote,
    handleSelectNoteFromDrawer,
  };
}
