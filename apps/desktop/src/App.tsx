import { useEffect, useRef, useState } from "react";
import { Button, Typography } from "@app/design-system";
import { Editor } from "@app/editor";
import { FileTree } from "./components/FileTree";
import { BacklinksPanel } from "./components/BacklinksPanel";
import { LocalGraphPanel } from "./components/LocalGraphPanel";
import { GlobalGraphDialog } from "./components/GlobalGraphDialog";
import { CommandPalette } from "./components/CommandPalette";
import { SettingsDialog } from "./components/SettingsDialog";
import { EmptyState } from "./components/EmptyState";
import {
  FolderOpen,
  WarningCircle,
  FileText,
  Gear,
} from "@phosphor-icons/react";
import styles from "./App.module.scss";
import { useWorkspaceStore } from "./state/useWorkspaceStore";
import {
  getVaultIndexDb,
  openAndIndexVault,
  openAndIndexVaultFromPicker,
  reconcileVaultChanges,
  subscribeVaultChanges,
  vaultWatchCoordinator,
  listNotes,
  writeNote,
  persistNote,
  noteFromMarkdown,
  queryFullGraphIndex,
} from "./vault";
import type { GraphIndex } from "@app/indexer";

const FIXTURE_VAULT = __FIXTURE_VAULT_PATH__;
const LARGE_FIXTURE_VAULT = __LARGE_FIXTURE_VAULT_PATH__;

