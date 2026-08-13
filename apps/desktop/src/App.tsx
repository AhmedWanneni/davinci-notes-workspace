import React, { Suspense, useEffect, useState } from "react";
import { useWorkspaceStore } from "./state/useWorkspaceStore";
import { VaultWelcomeView } from "./components/VaultWelcomeView";
import { AppSidebar } from "./components/AppSidebar";
import { AppTabs } from "./components/AppTabs";
import { EditorArea } from "./components/EditorArea";
import { RightSidebar } from "./components/RightSidebar";
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

  const activeNotePath = useWorkspaceStore((state) => state.activeNotePath);
  const openNotes = useWorkspaceStore((state) => state.openNotes);
  const dirtyNotes = useWorkspaceStore((state) => state.dirtyNotes);
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const editorFont = useWorkspaceStore((state) => state.editorFont);

  const loadSettings = useWorkspaceStore((state) => state.loadSettings);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const closeNote = useWorkspaceStore((state) => state.closeNote);
  const setActiveNote = useWorkspaceStore((state) => state.setActiveNote);

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

  return (
    <div className="app-shell">
      <AppSidebar
        vaultName={vaultName}
        allNotePaths={allNotePaths}
        activeNotePath={activeNotePath}
        dirtyNotes={dirtyNotes}
        log={log}
        onCreateNote={() => {
          const title = prompt("Enter note title:");
          if (title) void createNewNote(title);
        }}
        onOpenGlobalGraph={() => setIsGlobalGraphOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onCloseVault={() => setVaultPath(null)}
        onNoteClick={(path) => void openNote(path)}
      />

      <main className="app-shell__main">
        <AppTabs
          openNotes={openNotes}
          activeNotePath={activeNotePath}
          dirtyNotes={dirtyNotes}
          onSelectNote={(path) => void setActiveNote(path)}
          onCloseNote={(path) => void closeNote(path)}
        />
        <EditorArea
          activeNotePath={activeNotePath}
          allNotePaths={allNotePaths}
          onLinkClick={(t) => void handleLinkClick(t)}
        />
      </main>

      <RightSidebar
        graph={graph}
        activePath={activeNotePath}
        onSelectNote={(path) => void openNote(path)}
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
