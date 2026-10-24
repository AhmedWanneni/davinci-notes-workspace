import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getPlatformAdapters,
  type VaultFileEntry,
} from "@app/platform-adapters";
import { parseFrontmatter, parseLinks, parseNoteTags } from "@app/indexer";
import {
  FeatureNoticeBanner,
  VaultChooserModal,
  type DegradedWebFeature,
  type WebVaultEngineMode,
} from "./components";
import { vaultArchive } from "./vault";

export interface AppProps {
  readonly initialVaultRoot?: string;
  readonly supportsFileSystemAccess?: boolean;
  readonly onSwitchEngine?: (mode: WebVaultEngineMode) => Promise<string>;
}

export function App({
  initialVaultRoot = "vault",
  supportsFileSystemAccess = typeof window !== "undefined" &&
    "showDirectoryPicker" in window,
  onSwitchEngine,
}: AppProps) {
  const [vaultRoot, setVaultRoot] = useState<string>(initialVaultRoot);
  const [files, setFiles] = useState<VaultFileEntry[]>([]);
  const [activePath, setActivePath] = useState<string | null>(null);
  const [activeContent, setActiveContent] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showChooser, setShowChooser] = useState<boolean>(false);
  const [activeNotice, setActiveNotice] =
    useState<DegradedWebFeature | null>(null);
  const [archiveStatus, setArchiveStatus] = useState<string>("");

  const refreshVault = useCallback(
    async (root: string) => {
      const { fs } = getPlatformAdapters();
      const entries = await fs.listEntries(root || undefined);
      const mdFiles = entries
        .filter((e) => e.kind === "file" && e.name.endsWith(".md"))
        .sort((a, b) => a.name.localeCompare(b.name));
      setFiles(mdFiles);
      if (mdFiles.length > 0 && !activePath) {
        const first = mdFiles[0];
        setActivePath(first.path);
        const text = await fs.readTextFile(first.path);
        setActiveContent(text);
      }
    },
    [activePath]
  );

  useEffect(() => {
    void refreshVault(vaultRoot);
  }, [vaultRoot, refreshVault]);

  const handleSelectNote = async (path: string) => {
    const { fs } = getPlatformAdapters();
    setActivePath(path);
    const content = await fs.readTextFile(path);
    setActiveContent(content);
  };

  const handleUpdateContent = async (nextContent: string) => {
    setActiveContent(nextContent);
    if (!activePath) return;
    const { fs } = getPlatformAdapters();
    await fs.writeTextFile(activePath, nextContent);
  };

  const handleCreateNote = async (noteName: string) => {
    const clean = noteName.endsWith(".md") ? noteName : `${noteName}.md`;
    const cleanRoot = vaultRoot.replace(/^\/+|\/+$/g, "");
    const fullPath = cleanRoot ? `${cleanRoot}/${clean}` : clean;
    const initialBody = `# ${clean.replace(/\.md$/, "")}\n\n`;
    const { fs } = getPlatformAdapters();
    await fs.writeTextFile(fullPath, initialBody);
    await refreshVault(vaultRoot);
    setActivePath(fullPath);
    setActiveContent(initialBody);
  };

  const handleExportArchive = async () => {
    const { fs } = getPlatformAdapters();
    const bytes = await vaultArchive.exportVaultArchive(fs, vaultRoot);
    setArchiveStatus(`Exported ${bytes.byteLength} bytes`);
  };

  const parsedMetadata = useMemo(() => {
    if (!activePath) return { links: [], tags: [] };
    const { frontmatter, content } = parseFrontmatter(activeContent);
    const links = parseLinks(content, {
      sourcePath: activePath,
      notePaths: files.map((f) => f.path),
    });
    const tagSet = parseNoteTags(frontmatter, content);
    return { links, tags: tagSet.all.map((t) => t.key) };
  }, [activePath, activeContent, files]);

  const filteredFiles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return files;
    return files.filter((file) => file.name.toLowerCase().includes(q));
  }, [files, searchQuery]);

  return (
    <div className="web-app-shell">
      <header className="web-app-topbar">
        <h1 className="web-app-brand">DaVinci Notes Web</h1>
        <div className="web-app-actions">
          <input
            type="search"
            className="web-app-search-input"
            placeholder="Filter notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Filter notes"
          />
          <button
            type="button"
            onClick={() => void handleCreateNote(`Note-${files.length + 1}`)}
          >
            New Note
          </button>
          <button type="button" onClick={() => void handleExportArchive()}>
            Export Vault
          </button>
          <button type="button" onClick={() => setShowChooser((v) => !v)}>
            Switch Storage
          </button>
          <button type="button" onClick={() => setActiveNotice("local-git")}>
            Git Status
          </button>
        </div>
      </header>

      {activeNotice ? (
        <FeatureNoticeBanner
          feature={activeNotice}
          onDismiss={() => setActiveNotice(null)}
        />
      ) : null}

      {archiveStatus ? (
        <div className="web-app-archive-status" role="status">
          {archiveStatus}
        </div>
      ) : null}

      {showChooser ? (
        <VaultChooserModal
          supportsFileSystemAccess={supportsFileSystemAccess}
          onSelectEngine={async (mode) => {
            if (onSwitchEngine) {
              const nextRoot = await onSwitchEngine(mode);
              setVaultRoot(nextRoot);
            }
            setShowChooser(false);
          }}
        />
      ) : null}

      <main className="web-app-workspace">
        <nav className="web-app-sidebar" aria-label="Vault files">
          <ul className="web-app-file-list">
            {filteredFiles.map((file) => (
              <li key={file.path} className="web-app-file-item">
                <button
                  type="button"
                  className={file.path === activePath ? "is-active" : ""}
                  onClick={() => void handleSelectNote(file.path)}
                >
                  {file.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <section className="web-app-editor-pane">
          {activePath ? (
            <>
              <div className="web-app-note-header">{activePath}</div>
              <textarea
                aria-label="Note markdown editor"
                className="web-app-editor-textarea"
                value={activeContent}
                onChange={(e) => void handleUpdateContent(e.target.value)}
              />
              <footer className="web-app-inspector">
                <span>Outgoing links: {parsedMetadata.links.length}</span>
                <span>Tags: {parsedMetadata.tags.join(", ") || "none"}</span>
              </footer>
            </>
          ) : (
            <p className="web-app-empty-state">No note selected.</p>
          )}
        </section>
      </main>
    </div>
  );
}