export function App() {
  const [log, setLog] = useState<string[]>([]);
  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isGlobalGraphOpen, setIsGlobalGraphOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoadingVault, setIsLoadingVault] = useState(false);
  const [vaultError, setVaultError] = useState<string | null>(null);
  const [graph, setGraph] = useState<GraphIndex | null>(null);
  const reconcileCount = useRef(0);

  // Zustand state select
  const {
    activeNotePath,
    openNotes,
    notesContent,
    dirtyNotes,
    allNotePaths,
    initializeVault,
    updateAllPaths,
    incrementVaultUpdateCounter,
    openNote,
    closeNote,
    setActiveNote,
    updateNoteContent,
    editorFont,
    loadSettings,
  } = useWorkspaceStore();

  // Load settings on mount
  useEffect(() => {
    void loadSettings();
  }, [loadSettings]);

  // Apply editor font globally
  useEffect(() => {
    if (editorFont === "system") {
      document.body.style.setProperty("--font-editor", "var(--font-ui)");
    } else if (editorFont === "monospace") {
      document.body.style.setProperty(
        "--font-editor",
        "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
      );
    } else if (editorFont === "inter") {
      document.body.style.setProperty("--font-editor", "'Inter', sans-serif");
    } else if (editorFont === "roboto") {
      document.body.style.setProperty("--font-editor", "'Roboto', sans-serif");
    }
  }, [editorFont]);

  const append = (line: string) => {
    setLog((prev) => [...prev.slice(-12), line]);
    console.info(`[vault] ${line}`);
  };

  // Sync vault loader
  const handleVaultLoaded = async (
    path: string,
    count: number,
    elapsed: number,
  ) => {
    setVaultPath(path);
    append(`indexed ${count} notes in ${elapsed} ms (${path})`);
    const paths = await listNotes();
    await initializeVault(paths);

    // Load the full graph index
    const db = await getVaultIndexDb();
    const fullGraph = await queryFullGraphIndex(db);
    setGraph(fullGraph);
  };

  const openFixture = async () => {
    setIsLoadingVault(true);
    setVaultError(null);
    try {
      const result = await openAndIndexVault(FIXTURE_VAULT);
      await handleVaultLoaded(
        result.vaultPath,
        result.noteCount,
        result.elapsedMs,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      append(msg);
      setVaultError(msg);
    } finally {
      setIsLoadingVault(false);
    }
  };

  const openLargeFixture = async () => {
    setIsLoadingVault(true);
    setVaultError(null);
    try {
      const result = await openAndIndexVault(LARGE_FIXTURE_VAULT);
      await handleVaultLoaded(
        result.vaultPath,
        result.noteCount,
        result.elapsedMs,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      append(msg);
      setVaultError(msg);
    } finally {
      setIsLoadingVault(false);
    }
  };

  const openPicker = async () => {
    setIsLoadingVault(true);
    setVaultError(null);
    try {
      const result = await openAndIndexVaultFromPicker();
      await handleVaultLoaded(
        result.vaultPath,
        result.noteCount,
        result.elapsedMs,
      );
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      append(msg);
      setVaultError(msg);
    } finally {
      setIsLoadingVault(false);
    }
  };

  // Create note helper
  const createNewNote = async (title: string) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    const newPath = cleanTitle.endsWith(".md")
      ? cleanTitle
      : `${cleanTitle}.md`;
    if (allNotePaths.includes(newPath)) {
      append(`Note already exists: ${newPath}`);
      await openNote(newPath);
      return;
    }

    const defaultContent = `# ${cleanTitle}\n\n`;
    try {
      // Suppress watcher while writing to avoid index loop
      await writeNote(newPath, defaultContent);
      const db = await getVaultIndexDb();
      const updatedPaths = [...allNotePaths, newPath];
      const note = noteFromMarkdown(
        newPath,
        defaultContent,
        Date.now(),
        updatedPaths,
      );
      await persistNote(db, note);

      updateAllPaths(updatedPaths);
      await openNote(newPath);
      append(`Created new note: ${newPath}`);
    } catch (e) {
      append(
        `Error creating note: ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  };

  const handleCreateNotePrompt = () => {
    const title = prompt("Enter note title:");
    if (title) {
      createNewNote(title);
    }
  };

  // Follow wikilink click navigation
  const handleLinkClick = async (targetRaw: string) => {
    const targetLower = targetRaw.toLowerCase();

    // Resolve link to an existing path (case-insensitive filename stem comparison)
    const foundPath = allNotePaths.find((path) => {
      const stem = path.replace(/\.md$/i, "").split("/").pop() ?? path;
      return stem.toLowerCase() === targetLower;
    });

    if (foundPath) {
      await openNote(foundPath);
    } else {
      // Unresolved link click creates the note
      await createNewNote(targetRaw);
    }
  };

  // Command Palette global shortcut
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

  // Watcher subscription
  useEffect(() => {
    let unlisten: (() => void) | undefined;

    subscribeVaultChanges(async (batch) => {
      if (!vaultWatchCoordinator.shouldProcessBatch()) {
        return;
      }
      reconcileCount.current += 1;
      append(
        `watcher batch #${reconcileCount.current}: +${batch.changed.length} ~${batch.removed.length} removed`,
      );

      const { updated } = await reconcileVaultChanges(batch);
      append(`reconciled ${updated} path(s) in SQLite`);

      // Update paths list in store
      const paths = await listNotes();
      updateAllPaths(paths);
      incrementVaultUpdateCounter();

      // Update graph
      const db = await getVaultIndexDb();
      const fullGraph = await queryFullGraphIndex(db);
      setGraph(fullGraph);

      // Handle deleted notes
      for (const removed of batch.removed) {
        if (openNotes.includes(removed)) {
          await closeNote(removed);
        }
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, [openNotes, closeNote, updateAllPaths]);

  // Render vault picker if no vault loaded
  if (!vaultPath) {
    let emptyStateContent;
    if (isLoadingVault) {
      emptyStateContent = (
        <EmptyState
          size="lg"
          icon={<FolderOpen weight="regular" />}
          title="Indexing Vault..."
          description="Parsing markdown files and building the link graph. This may take a moment for large vaults."
        />
      );
    } else if (vaultError) {
      emptyStateContent = (
        <EmptyState
          size="lg"
          icon={<WarningCircle weight="regular" />}
          title="Failed to open vault"
          description={vaultError}
          action={
            <Button variant="primary" onClick={() => setVaultError(null)}>
              Try Again
            </Button>
          }
        />
      );
    } else {
      emptyStateContent = (
        <EmptyState
          size="lg"
          icon={<FolderOpen weight="regular" />}
          title="No Vault Open"
          description="Select a folder or a fixture vault to open the editor."
          action={
            <div className={styles.actions}>
              <Button variant="primary" onClick={() => void openFixture()}>
                Open fixture
              </Button>
              <Button
                variant="secondary"
                onClick={() => void openLargeFixture()}
              >
                Index large fixture (350 notes)
              </Button>
              <Button variant="secondary" onClick={() => void openPicker()}>
                Pick folder &amp; index
              </Button>
            </div>
          }
        />
      );
    }

    return (
      <main className={styles.shell}>
        <section className={styles.content}>
          <Typography variant="h1" size="2xl">
            DaVinci Notes
          </Typography>
          {emptyStateContent}
          {log.length > 0 && (
            <pre className={styles["debug-log"]}>{log.join("\n")}</pre>
          )}
        </section>
      </main>
    );
  }

  const vaultName = vaultPath.split(/[/\\]/).pop() || vaultPath;

  return (
    <div className={styles.layout}>
      {/* Sidebar note list */}
      <aside className={"sidebar"}>
        <div className={"sidebar-header"}>
          <Typography variant="h3" size="lg" className={"sidebar-title"}>
            {vaultName}
          </Typography>
          <div className={"actions"}>
            <Button variant="primary" onClick={handleCreateNotePrompt}>
              New Note
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsGlobalGraphOpen(true)}
            >
              Global Graph
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsSettingsOpen(true)}
              title="Settings"
            >
              <Gear size={16} />
            </Button>
            <Button variant="secondary" onClick={() => setVaultPath(null)}>
              Close Vault
            </Button>
          </div>
        </div>
        <div className={"sidebar-content"}>
          <FileTree
            paths={allNotePaths}
            activePath={activeNotePath}
            dirtyPaths={dirtyNotes}
            onNoteClick={(path) => void openNote(path)}
          />
        </div>
        {log.length > 0 && (
          <pre className={styles["debug-log"]}>{log.join("\n")}</pre>
        )}
      </aside>

      {/* Editor Main Content Area */}
      <main className={"main-area"}>
        {/* Open notes tabs */}
        <div className={"tabs-bar"}>
          {openNotes.map((path) => {
            const displayTitle =
              path.replace(/\.md$/i, "").split("/").pop() ?? path;
            const isActive = activeNotePath === path;
            const isDirty = dirtyNotes.has(path);
            return (
              <div
                key={path}
                className={`${styles.tab} ${isActive ? styles.active : ""}`}
                onClick={() => void setActiveNote(path)}
              >
                <span>{displayTitle}</span>
                {isDirty && <span className={"dirty-dot"} />}
                <span
                  className={"close-tab"}
                  onClick={(e) => {
                    e.stopPropagation();
                    void closeNote(path);
                  }}
                >
                  ✕
                </span>
              </div>
            );
          })}
        </div>

        {/* Editor Wrapper */}
        <div className={"editor-wrapper"}>
          {activeNotePath ? (
            <Editor
              key={activeNotePath}
              value={notesContent[activeNotePath] || ""}
              onChange={(newVal) => updateNoteContent(activeNotePath, newVal)}
              notePaths={allNotePaths}
              sourcePath={activeNotePath}
              onLinkClick={(t) => void handleLinkClick(t)}
            />
          ) : (
            <EmptyState
              size="lg"
              icon={<FileText weight="regular" />}
              title="No Note Open"
              description="Select a note from the sidebar, press Cmd+K to search, or click 'New Note' to start writing."
            />
          )}
        </div>
      </main>

      <aside className={styles["right-sidebar"]}>
        <LocalGraphPanel
          graph={graph}
          activePath={activeNotePath}
          onSelectNote={(path) => void openNote(path)}
        />
        <BacklinksPanel
          activePath={activeNotePath}
          onSelectNote={(path) => void openNote(path)}
        />
      </aside>

      <GlobalGraphDialog
        isOpen={isGlobalGraphOpen}
        onOpenChange={setIsGlobalGraphOpen}
        graph={graph}
        onNavigate={(path) => void openNote(path)}
      />

      <SettingsDialog
        isOpen={isSettingsOpen}
        onOpenChange={setIsSettingsOpen}
        vaultPath={vaultPath}
        onVaultSwitched={async (newPath) => {
          setIsSettingsOpen(false);
          setIsLoadingVault(true);
          setVaultPath(null);
          try {
            const result = await openAndIndexVault(newPath);
            await handleVaultLoaded(
              result.vaultPath,
              result.noteCount,
              result.elapsedMs,
            );
          } catch (error) {
            setVaultError(
              error instanceof Error ? error.message : String(error),
            );
          } finally {
            setIsLoadingVault(false);
          }
        }}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onSelectNote={(target) => void handleLinkClick(target)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />
    </div>
  );
}
