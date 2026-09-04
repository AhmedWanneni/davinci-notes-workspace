import { executeSearchQuery, parseSearchQuery } from "@app/indexer";
import React, { Suspense, useCallback, useEffect, useRef, useState } from "react";
import type { PluginEditor } from "@app/plugin-api";
import { AppSidebar } from "./components/AppSidebar";
import { AppTabs } from "./components/AppTabs";
import { EditorArea } from "./components/EditorArea";
import { IconRail } from "./components/IconRail";
import { RightSidebar } from "./components/RightSidebar";
import { PluginViewLeaf } from "./components/PluginViewLeaf";
import { StatusBar } from "./components/StatusBar";
import { VaultWelcomeView } from "./components/VaultWelcomeView";
import { useWorkspaceStore } from "./state/useWorkspaceStore";
import { usePluginStore } from "./state/usePluginStore";
import { useThemeStore } from "./state/useThemeStore";
import {
  getDriveAccessToken,
  openDriveAuthorizationUrl,
  signInToDrive,
  signOutOfDrive,
} from "./sync/desktopDriveAuth";
import { getVaultIndexDb, openAndIndexVault, useVaultSession } from "./vault";
import { revealCitationLine, type CitationNavigationTarget } from "./ai/citationNavigation";
import { loadAISubsystem } from "./ai/loadAISubsystem";

