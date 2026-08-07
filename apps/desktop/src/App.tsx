import { useEffect, useRef, useState } from "react";
import { Button, Typography } from "@app/design-system";
import { Editor } from "@app/editor";
import { FileTree } from "./components/FileTree";
import { BacklinksPanel } from "./components/BacklinksPanel";
import { CommandPalette } from "./components/CommandPalette";
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
} from "./vault";

const FIXTURE_VAULT = __FIXTURE_VAULT_PATH__;
const LARGE_FIXTURE_VAULT = __LARGE_FIXTURE_VAULT_PATH__;

export function App() {
  const [log, setLog] = useState<string[]>([]);
  const [vaultPath, setVaultPath] = useState<string | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
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
  } = useWorkspaceStore();

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
  };

  const openFixture = async () => {
    try {
      const result = await openAndIndexVault(FIXTURE_VAULT);
      await handleVaultLoaded(
        result.vaultPath,
        result.noteCount,
        result.elapsedMs,
      );
    } catch (error) {
      append(error instanceof Error ? error.message : String(error));
    }
  };

  const openLargeFixture = async () => {
    try {
      const result = await openAndIndexVault(LARGE_FIXTURE_VAULT);
      await handleVaultLoaded(
        result.vaultPath,
        result.noteCount,
        result.elapsedMs,
      );
    } catch (error) {
      append(error instanceof Error ? error.message : String(error));
    }
  };

  const openPicker = async () => {
    try {
      const result = await openAndIndexVaultFromPicker();
      await handleVaultLoaded(
        result.vaultPath,
        result.noteCount,
        result.elapsedMs,
      );
    } catch (error) {
      append(error instanceof Error ? error.message : String(error));
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
    return (
      <main className={styles.shell}>
        <section className={styles.content}>
          <Typography variant="h1" size="2xl">
            DaVinci Notes
          </Typography>
          <Typography variant="text" color="muted">
            Select a folder or fixture vault to open the editor.
          </Typography>
          <div className={styles.actions}>
            <Button variant="primary" onClick={() => void openFixture()}>
              Open fixture vault
            </Button>
            <Button variant="secondary" onClick={() => void openLargeFixture()}>
              Index large fixture (350 notes)
            </Button>
            <Button variant="secondary" onClick={() => void openPicker()}>
              Pick folder &amp; index
            </Button>
          </div>
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
            <div className={"empty-state"}>
              <Typography variant="text" color="muted">
                No note open. Select a note from the sidebar or click "New
                Note".
              </Typography>
            </div>
          )}
        </div>
      </main>

      <BacklinksPanel
        activePath={activeNotePath}
        onSelectNote={(path) => void openNote(path)}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onOpenChange={setIsCommandPaletteOpen}
        onSelectNote={(target) => void handleLinkClick(target)}
      />
    </div>
  );
}
