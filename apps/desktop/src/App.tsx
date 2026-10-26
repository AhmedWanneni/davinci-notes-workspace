import { executeSearchQuery, parseSearchQuery } from "@app/indexer";
import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { EditorPluginAdapter } from "@app/editor";
import { loadEditorFont } from "./fonts/editorFontRegistry";
import { AppSidebar } from "./components/AppSidebar";
import { AppTabs } from "./components/AppTabs";
import { EditorArea } from "./components/EditorArea";
import { RightSidebar } from "./components/RightSidebar";
import { PluginViewLeaf } from "./components/PluginViewLeaf";
import { StatusBar } from "./components/StatusBar";
import { VaultWelcomeView } from "./components/VaultWelcomeView";
import { useWorkspaceStore } from "./state/useWorkspaceStore";
import { usePluginStore } from "./state/usePluginStore";
import { useThemeStore } from "./state/useThemeStore";
import { useDriveSyncStore } from "./sync";
import {
  getVaultIndexDb,
  openAndIndexVault,
  renameNote,
  useVaultSession,
  withDbLock,
  writeAttachmentToVault,
} from "./vault";
import {
  revealCitationLine,
  type CitationNavigationTarget,
} from "./ai/citationNavigation";
import { loadAIStartupGate } from "./ai/loadAIStartupGate";
import { useTrayMenuActions, useWindowFullscreen } from "./window";
import { useClipperService } from "./clipper";

const LazyGlobalGraphLeaf = React.lazy(() =>
  import("./components/GlobalGraphLeaf").then((m) => ({
    default: m.GlobalGraphLeaf,
  })),
);
const LazyCalendarLeaf = React.lazy(() =>
  import("./components/CalendarView").then((m) => ({
    default: m.CalendarLeaf,
  })),
);
const LazySettingsDialog = React.lazy(() =>
  import("./components/SettingsDialog").then((m) => ({
    default: m.SettingsDialog,
  })),
);
import type { SettingsTabId } from "./components/SettingsDialog";
import { BOOKMARKS_TAB_ID, useBookmarks } from "./bookmarks";
const LazyBookmarksView = React.lazy(() =>
  import("./components/BookmarksView").then((m) => ({
    default: m.BookmarksView,
  })),
);
import { AGENT_TAB_ID } from "./components/AgentView";
const LazyAgentView = React.lazy(() =>
  import("./components/AgentView").then((m) => ({
    default: m.AgentView,
  })),
);
const LazyCommandPalette = React.lazy(() =>
  import("./components/CommandPalette").then((m) => ({
    default: m.CommandPalette,
  })),
);
const LazySearchDialog = React.lazy(() =>
  import("./components/SearchDialog").then((m) => ({
    default: m.SearchDialog,
  })),
);
const LazyTagsDialog = React.lazy(() =>
  import("./components/TagsDialog").then((m) => ({ default: m.TagsDialog })),
);
const LazyRemindersDialog = React.lazy(() =>
  import("./components/RemindersDialog").then((m) => ({
    default: m.RemindersDialog,
  })),
);
import { isImagePath } from "./components/ImagePreview/imagePreviewUtils";
const LazyImagePreviewLeaf = React.lazy(() =>
  import("./components/ImagePreview/ImagePreviewLeaf").then((m) => ({
    default: m.ImagePreviewLeaf,
  })),
);
import { ReminderNotificationToast } from "./components/RemindersDialog";