const LazyGlobalGraphDialog = React.lazy(() =>
  import("./components/GlobalGraphDialog").then((m) => ({
    default: m.GlobalGraphDialog,
  })),
);
const LazySettingsDialog = React.lazy(() =>
  import("./components/SettingsDialog").then((m) => ({
    default: m.SettingsDialog,
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

export function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTagsOpen, setIsTagsOpen] = useState(false);
  const [searchInitialQuery, setSearchInitialQuery] = useState("");
  const [isGlobalGraphOpen, setIsGlobalGraphOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);
  const [aiCloudEnabled, setAiCloudEnabled] = useState(false);
  const [aiProviderName, setAiProviderName] = useState("AI");
  const [aiTransmitting, setAiTransmitting] = useState(false);
  const editorRef = useRef<PluginEditor | null>(null);
  const activeNoteRef = useRef<string | null>(null);
  const pendingCitationRef = useRef<CitationNavigationTarget | null>(null);

  const activeNotePath = useWorkspaceStore((state) => state.activeNotePath);
  activeNoteRef.current = activeNotePath;
  const openNotes = useWorkspaceStore((state) => state.openNotes);
  const dirtyNotes = useWorkspaceStore((state) => state.dirtyNotes);
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const allFolderPaths = useWorkspaceStore((state) => state.allFolderPaths);
  const editorFont = useWorkspaceStore((state) => state.editorFont);
  const notesContent = useWorkspaceStore((state) => state.notesContent);
  const tagIndex = useWorkspaceStore((state) => state.tagIndex);

  const loadSettings = useWorkspaceStore((state) => state.loadSettings);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const closeNote = useWorkspaceStore((state) => state.closeNote);
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
  const duplicateNoteFromTree = useWorkspaceStore(
    (state) => state.duplicateNoteFromTree,
  );
  const moveNoteFromTree = useWorkspaceStore((state) => state.moveNoteFromTree);
  const syncMode = useWorkspaceStore((state) => state.syncMode);
  const setSyncMode = useWorkspaceStore((state) => state.setSyncMode);
  const [pendingRenameFolder, setPendingRenameFolder] = useState<string | null>(
    null,
  );

  const {
    log,
    vaultPath,
    setVaultPath,
    isLoadingVault,
    vaultError,
    setVaultError,
    graph,
    loadVaultByMethod,
    createNewNote,
    createNewFolder,
    createNewCanvas,
    handleLinkClick,
    openFixture,
    openLargeFixture,
    openPicker,
  } = useVaultSession();

  const initPlugins = usePluginStore((state) => state.initPlugins);
  const pluginCommands = usePluginStore((state) => state.commands);
  const pluginManager = usePluginStore((state) => state.pluginManager);
  const openViewId = usePluginStore((state) => state.openViewId);
  const initThemes = useThemeStore((state) => state.initThemes);
  const themes = useThemeStore((state) => state.themes);
  const activeThemeId = useThemeStore((state) => state.activeThemeId);
  const themeManager = useThemeStore((state) => state.themeManager);
  const themeDiscoveryErrors = useThemeStore((state) => state.discoveryErrors);
  const activateTheme = useThemeStore((state) => state.activateTheme);

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const loadAIState = async () => {
      const ai = await loadAISubsystem();
      const provider = await ai.loadSelectedProvider();
      const status = await ai.loadAIProviderStatus(provider);
      setAiProviderName(ai.AI_PROVIDER_NAMES[provider]);
      setAiCloudEnabled(status === "ready" || (provider === "openai-compatible" && await ai.loadAIConsent("cloud")));
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
      window.removeEventListener("davinci-ai-transmission-start", startTransmission);
      window.removeEventListener("davinci-ai-transmission-end", endTransmission);
    };
  }, [vaultPath]);

  useEffect(() => {
    void initPlugins(vaultPath);
  }, [vaultPath, initPlugins]);

  useEffect(() => {
    void initThemes(vaultPath);
  }, [vaultPath, initThemes]);

  useEffect(() => {
    const root = document.body.style;
    if (editorFont === "system") {
      root.setProperty("--font-editor", "var(--font-ui)");
    } else if (editorFont === "monospace") {
      root.setProperty(
        "--font-editor",
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      );
    } else if (editorFont === "inter") {
      root.setProperty("--font-editor", "'Inter', sans-serif");
    } else if (editorFont === "roboto") {
      root.setProperty("--font-editor", "'Roboto', sans-serif");
    }
  }, [editorFont]);

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if (
        (e.metaKey || e.ctrlKey) &&
        e.shiftKey &&
        e.key.toLowerCase() === "f"
      ) {
        e.preventDefault();
        setSearchInitialQuery("");
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const handleDailyNotes = () => {
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
  };

  const handleCreateNote = () => {
    void createNewNote();
  };

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

  const handleEditorReady = useCallback((editor: PluginEditor | null) => {
    editorRef.current = editor;
    const target = pendingCitationRef.current;
    if (editor && target && activeNoteRef.current === target.notePath) {
      revealCitationLine(editor, target);
      pendingCitationRef.current = null;
    }
  }, []);

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

  useEffect(() => {
    const handleCitation = (event: Event) => {
      const detail = (event as CustomEvent<CitationNavigationTarget>).detail;
      if (!detail?.notePath || !Number.isFinite(detail.startLine)) return;
      void handleOpenCitation(detail.notePath, detail.startLine);
    };
    window.addEventListener("davinci-ai-open-citation", handleCitation);
    return () => window.removeEventListener("davinci-ai-open-citation", handleCitation);
  }, [handleOpenCitation]);

  const handleCreateFolder = async (parentFolder = "") => {
    const folderPath = await createNewFolder(parentFolder);
    if (folderPath) {
      setPendingRenameFolder(folderPath);
    }
    return folderPath;
  };

  const handleDriveSignIn = async () => {
    try {
      await signInToDrive(openDriveAuthorizationUrl);
      window.alert("Drive sign-in complete.");
    } catch (error) {
      window.alert(
        `Drive sign-in failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDriveRefresh = async () => {
    try {
      await getDriveAccessToken();
      window.alert("Drive session is valid.");
    } catch (error) {
      window.alert(
        `Drive session check failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleDriveDisconnect = async () => {
    try {
      await signOutOfDrive();
      window.alert("Drive disconnected.");
    } catch (error) {
      window.alert(
        `Drive disconnect failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  if (!vaultPath) {
    return (
      <VaultWelcomeView
        isLoadingVault={isLoadingVault}
        vaultError={vaultError}
        log={log}
        onClearError={() => setVaultError(null)}
        onOpenFixture={openFixture}
        onOpenLargeFixture={openLargeFixture}
        onOpenPicker={openPicker}
      />
    );
  }

  const vaultName = vaultPath.split(/[/\\]/).pop() || vaultPath;
  const activeContent = activeNotePath
    ? (notesContent[activeNotePath] ?? "")
    : "";

  return (
    <div
      className="app-shell"
      data-left-collapsed={!isLeftSidebarOpen || undefined}
      data-right-collapsed={!isRightSidebarOpen || undefined}
    >
      <header className="app-shell__top-bar">
        <AppTabs
          openNotes={openNotes}
          activeNotePath={activeNotePath}
          dirtyNotes={dirtyNotes}
          onSelectNote={(path) => void setActiveNote(path)}
          onCloseNote={(path) => void closeNote(path)}
          onNewTab={handleCreateNote}
          isRightSidebarOpen={isRightSidebarOpen}
          onToggleRightSidebar={() => setIsRightSidebarOpen((prev) => !prev)}
        />
      </header>

      <div className="app-shell__body">
        <IconRail
          isLeftSidebarOpen={isLeftSidebarOpen}
          onToggleLeftSidebar={() => setIsLeftSidebarOpen((prev) => !prev)}
          onOpenSearch={() => {
            setSearchInitialQuery("");
            setIsSearchOpen(true);
          }}
          onOpenGlobalGraph={() => setIsGlobalGraphOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onCloseVault={() => setVaultPath(null)}
          onDailyNotes={handleDailyNotes}
          onCreateCanvas={handleCreateCanvas}
        />

        <AppSidebar
          vaultName={vaultName}
          allNotePaths={allNotePaths}
          allFolderPaths={allFolderPaths}
          activeNotePath={activeNotePath}
          dirtyNotes={dirtyNotes}
          log={log}
          isCollapsed={!isLeftSidebarOpen}
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
          onDuplicateNote={(path) => duplicateNoteFromTree(path)}
          onMoveNote={(path, newParentFolder) =>
            moveNoteFromTree(path, newParentFolder)
          }
          pendingRenameFolder={pendingRenameFolder}
          onPendingRenameFolderHandled={() => setPendingRenameFolder(null)}
        />

        <main className="app-shell__main">
          {openViewId && pluginManager ? (
            <PluginViewLeaf manager={pluginManager} viewId={openViewId} />
          ) : (
            <EditorArea
              activeNotePath={activeNotePath}
              allNotePaths={allNotePaths}
              onLinkClick={(t) => void handleLinkClick(t)}
              onTagClick={handleTagClick}
              pluginManager={pluginManager}
              onEditorReady={handleEditorReady}
            />
          )}
        </main>

        <RightSidebar
          graph={graph}
          activePath={activeNotePath}
          isCollapsed={!isRightSidebarOpen}
          onSelectNote={(path) => void openNote(path)}
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
            onSearch={async (query) =>
              executeSearchQuery(
                await getVaultIndexDb(),
                tagIndex,
                parseSearchQuery(query),
              )
            }
            onSelectNote={(path) => void openNote(path)}
          />
        )}
        {isTagsOpen && (
          <LazyTagsDialog
            isOpen={isTagsOpen}
            onOpenChange={setIsTagsOpen}
            onSelectTag={handleSelectTag}
          />
        )}
        {isGlobalGraphOpen && (
          <LazyGlobalGraphDialog
            isOpen={isGlobalGraphOpen}
            onOpenChange={setIsGlobalGraphOpen}
            graph={graph}
            onNavigate={(path) => void openNote(path)}
          />
        )}
        {isSettingsOpen && (
          <LazySettingsDialog
            isOpen={isSettingsOpen}
            onOpenChange={setIsSettingsOpen}
            vaultPath={vaultPath}
            syncMode={syncMode}
            onSelectSyncMode={setSyncMode}
            onVaultSwitched={(newPath) => {
              setIsSettingsOpen(false);
              void loadVaultByMethod(() => openAndIndexVault(newPath));
            }}
            onDriveSignIn={() => void handleDriveSignIn()}
            onDriveRefresh={() => void handleDriveRefresh()}
            onDriveDisconnect={() => void handleDriveDisconnect()}
            themes={themes}
            activeThemeId={activeThemeId}
            themeDiscoveryErrors={themeDiscoveryErrors}
            onActivateTheme={activateTheme}
            themeManager={themeManager}
            onReloadThemes={() => initThemes(vaultPath)}
            onActivateThemeFromBrowser={activateTheme}
          />
        )}
        {isCommandPaletteOpen && (
          <LazyCommandPalette
            isOpen={isCommandPaletteOpen}
            onOpenChange={setIsCommandPaletteOpen}
            onSelectNote={(target) => void handleLinkClick(target)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenTags={() => setIsTagsOpen(true)}
            onDriveSignIn={() => void handleDriveSignIn()}
            onDriveRefresh={() => void handleDriveRefresh()}
            onDriveDisconnect={() => void handleDriveDisconnect()}
            pluginCommands={pluginCommands}
          />
        )}
      </Suspense>
    </div>
  );
}
