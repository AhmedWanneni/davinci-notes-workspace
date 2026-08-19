import React, { Suspense, useEffect, useState } from "react";
import { useWorkspaceStore } from "./state/useWorkspaceStore";
import { VaultWelcomeView } from "./components/VaultWelcomeView";
import { IconRail } from "./components/IconRail";
import { AppSidebar } from "./components/AppSidebar";
import { AppTabs } from "./components/AppTabs";
import { EditorArea } from "./components/EditorArea";
import { RightSidebar } from "./components/RightSidebar";
import { StatusBar } from "./components/StatusBar";
import { openAndIndexVault, useVaultSession } from "./vault";

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

export function App() {
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isGlobalGraphOpen, setIsGlobalGraphOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLeftSidebarOpen, setIsLeftSidebarOpen] = useState(true);
  const [isRightSidebarOpen, setIsRightSidebarOpen] = useState(true);

  const activeNotePath = useWorkspaceStore((state) => state.activeNotePath);
  const openNotes = useWorkspaceStore((state) => state.openNotes);
  const dirtyNotes = useWorkspaceStore((state) => state.dirtyNotes);
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const allFolderPaths = useWorkspaceStore((state) => state.allFolderPaths);
  const editorFont = useWorkspaceStore((state) => state.editorFont);
  const notesContent = useWorkspaceStore((state) => state.notesContent);

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

  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

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

  const handleCreateCanvas = () => {
    void createNewCanvas();
  };

  const handleCreateFolder = async (parentFolder = "") => {
    const folderPath = await createNewFolder(parentFolder);
    if (folderPath) {
      setPendingRenameFolder(folderPath);
    }
    return folderPath;
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
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
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
          pendingRenameFolder={pendingRenameFolder}
          onPendingRenameFolderHandled={() => setPendingRenameFolder(null)}
        />

        <main className="app-shell__main">
          <EditorArea
            activeNotePath={activeNotePath}
            allNotePaths={allNotePaths}
            onLinkClick={(t) => void handleLinkClick(t)}
          />
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
      />

      <Suspense fallback={null}>
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
            onVaultSwitched={(newPath) => {
              setIsSettingsOpen(false);
              void loadVaultByMethod(() => openAndIndexVault(newPath));
            }}
          />
        )}
        {isCommandPaletteOpen && (
          <LazyCommandPalette
            isOpen={isCommandPaletteOpen}
            onOpenChange={setIsCommandPaletteOpen}
            onSelectNote={(target) => void handleLinkClick(target)}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
        )}
      </Suspense>
    </div>
  );
}