export function App() {
  useWindowFullscreen();
  const isMac = navigator.userAgent.includes("Mac");
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState("");
  const isGlobalGraphOpen = useWorkspaceStore(
    (state) => state.isGlobalGraphOpen,
  );
  const setIsGlobalGraphOpen = useWorkspaceStore(
    (state) => state.setIsGlobalGraphOpen,
  );
  const isCalendarOpen = useWorkspaceStore((state) => state.isCalendarOpen);
  const setIsCalendarOpen = useWorkspaceStore(
    (state) => state.setIsCalendarOpen,
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsInitialTab, setSettingsInitialTab] =
    useState<SettingsTabId>("general");
  const handleOpenSettings = useCallback(() => {
    setSettingsInitialTab("general");
    setIsSettingsOpen(true);
  }, []);
  const handleOpenLogs = useCallback(() => {
    setSettingsInitialTab("logs");
    setIsSettingsOpen(true);
  }, []);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(false);
  const [aiCloudEnabled, setAiCloudEnabled] = useState(false);
  const [askVaultEnabled, setAskVaultEnabled] = useState(false);
  const [semanticSearchEnabled, setSemanticSearchEnabled] = useState(false);
  const [suggestLinksEnabled, setSuggestLinksEnabled] = useState(false);
  const [suggestions, setSuggestions] = useState<
    import("./components/SuggestLinksPanel").LinkSuggestion[]
  >([]);
  const [aiProviderName, setAiProviderName] = useState("AI");
  const [aiTransmitting, setAiTransmitting] = useState(false);
  const editorRef = useRef<EditorPluginAdapter | null>(null);
  const editorViewRef = useRef<import("@codemirror/view").EditorView | null>(
    null,
  );
  const activeNoteRef = useRef<string | null>(null);
  const pendingCitationRef = useRef<CitationNavigationTarget | null>(null);

  const activeNotePath = useWorkspaceStore((state) => state.activeNotePath);
  activeNoteRef.current = activeNotePath;
  const openNotes = useWorkspaceStore((state) => state.openNotes);
  const dirtyNotes = useWorkspaceStore((state) => state.dirtyNotes);
  const saveVersionNow = useWorkspaceStore((state) => state.saveVersionNow);
  const { toggleBookmark } = useBookmarks();
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const allFolderPaths = useWorkspaceStore((state) => state.allFolderPaths);
  const editorFont = useWorkspaceStore((state) => state.editorFont);
  const editorCustomFont = useWorkspaceStore((state) => state.editorCustomFont);
  const useVimMode = useWorkspaceStore((state) => state.useVimMode);
  const vimMonospaceMode = useWorkspaceStore((state) => state.vimMonospaceMode);
  const notesContent = useWorkspaceStore((state) => state.notesContent);
  const tagIndex = useWorkspaceStore((state) => state.tagIndex);
  const activeContent = activeNotePath
    ? (notesContent[activeNotePath] ?? "")
    : "";

  const boardNotes = useMemo(() => {
    const set = new Set<string>();
    for (const p of openNotes) {
      const c = notesContent[p];
      if (
        c &&
        /(?:^|\n)\s*kanban-plugin\s*:\s*["']?board["']?\s*(?:\r?\n|$)/.test(c)
      ) {
        set.add(p);
      }
    }
    return set;
  }, [openNotes, notesContent]);

  const databaseNotes = useMemo(() => {
    const set = new Set<string>();
    for (const p of openNotes) {
      const c = notesContent[p];
      if (
        c &&
        /(?:^|\n)\s*database\s*:\s*["']?table["']?\s*(?:\r?\n|$)/.test(c)
      ) {
        set.add(p);
      }
    }
    return set;
  }, [openNotes, notesContent]);

  const loadSettings = useWorkspaceStore((state) => state.loadSettings);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const closeNote = useWorkspaceStore((state) => state.closeNote);
  const closeAllNotes = useWorkspaceStore((state) => state.closeAllNotes);
  const setActiveNote = useWorkspaceStore((state) => state.setActiveNote);
  const renameNoteFromTree = useWorkspaceStore(
    (state) => state.renameNoteFromTree,
  );
  const renameFolderFromTree = useWorkspaceStore(
    (state) => state.renameFolderFromTree,
  );
  const deleteNoteFromTree = useWorkspaceStore(
    (state) => state.deleteNoteFromTree,
  );
  const deleteFolderFromTree = useWorkspaceStore(
    (state) => state.deleteFolderFromTree,
  );
  const duplicateNoteFromTree = useWorkspaceStore(
    (state) => state.duplicateNoteFromTree,
  );
  const moveNoteFromTree = useWorkspaceStore((state) => state.moveNoteFromTree);
  const syncMode = useWorkspaceStore((state) => state.syncMode);
  const setSyncMode = useWorkspaceStore((state) => state.setSyncMode);
  const conflictNotes = useWorkspaceStore((state) => state.conflictNotes);
  const [pendingRenameFolder, setPendingRenameFolder] = useState<string | null>(
    null,
  );
  const [pendingRenameNote, setPendingRenameNote] = useState<string | null>(
    null,
  );

  const {
    log,
    vaultPath,
    setVaultPath,
    isLoadingVault,
    vaultError,
    setVaultError,
    recentVaults,
    handleRemoveRecentVault,
    graph,
    loadVaultByMethod,
    createNewNote,
    createNewFolder,
    createNewCanvas,
    handleLinkClick,
    switchVaultTo,
    createNewVault,
    openFixture,
    openLargeFixture,
    openPicker,
  } = useVaultSession();

  const handleDailyNotes = useCallback(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const dailyPath = `${year}-${month}-${day}.md`;
    if (allNotePaths.includes(dailyPath)) {
      void openNote(dailyPath);
    } else {
      void createNewNote(`${year}-${month}-${day}`);
    }
  }, [allNotePaths, createNewNote, openNote]);

  useTrayMenuActions({
    vaultPath,
    createNewNote: () => createNewNote(),
    onDailyNotes: handleDailyNotes,
    onOpenVault: openPicker,
  });

  // Serve clips the loopback listener hands to this window (ADR-0177).
  useClipperService();

  const initPlugins = usePluginStore((state) => state.initPlugins);
  const pluginCommands = usePluginStore((state) => state.commands);
  const invokePluginCommand = usePluginStore(
    (state) => state.invokePluginCommand,
  );
  const pluginManager = usePluginStore((state) => state.pluginManager);
  const openViewId = usePluginStore((state) => state.openViewId);
  const pluginViewRevision = usePluginStore(
    (state) => state.pluginViewRevision,
  );
  const initThemes = useThemeStore((state) => state.initThemes);
  const themes = useThemeStore((state) => state.themes);
  const activeThemeId = useThemeStore((state) => state.activeThemeId);

  useEffect(() => {
    pluginManager?.setEditor(editorRef.current);
    return () => pluginManager?.setEditor(null);
  }, [pluginManager]);
  const themeManager = useThemeStore((state) => state.themeManager);
  const themeDiscoveryErrors = useThemeStore((state) => state.discoveryErrors);
  const activateTheme = useThemeStore((state) => state.activateTheme);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const loadAIState = async () => {
      const gate = await loadAIStartupGate();
      if (!gate.cloudEnabled && !gate.providerReady) {
        setAiCloudEnabled(false);
        setAskVaultEnabled(false);
        setSemanticSearchEnabled(false);
        setSuggestLinksEnabled(false);
        setAiProviderName("AI");
        return;
      }
      const { loadAISubsystem } = await import("./ai/loadAISubsystem");
      const ai = await loadAISubsystem();
      const provider = await ai.loadSelectedProvider();
      const status = await ai.loadAIProviderStatus(provider);
      const credentialPresent = await ai.hasStoredProviderCredential(provider);
      const providerReady = status === "ready" && credentialPresent;
      if (status === "ready" && !credentialPresent) {
        await ai.saveAIProviderStatus("failed", provider);
      }
      setAiProviderName(ai.AI_PROVIDER_NAMES[provider]);
      setAiCloudEnabled(
        providerReady ||
          (provider === "openai-compatible" &&
            credentialPresent &&
            (await ai.loadAIConsent("cloud"))),
      );
      setAskVaultEnabled(
        providerReady && (await ai.loadAIConsent("ask-vault")),
      );
      setSemanticSearchEnabled(
        providerReady && (await ai.loadAIConsent("semantic-search")),
      );
      setSuggestLinksEnabled(
        providerReady && (await ai.loadAIConsent("suggest-links")),
      );
    };
    const refresh = () => void loadAIState();
    const startTransmission = () => setAiTransmitting(true);
    const endTransmission = () => setAiTransmitting(false);
    window.addEventListener("davinci-ai-state-changed", refresh);
    window.addEventListener("davinci-ai-transmission-start", startTransmission);
    window.addEventListener("davinci-ai-transmission-end", endTransmission);
    void loadAIState();
    return () => {
      window.removeEventListener("davinci-ai-state-changed", refresh);
      window.removeEventListener(
        "davinci-ai-transmission-start",
        startTransmission,
      );
      window.removeEventListener(
        "davinci-ai-transmission-end",
        endTransmission,
      );
    };
  }, [vaultPath]);

  useEffect(() => {
    if (!vaultPath || !aiCloudEnabled) return;
    let cancelled = false;
    void (async () => {
      const { loadAISubsystem } = await import("./ai/loadAISubsystem");
      const ai = await loadAISubsystem();
      const provider = await ai.createConfiguredProvider(
        await ai.loadSelectedProvider(),
      );
      try {
        const index = await ai.createEmbeddingIndex();
        if (!cancelled)
          await (
            await import("./ai/reconcileVaultEmbeddings")
          ).reconcileVaultEmbeddings(index, provider);
      } finally {
        await provider.dispose();
      }
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [aiCloudEnabled, vaultPath]);

  const withConfiguredProvider = useCallback(
    async <T,>(
      work: (
        provider: import("@app/ai-api").AIProvider,
        db: import("@app/ai-embeddings").SqliteLike,
      ) => Promise<T>,
    ) => {
      const { loadAISubsystem } = await import("./ai/loadAISubsystem");
      const ai = await loadAISubsystem();
      const provider = await ai.createConfiguredProvider(
        await ai.loadSelectedProvider(),
      );
      const database = await getVaultIndexDb();
      const db = {
        execute: (sql: string, values?: unknown[]) =>
          withDbLock(() => database.execute(sql, values)),
        select: <R,>(sql: string, values?: unknown[]) =>
          withDbLock(() => database.select<R>(sql, values)),
      };
      try {
        return await work(provider, db);
      } finally {
        await provider.dispose();
      }
    },
    [],
  );

  const handleSemanticSearch = useCallback(
    async (query: string) => {
      if (!semanticSearchEnabled) return [];
      return withConfiguredProvider(async (provider, db) => {
        const { searchEmbeddings } = await import("@app/ai-embeddings");
        return searchEmbeddings(query, provider, db);
      });
    },
    [semanticSearchEnabled, withConfiguredProvider],
  );

  useEffect(() => {
    if (!suggestLinksEnabled || !activeNotePath || !activeContent) {
      setSuggestions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void withConfiguredProvider(async (provider, db) => {
        const { suggestLinks } = await import("@app/ai-embeddings");
        setSuggestions(
          await suggestLinks(activeNotePath, activeContent, provider, db),
        );
      }).catch(() => setSuggestions([]));
    }, 450);
    return () => window.clearTimeout(timer);
  }, [
    activeContent,
    activeNotePath,
    suggestLinksEnabled,
    withConfiguredProvider,
  ]);

  useEffect(() => {
    void initPlugins(vaultPath);
  }, [vaultPath, initPlugins]);

  useEffect(() => {
    void initThemes(vaultPath);
  }, [vaultPath, initThemes]);

  useEffect(() => {
    let cancelled = false;
    const effectiveFont =
      useVimMode && vimMonospaceMode ? "jetbrains-mono" : editorFont;
    void loadEditorFont(effectiveFont, editorCustomFont)
      .then((font) => {
        if (!cancelled) {
          document.body.style.setProperty("--font-editor", font.cssFamily);
        }
      })
      .catch(() => {
        if (!cancelled) {
          document.body.style.setProperty("--font-editor", "var(--font-ui)");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [editorFont, editorCustomFont, useVimMode, vimMonospaceMode]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && (e.key === "k" || e.key === "K")) {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (isMod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setSearchInitialQuery("");
        setIsSearchOpen((prev) => !prev);
      }
      if (isMod && e.shiftKey && e.key.toLowerCase() === "f") {
        e.preventDefault();
        setSearchInitialQuery("");
        setIsSearchOpen((prev) => !prev);
      }
      if (isMod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "d") {
        const active = activeNoteRef.current;
        if (active && !active.startsWith("davinci://")) {
          e.preventDefault();
          void toggleBookmark(active);
        }
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleCreateNote = useCallback(
    async (parentFolder?: string) => {
      const newPath = await createNewNote(undefined, parentFolder ?? "");
      if (newPath) {
        setPendingRenameNote(newPath);
      }
      return newPath;
    },
    [createNewNote],
  );

  const handleCreateNoteFromTabs = useCallback(async () => {
    return createNewNote();
  }, [createNewNote]);

  const handleCreateFolder = useCallback(
    async (parentFolder = "") => {
      const folderPath = await createNewFolder(parentFolder);
      if (folderPath) {
        setPendingRenameFolder(folderPath);
      }
      return folderPath;
    },
    [createNewFolder],
  );

  const handleTagClick = (tagKey: string) => {
    setSearchInitialQuery(`tag:${tagKey}`);
    setIsSearchOpen(true);
  };

  const handleSelectTag = (tagKey: string) => {
    setIsTagsOpen(false);
    handleTagClick(tagKey);
  };

  const handleCreateCanvas = () => {
    void createNewCanvas();
  };

  const handleEditorReady = useCallback(
    (editor: EditorPluginAdapter | null) => {
      editorRef.current = editor;
      const target = pendingCitationRef.current;
      if (editor && target && activeNoteRef.current === target.notePath) {
        revealCitationLine(editor, target);
        pendingCitationRef.current = null;
      }
    },
    [],
  );

  const handleOpenCitation = useCallback(
    async (notePath: string, startLine: number) => {
      const target = { notePath, startLine };
      pendingCitationRef.current = target;
      await openNote(notePath);
      if (editorRef.current && activeNoteRef.current === notePath) {
        revealCitationLine(editorRef.current, target);
        pendingCitationRef.current = null;
      }
    },
    [openNote],
  );

  const handleAskVault = useCallback(async (question: string) => {
    const { askConfiguredVault } = await import("./ai/askConfiguredVault");
    return askConfiguredVault(question);
  }, []);

  useEffect(() => {
    const handleCitation = (event: Event) => {
      const detail = (event as CustomEvent<CitationNavigationTarget>).detail;
      if (!detail?.notePath || !Number.isFinite(detail.startLine)) return;
      void handleOpenCitation(detail.notePath, detail.startLine);
    };
    window.addEventListener("davinci-ai-open-citation", handleCitation);
    return () =>
      window.removeEventListener("davinci-ai-open-citation", handleCitation);
  }, [handleOpenCitation]);

  const handleDropFiles = async (
    targetFolder: string,
    files: readonly File[],
  ) => {
    if (!vaultPath) return;
    for (const file of files) {
      try {
        await writeAttachmentToVault(vaultPath, targetFolder, file.name, file);
      } catch (error) {
        console.error(`Failed to add ${file.name}`, error);
      }
    }
  };

  const handleMoveFile = async (path: string, targetFolder: string) => {
    const fileName = path.split("/").pop();
    if (!fileName) return false;
    const targetPath = targetFolder ? `${targetFolder}/${fileName}` : fileName;
    try {
      await renameNote(path, targetPath);
      return true;
    } catch (error) {
      console.error(`Failed to move ${path}`, error);
      return false;
    }
  };

  const isDriveSignedIn = useDriveSyncStore((state) => state.isDriveSignedIn);
  const driveAccountEmail = useDriveSyncStore(
    (state) => state.driveAccountEmail,
  );
  const isDriveSyncing = useDriveSyncStore((state) => state.isDriveSyncing);
  const lastSyncedAt = useDriveSyncStore((state) => state.lastSyncedAt);
  const syncError = useDriveSyncStore((state) => state.syncError);
  const checkDriveAuth = useDriveSyncStore((state) => state.checkAuthStatus);
  const syncDriveNow = useDriveSyncStore((state) => state.syncNow);
  const signInDrive = useDriveSyncStore((state) => state.signIn);
  const signOutDrive = useDriveSyncStore((state) => state.signOut);

  useEffect(() => {
    void checkDriveAuth();
  }, [checkDriveAuth]);

  useEffect(() => {
    if (vaultPath && syncMode === "drive" && isDriveSignedIn) {
      void syncDriveNow();
    }
  }, [vaultPath, syncMode, isDriveSignedIn, syncDriveNow]);

  const handleOpenVaultFromDrive = useCallback(async () => {
    let signedIn = useDriveSyncStore.getState().isDriveSignedIn;
    if (!signedIn) {
      const ok = await signInDrive();
      if (!ok) return;
      signedIn = true;
    }
    const { pickVaultFolder } = await import("./vault/pickVaultFolder");
    const selected = await pickVaultFolder();
    if (!selected) return;

    await switchVaultTo(selected);
    setSyncMode("drive");
    void syncDriveNow();
  }, [signInDrive, switchVaultTo, setSyncMode, syncDriveNow]);

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    void (async () => {
      try {
        const { listen } = await import("@tauri-apps/api/event");
        unlisten = await listen("davinci-tray-open-reminders", () => {
          setIsRemindersOpen(true);
        });
      } catch {
        // Outside Tauri runtime
      }
    })();
    return () => {
      unlisten?.();
    };
  }, []);

  if (!vaultPath) {
    return (
      <VaultWelcomeView
        isLoadingVault={isLoadingVault}
        vaultError={vaultError}
        recentVaults={recentVaults}
        onClearError={() => setVaultError(null)}
        onOpenFixture={openFixture}
        onOpenLargeFixture={openLargeFixture}
        onOpenPicker={openPicker}
        onCreateNewVault={createNewVault}
        onOpenVaultFromDrive={handleOpenVaultFromDrive}
        onSelectRecentVault={(path) => void switchVaultTo(path)}
        onRemoveRecentVault={(path) => void handleRemoveRecentVault(path)}
      />
    );
  }

  const vaultName = vaultPath.split(/[/\\]/).pop() || vaultPath;

  return (
    <div
      className="app-shell"
      data-left-collapsed={!isLeftSidebarOpen || undefined}
      data-right-collapsed={!isRightSidebarOpen || undefined}
    >
      <div className="app-shell__body">
        <AppSidebar
          vaultName={vaultName}
          vaultPath={vaultPath}
          onSwitchVault={(target) => void switchVaultTo(target)}
          onOpenFolderPicker={openPicker}
          onCreateNewVault={createNewVault}
          onOpenVaultFromDrive={handleOpenVaultFromDrive}
          onSyncVault={isDriveSignedIn ? () => void syncDriveNow() : undefined}
          onOpenSettings={handleOpenSettings}
          onOpenSyncSettings={handleOpenSyncSettings}
          onOpenLogs={handleOpenLogs}
          allNotePaths={allNotePaths}
          allFolderPaths={allFolderPaths}
          activeNotePath={activeNotePath}
          dirtyNotes={dirtyNotes}
          log={log}
          isCollapsed={!isLeftSidebarOpen}
          isMac={isMac}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
          onOpenSearch={() => {
            setSearchInitialQuery("");
            setIsSearchOpen(true);
          }}
          onOpenTags={() => setIsTagsOpen(true)}
          isGlobalGraphOpen={isGlobalGraphOpen}
          isCalendarOpen={isCalendarOpen}
          isBookmarksOpen={activeNotePath === BOOKMARKS_TAB_ID}
          isAgentOpen={activeNotePath === AGENT_TAB_ID}
          isAskVaultOpen={isRightSidebarOpen}
          onOpenGlobalGraph={() => setIsGlobalGraphOpen(!isGlobalGraphOpen)}
          onOpenCalendar={() => setIsCalendarOpen(!isCalendarOpen)}
          onOpenBookmarks={() => void openNote(BOOKMARKS_TAB_ID)}
          onOpenAgent={() => void openNote(AGENT_TAB_ID)}
          onOpenAskVault={() => setIsRightSidebarOpen((prev) => !prev)}
          onCloseVault={() => setVaultPath(null)}
          onDailyNotes={handleDailyNotes}
          onOpenReminders={() => setIsRemindersOpen(true)}
          onCreateNote={handleCreateNote}
          onCreateFolder={handleCreateFolder}
          onCreateCanvas={handleCreateCanvas}
          onNoteClick={(path) => void openNote(path)}
          onRenameNote={(oldPath, newStem) =>
            renameNoteFromTree(oldPath, newStem)
          }
          onRenameFolder={(oldPath, newName) =>
            renameFolderFromTree(oldPath, newName)
          }
          onDeleteNote={(path) => deleteNoteFromTree(path)}
          onDeleteFolder={(path) => deleteFolderFromTree(path)}
          onDuplicateNote={(path) => duplicateNoteFromTree(path)}
          onMoveNote={(path, newParentFolder) =>
            moveNoteFromTree(path, newParentFolder)
          }
          onMoveFile={handleMoveFile}
          onDropFiles={handleDropFiles}
          pendingRenameFolder={pendingRenameFolder}
          pendingRenameNote={pendingRenameNote}
          onPendingRenameFolderHandled={() => setPendingRenameFolder(null)}
          onPendingRenameNoteHandled={() => setPendingRenameNote(null)}
        />

        <main className="app-shell__main">
          <AppTabs
            openNotes={openNotes}
            activeNotePath={activeNotePath}
            dirtyNotes={dirtyNotes}
            conflictNotes={conflictNotes}
            boardNotes={boardNotes}
            databaseNotes={databaseNotes}
            onSelectNote={(path) => void setActiveNote(path)}
            onCloseNote={(path) => void closeNote(path)}
            onCloseAllNotes={() => void closeAllNotes()}
            onCreateNote={handleCreateNoteFromTabs}
            isLeftSidebarOpen={isLeftSidebarOpen}
            onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
            isRightSidebarOpen={isRightSidebarOpen}
            onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
            isMac={isMac}
            showWindowControls={!isLeftSidebarOpen}
          />
          {activeNotePath === BOOKMARKS_TAB_ID ? (
            <Suspense fallback={null}>
              <LazyBookmarksView
                onOpenNote={(path, newTab) => {
                  if (newTab) {
                    void openNote(path);
                  } else {
                    void openNote(path);
                  }
                }}
              />
            </Suspense>
          ) : activeNotePath === AGENT_TAB_ID ? (
            <Suspense fallback={null}>
              <LazyAgentView />
            </Suspense>
          ) : isCalendarOpen ? (
            <Suspense fallback={null}>
              <LazyCalendarLeaf
                onClose={() => setIsCalendarOpen(false)}
                onOpenSettings={handleOpenSettings}
              />
            </Suspense>
          ) : isGlobalGraphOpen ? (
            <Suspense fallback={null}>
              <LazyGlobalGraphLeaf
                graph={graph}
                onClose={() => setIsGlobalGraphOpen(false)}
                onNavigate={(path) => void openNote(path)}
              />
            </Suspense>
          ) : openViewId && pluginManager ? (
            <PluginViewLeaf
              manager={pluginManager}
              viewId={openViewId}
              revision={pluginViewRevision}
            />
          ) : activeNotePath && isImagePath(activeNotePath) ? (
            <Suspense fallback={null}>
              <LazyImagePreviewLeaf
                path={activeNotePath}
                onClose={() => void closeNote(activeNotePath)}
              />
            </Suspense>
          ) : (
            <EditorArea
              activeNotePath={activeNotePath}
              allNotePaths={allNotePaths}
              onLinkClick={(t) => void handleLinkClick(t)}
              onTagClick={handleTagClick}
              pluginManager={pluginManager}
              onEditorReady={handleEditorReady}
              onViewReady={(view) => {
                editorViewRef.current = view;
              }}
              onOpenSyncSettings={handleOpenSyncSettings}
            />
          )}
        </main>

        <RightSidebar
          graph={graph}
          activePath={activeNotePath}
          isCollapsed={!isRightSidebarOpen}
          onSelectNote={(path) => void openNote(path)}
          suggestLinksEnabled={suggestLinksEnabled}
          suggestions={suggestions}
          onInsertSuggestedLink={(path) =>
            editorRef.current?.insertText(`[[${path}]]`)
          }
          askVaultEnabled={askVaultEnabled}
          onAskVault={handleAskVault}
        />
      </div>

      <StatusBar
        vaultName={vaultName}
        activeNotePath={activeNotePath}
        content={activeContent}
        graph={graph}
        aiCloudEnabled={aiCloudEnabled}
        aiTransmitting={aiTransmitting}
        aiProviderName={aiProviderName}
      />

      <Suspense fallback={null}>
        {isSearchOpen && tagIndex && (
          <LazySearchDialog
            isOpen={isSearchOpen}
            onOpenChange={setIsSearchOpen}
            initialQuery={searchInitialQuery}
            openNotes={openNotes}
            onSearch={async (query) => {
              const db = await getVaultIndexDb();
              return withDbLock(() =>
                executeSearchQuery(db, tagIndex, parseSearchQuery(query)),
              );
            }}
            onSelectNote={(path) => void openNote(path)}
            semanticSearch={
              semanticSearchEnabled ? handleSemanticSearch : undefined
            }
          />
        )}
        {isTagsOpen && (
          <LazyTagsDialog
            isOpen={isTagsOpen}
            onOpenChange={setIsTagsOpen}
            onSelectTag={handleSelectTag}
          />
        )}
        {isRemindersOpen && (
          <LazyRemindersDialog
            isOpen={isRemindersOpen}
            onOpenChange={setIsRemindersOpen}
            onSelectNote={(path) => void openNote(path)}
          />
        )}
        <ReminderNotificationToast
          onSelectNote={(path) => void openNote(path)}
        />
        {isSettingsOpen && (
          <LazySettingsDialog
            isOpen={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            vaultPath={vaultPath}
            syncMode={syncMode}
            onSelectSyncMode={setSyncMode}
            isDriveSignedIn={isDriveSignedIn}
            driveAccountEmail={driveAccountEmail}
            isDriveSyncing={isDriveSyncing}
            lastSyncedAt={lastSyncedAt}
            syncError={syncError}
            onDriveSignIn={() => void signInDrive()}
            onDriveRefresh={() => void checkDriveAuth()}
            onDriveDisconnect={() => void signOutDrive()}
            onDriveSyncNow={() => void syncDriveNow()}
            onVaultSwitched={(newPath) => {
              setIsSettingsOpen(false);
              void loadVaultByMethod(() => openAndIndexVault(newPath));
            }}
            themes={themes}
            activeThemeId={activeThemeId}
            themeDiscoveryErrors={themeDiscoveryErrors}
            onActivateTheme={activateTheme}
            themeManager={themeManager}
            onReloadThemes={() => initThemes(vaultPath)}
            onActivateThemeFromBrowser={activateTheme}
            log={log}
            initialTab={settingsInitialTab}
          />
        )}
        {isCommandPaletteOpen && (
          <LazyCommandPalette
            isOpen={isCommandPaletteOpen}
            onOpenChange={setIsCommandPaletteOpen}
            onSelectNote={(target) => void handleLinkClick(target)}
            onOpenSettings={handleOpenSettings}
            onOpenLogs={handleOpenLogs}
            onOpenTags={() => setIsTagsOpen(true)}
            onOpenReminders={() => setIsRemindersOpen(true)}
            onSaveVersionNow={() => {
              if (activeNotePath) void saveVersionNow(activeNotePath);
            }}
            onToggleBookmark={() => {
              if (activeNotePath && !activeNotePath.startsWith("davinci://")) {
                void toggleBookmark(activeNotePath);
              }
            }}
            onOpenBookmarks={() => void openNote(BOOKMARKS_TAB_ID)}
            onDriveSignIn={() => void signInDrive()}
            onDriveRefresh={() => void checkDriveAuth()}
            onDriveDisconnect={() => void signOutDrive()}
            pluginCommands={pluginCommands}
            onInvokePluginCommand={(id) => void invokePluginCommand(id)}
            editorView={editorViewRef.current}
          />
        )}
      </Suspense>
    </div>
  );
}
