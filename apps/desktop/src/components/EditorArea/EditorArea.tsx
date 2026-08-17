import { lazy, Suspense, useCallback, useMemo } from "react";
import { Editor } from "@app/editor";
import { FileText } from "@phosphor-icons/react";
import { parseFrontmatter } from "@app/indexer";
import { EmptyState } from "../EmptyState";
import { PropertiesBlock } from "../PropertiesBlock";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  readNote,
  writeNote,
  writeBinaryFile,
  persistNote,
  noteFromMarkdown,
  getVaultIndexDb,
} from "../../vault";

const LazyCanvasView = lazy(() =>
  import("@app/canvas").then((m) => ({
    default: m.CanvasView,
  })),
);

export interface EditorAreaProps {
  activeNotePath: string | null;
  allNotePaths: string[];
  onLinkClick: (target: string) => void;
}

export function EditorArea({
  activeNotePath,
  allNotePaths,
  onLinkClick,
}: EditorAreaProps) {
  const content = useWorkspaceStore(
    (state) => (activeNotePath ? state.notesContent[activeNotePath] : "") || "",
  );
  const notesContent = useWorkspaceStore((state) => state.notesContent);
  const updateNoteContent = useWorkspaceStore(
    (state) => state.updateNoteContent,
  );
  const openNote = useWorkspaceStore((state) => state.openNote);

  const { frontmatter } = useMemo(
    () => (activeNotePath ? parseFrontmatter(content) : { frontmatter: {} }),
    [activeNotePath, content],
  );

  const displayTitle = useMemo(() => {
    if (!activeNotePath) return "";
    return (
      activeNotePath
        .replace(/\.(md|canvas)$/i, "")
        .split("/")
        .pop() ?? activeNotePath
    );
  }, [activeNotePath]);

  const handleReadNote = useCallback(async (path: string) => {
    const file = await readNote(path);
    return file.content;
  }, []);

  const handleCreateNote = useCallback(
    async (title: string, noteContent?: string) => {
      const cleanTitle = title.trim();
      const newPath = cleanTitle.endsWith(".md")
        ? cleanTitle
        : `${cleanTitle}.md`;
      const defaultContent =
        noteContent !== undefined ? noteContent : `# ${cleanTitle}\n\n`;
      await writeNote(newPath, defaultContent);
      const db = await getVaultIndexDb();
      const currentPaths = useWorkspaceStore.getState().allNotePaths;
      const updatedPaths = currentPaths.includes(newPath)
        ? currentPaths
        : [...currentPaths, newPath];
      const note = noteFromMarkdown(
        newPath,
        defaultContent,
        Date.now(),
        updatedPaths,
      );
      await persistNote(db, note);
      useWorkspaceStore.getState().updateAllPaths(updatedPaths);
      return newPath;
    },
    [],
  );

  const vaultPath = useWorkspaceStore((state) => state.vaultPath);

  const handleResolveMediaUrl = useCallback(
    (filePath: string) => {
      if (
        !filePath ||
        filePath.startsWith("data:") ||
        filePath.startsWith("blob:") ||
        filePath.startsWith("http://") ||
        filePath.startsWith("https://")
      ) {
        return filePath;
      }
      const absolutePath = vaultPath
        ? `${vaultPath.replace(/\/+$/, "")}/${filePath.replace(/^\/+/, "")}`
        : filePath;
      try {
        return convertFileSrc(absolutePath);
      } catch {
        return filePath;
      }
    },
    [vaultPath],
  );

  const handleSaveMediaFile = useCallback(
    async (fileName: string, data: Uint8Array): Promise<string> => {
      await writeBinaryFile(fileName, data);
      const currentPaths = useWorkspaceStore.getState().allNotePaths;
      if (!currentPaths.includes(fileName)) {
        useWorkspaceStore.getState().updateAllPaths([...currentPaths, fileName]);
      }
      return fileName;
    },
    [],
  );

  const isCanvas = activeNotePath?.endsWith(".canvas") ?? false;

  return (
    <div className="editor-area">
      {activeNotePath ? (
        isCanvas ? (
          <Suspense fallback={null}>
            <LazyCanvasView
              key={activeNotePath}
              path={activeNotePath}
              initialContent={content}
              onContentChange={(p, c) => updateNoteContent(p, c)}
              allNotePaths={allNotePaths}
              notesContent={notesContent}
              readNoteContent={handleReadNote}
              onOpenFile={(targetPath) => void openNote(targetPath)}
              onCreateNote={handleCreateNote}
              resolveMediaUrl={handleResolveMediaUrl}
              onSaveMediaFile={handleSaveMediaFile}
            />
          </Suspense>
        ) : (
          <div className="editor-area__container">
            <div className="editor-area__header">
              <h1 className="editor-area__title">{displayTitle}</h1>
              <PropertiesBlock
                frontmatter={frontmatter}
                onLinkClick={onLinkClick}
              />
            </div>
            <div className="editor-area__body">
              <Editor
                key={activeNotePath}
                value={content}
                onChange={(newVal) => updateNoteContent(activeNotePath, newVal)}
                notePaths={allNotePaths}
                sourcePath={activeNotePath}
                onLinkClick={onLinkClick}
              />
            </div>
          </div>
        )
      ) : (
        <EmptyState
          size="lg"
          icon={<FileText weight="regular" />}
          title="No Note Open"
          description="Select a note from the sidebar, press Cmd+K to search, or click 'New Note' to start writing."
        />
      )}
    </div>
  );
}
