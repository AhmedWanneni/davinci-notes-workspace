import { lazy, Suspense, useCallback, useMemo } from "react";
import { Editor, pastedFileName } from "@app/editor";
import { resolveAttachmentFolder } from "@app/attachments";
import { CaretLeft, CaretRight, FileText } from "@phosphor-icons/react";
import { parseFrontmatter } from "@app/indexer";
import { EmptyState } from "../EmptyState";
import { PropertiesBlock } from "../PropertiesBlock";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  readNote,
  writeBinaryFile,
  writeAttachmentToVault,
  createNoteInVault,
} from "../../vault";
import type { PluginLifecycleManager } from "@app/plugin-runtime";
import type { PluginEditor } from "@app/plugin-api";

const LazyCanvasView = lazy(() =>
  import("@app/canvas").then((m) => ({
    default: m.CanvasView,
  })),
);

export interface EditorAreaProps {
  activeNotePath: string | null;
  allNotePaths: string[];
  onLinkClick: (target: string) => void;
  onTagClick: (tagKey: string) => void;
  pluginManager?: PluginLifecycleManager | null;
  onEditorReady?: (editor: PluginEditor | null) => void;
}

export function EditorArea({
  activeNotePath,
  allNotePaths,
  onLinkClick,
  onTagClick,
  pluginManager,
  onEditorReady,
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
      if (!cleanTitle) {
        throw new Error("Note title is required");
      }
      const newPath = cleanTitle.endsWith(".md")
        ? cleanTitle
        : `${cleanTitle}.md`;
      return createNoteInVault(newPath, noteContent);
    },
    [],
  );

  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const attachmentSettings = useWorkspaceStore(
    (state) => state.attachmentSettings,
  );
  const useVimMode = useWorkspaceStore((state) => state.useVimMode);
  const setVimModeState = useWorkspaceStore((state) => state.setVimModeState);
  const saveNoteNow = useWorkspaceStore((state) => state.saveNoteNow);
  const closeNote = useWorkspaceStore((state) => state.closeNote);
  const closeAllNotes = useWorkspaceStore((state) => state.closeAllNotes);

  const handlePasteAttachment = useCallback(
    async (file: File): Promise<string> => {
      if (!vaultPath || !activeNotePath) {
        throw new Error("Open a vault and note before pasting an attachment.");
      }
      const folder = resolveAttachmentFolder(
        activeNotePath,
        attachmentSettings,
      );
      const writtenPath = await writeAttachmentToVault(
        vaultPath,
        folder,
        pastedFileName(file),
        file,
      );
      const vaultPrefix = `${vaultPath.replaceAll("\\", "/").replace(/\/+$/u, "")}/`;
      const linkTarget = writtenPath.startsWith(vaultPrefix)
        ? writtenPath.slice(vaultPrefix.length)
        : writtenPath;
      return `![[${linkTarget.replaceAll("\\", "/")}]]`;
    },
    [activeNotePath, attachmentSettings, vaultPath],
  );

  const handleAttachmentError = useCallback((message: string) => {
    window.alert(`Attachment paste failed: ${message}`);
  }, []);

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
        useWorkspaceStore
          .getState()
          .updateAllPaths([...currentPaths, fileName]);
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
              <div className="editor-area__note-header" data-tauri-drag-region>
                <div className="editor-area__note-header-actions">
                  <button
                    type="button"
                    className="editor-area__note-header-button"
                    aria-label="Go back"
                    disabled
                  >
                    <CaretLeft size={16} weight="regular" />
                  </button>
                  <button
                    type="button"
                    className="editor-area__note-header-button"
                    aria-label="Go forward"
                    disabled
                  >
                    <CaretRight size={16} weight="regular" />
                  </button>
                </div>
                <span
                  className="editor-area__note-header-title"
                  data-tauri-drag-region
                  title={displayTitle}
                >
                  {displayTitle}
                </span>
                <div className="editor-area__note-header-actions" />
              </div>
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
                onTagClick={onTagClick}
                onPasteAttachment={handlePasteAttachment}
                onAttachmentError={handleAttachmentError}
                resolveMediaUrl={handleResolveMediaUrl}
                useVimMode={useVimMode}
                onVimModeChange={setVimModeState}
                onSaveNoteNow={saveNoteNow}
                onCloseNote={closeNote}
                onCloseAllNotes={closeAllNotes}
                onEditorReady={(editor) => {
                  pluginManager?.setEditor(editor);
                  onEditorReady?.(editor);
                }}
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
