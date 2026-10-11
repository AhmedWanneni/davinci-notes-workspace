import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { EditorView } from "@codemirror/view";
import { Editor, type EditorPluginAdapter } from "@app/editor";
import {
  CaretLeft,
  CaretRight,
  DotsThree,
  FileText,
} from "@phosphor-icons/react";
import { parseFrontmatter } from "@app/indexer";
import { EmptyState } from "../EmptyState";
import { PropertiesBlock } from "../PropertiesBlock";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { readNote, createNoteInVault } from "../../vault";
import type { PluginLifecycleManager } from "@app/plugin-runtime";
import { EditorConflictBanner } from "./EditorConflictBanner";
import { useEditorMediaHandlers } from "./useEditorMediaHandlers";

const LazyCanvasView = lazy(() =>
  import("@app/canvas").then((m) => ({
    default: m.CanvasView,
  })),
);
const LazyInsertMenu = lazy(() => import("./InsertMenu").then((m) => ({ default: m.InsertMenu })));

export interface EditorAreaProps {
  activeNotePath: string | null;
  allNotePaths: string[];
  onLinkClick: (target: string) => void;
  onTagClick: (tagKey: string) => void;
  pluginManager?: PluginLifecycleManager | null;
  onEditorReady?: (editor: EditorPluginAdapter | null) => void;
  onViewReady?: (view: EditorView | null) => void;
}

export function EditorArea({
  activeNotePath,
  allNotePaths,
  onLinkClick,
  onTagClick,
  pluginManager,
  onEditorReady,
  onViewReady,
}: EditorAreaProps) {
  const content = useWorkspaceStore(
    (state) => (activeNotePath ? state.notesContent[activeNotePath] : "") || "",
  );
  const notesContent = useWorkspaceStore((state) => state.notesContent);
  const updateNoteContent = useWorkspaceStore(
    (state) => state.updateNoteContent,
  );
  const openNote = useWorkspaceStore((state) => state.openNote);
  const noteHistory = useWorkspaceStore((state) => state.noteHistory);
  const goBack = useWorkspaceStore((state) => state.goBack);
  const goForward = useWorkspaceStore((state) => state.goForward);
  const conflictNotes = useWorkspaceStore((state) => state.conflictNotes);
  const resolveConflict = useWorkspaceStore((state) => state.resolveConflict);
  const editorViewRef = useRef<EditorView | null>(null);
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);
  const [insertAnchor, setInsertAnchor] = useState<DOMRect | null>(null);
  const insertSelectionRef = useRef<import("@codemirror/state").EditorSelection | null>(null);

  const {
    handlePasteAttachment,
    handleAttachmentError,
    handleResolveMediaUrl,
    handleSaveMediaFile,
  } = useEditorMediaHandlers(activeNotePath);

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

  const useVimMode = useWorkspaceStore((state) => state.useVimMode);
  const slashMenuEnabled = useWorkspaceStore((state) => state.slashMenuEnabled);
  const vimMonospaceMode = useWorkspaceStore((state) => state.vimMonospaceMode);
  const editorFont = useWorkspaceStore((state) => state.editorFont);
  const editorCustomFont = useWorkspaceStore((state) => state.editorCustomFont);
  const editorFontSize = useWorkspaceStore((state) => state.editorFontSize);
  const setVimModeState = useWorkspaceStore((state) => state.setVimModeState);
  const vimMode = useWorkspaceStore((state) => state.vimMode);
  const saveNoteNow = useWorkspaceStore((state) => state.saveNoteNow);
  const closeNote = useWorkspaceStore((state) => state.closeNote);
  const closeAllNotes = useWorkspaceStore((state) => state.closeAllNotes);

  const isCanvas = activeNotePath?.endsWith(".canvas") ?? false;
  const hasConflict = activeNotePath
    ? conflictNotes.has(activeNotePath)
    : false;

  useEffect(() => {
    editorViewRef.current?.requestMeasure();
    editorViewRef.current?.focus();
  }, [
    editorFontSize,
    editorFont,
    editorCustomFont,
    useVimMode,
    vimMonospaceMode,
    activeNotePath,
  ]);

  return (
    <div
      className="editor-area"
      style={{ "--editor-font-size": `${editorFontSize}px` } as CSSProperties}
    >
      {activeNotePath ? (
        isCanvas ? (
          <Suspense
            fallback={
              <div className="canvas-view-loading">Loading canvas...</div>
            }
          >
            <LazyCanvasView
              canvasPath={activeNotePath}
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
                    disabled={noteHistory.index <= 0}
                    onClick={() => void goBack()}
                  >
                    <CaretLeft size={16} weight="regular" />
                  </button>
                  <button
                    type="button"
                    className="editor-area__note-header-button"
                    aria-label="Go forward"
                    disabled={noteHistory.index >= noteHistory.paths.length - 1}
                    onClick={() => void goForward()}
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
                <div className="editor-area__note-header-actions">
                  <button
                    type="button"
                    className="editor-area__note-header-button"
                    aria-label="Insert"
                    aria-expanded={isInsertMenuOpen}
                    onClick={(event) => {
                      const view = editorViewRef.current;
                      if (!view) return;
                      insertSelectionRef.current = view.state.selection;
                      setInsertAnchor(event.currentTarget.getBoundingClientRect());
                      setIsInsertMenuOpen(true);
                    }}
                  >
                    <DotsThree size={16} weight="regular" />
                  </button>
                  {isInsertMenuOpen && insertAnchor && editorViewRef.current && insertSelectionRef.current && (
                    <Suspense fallback={null}>
                      <LazyInsertMenu anchor={insertAnchor} selection={insertSelectionRef.current} view={editorViewRef.current} onClose={() => setIsInsertMenuOpen(false)} />
                    </Suspense>
                  )}
                </div>
              </div>
              <PropertiesBlock
                frontmatter={frontmatter}
                onLinkClick={onLinkClick}
              />
            </div>
            {hasConflict && activeNotePath && (
              <EditorConflictBanner
                onKeepMine={() =>
                  void resolveConflict(activeNotePath, "keep_mine")
                }
                onUseDisk={() =>
                  void resolveConflict(activeNotePath, "use_disk")
                }
                onSaveCopy={() =>
                  void resolveConflict(activeNotePath, "save_copy")
                }
              />
            )}
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
                slashMenuEnabled={slashMenuEnabled}
                vimMode={vimMode}
                onVimModeChange={setVimModeState}
                onSaveNoteNow={saveNoteNow}
                onCloseNote={closeNote}
                onCloseAllNotes={closeAllNotes}
                onEditorReady={(editor) => {
                  pluginManager?.setEditor(editor);
                  onEditorReady?.(editor);
                }}
                onViewReady={(view) => {
                  editorViewRef.current = view;
                  onViewReady?.(view);
                  view?.focus();
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
