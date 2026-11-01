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
  BookmarkSimple,
  CaretLeft,
  CaretRight,
  DotsThree,
  FileText,
  Image as ImageIcon,
  Kanban as KanbanIcon,
  Table as TableIcon,
} from "@phosphor-icons/react";
import { parseFrontmatter } from "@app/indexer";
import { EmptyState } from "../EmptyState";
import { PropertiesBlock } from "../PropertiesBlock";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { readNote, createNoteInVault } from "../../vault";
import type { PluginLifecycleManager } from "@app/plugin-runtime";
import { EditorConflictBanner } from "./EditorConflictBanner";
import { EditorInsertTray } from "./EditorInsertTray";
import { SyncStatusButton } from "../SyncStatusButton";
import { useEditorMediaHandlers } from "./useEditorMediaHandlers";
import { NoteCoverImage } from "./NoteCoverImage";
import { useNoteCoverImage } from "./useNoteCoverImage";
import { stripNoteMetadata } from "./stripNoteMetadata";
import { useBookmarks } from "../../bookmarks";

const LazyCoverImagePickerModal = lazy(() =>
  import("./CoverImagePickerModal").then((m) => ({
    default: m.CoverImagePickerModal,
  })),
);

const LazyCanvasView = lazy(() =>
  import("@app/canvas").then((m) => ({
    default: m.CanvasView,
  })),
);
const LazyKanbanView = lazy(() =>
  import("@app/kanban").then((m) => ({
    default: m.KanbanView,
  })),
);
const LazyDatabaseView = lazy(() =>
  import("@app/database").then((m) => ({
    default: m.DatabaseView,
  })),
);
const LazyInsertMenu = lazy(() =>
  import("./InsertMenu").then((m) => ({ default: m.InsertMenu })),
);
const LazyInsertDialog = lazy(() =>
  import("./InsertDialog").then((m) => ({ default: m.InsertDialog })),
);
const LazyReminderEditModal = lazy(() =>
  import("./ReminderEditModal").then((m) => ({
    default: m.ReminderEditModal,
  })),
);
import {
  useInsertDialogRequest,
  completeInsertDialog,
  cancelInsertDialog,
  runInsertItem,
  findInsertItem,
  type ReminderClickInfo,
  pathStem,
} from "@app/editor";
import { EditorFormattingToolbar } from "./EditorFormattingToolbar";
import { EditorAiSelectionTrigger } from "./EditorAiSelectionTrigger";
import { EditorAiSelectionPopover } from "./EditorAiSelectionPopover";
import { useEditorAiSelection } from "./useEditorAiSelection";

export interface EditorAreaProps {
  activeNotePath: string | null;
  allNotePaths: string[];
  onLinkClick: (target: string) => void;
  onTagClick: (tagKey: string) => void;
  pluginManager?: PluginLifecycleManager | null;
  onEditorReady?: (editor: EditorPluginAdapter | null) => void;
  onViewReady?: (view: EditorView | null) => void;
  onOpenSyncSettings?: () => void;
}

export function EditorArea({
  activeNotePath,
  allNotePaths,
  onLinkClick,
  onTagClick,
  pluginManager,
  onEditorReady,
  onViewReady,
  onOpenSyncSettings,
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
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [isInsertMenuOpen, setIsInsertMenuOpen] = useState(false);
  const [isInsertTrayOpen, setIsInsertTrayOpen] = useState(false);
  const [insertAnchor, setInsertAnchor] = useState<DOMRect | null>(null);
  const insertSelectionRef = useRef<
    import("@codemirror/state").EditorSelection | null
  >(null);
  const insertDialogRequest = useInsertDialogRequest();
  const [editingReminder, setEditingReminder] =
    useState<ReminderClickInfo | null>(null);

  const {
    selectionBounds: aiSelectionBounds,
    isPopoverOpen: isAiPopoverOpen,
    openPopover: openAiPopover,
    closePopover: closeAiPopover,
    replaceSelection: replaceAiSelection,
    insertBelowSelection: insertBelowAiSelection,
  } = useEditorAiSelection(editorView ?? editorViewRef.current);
  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const attachmentSettings = useWorkspaceStore(
    (state) => state.attachmentSettings,
  );

  const handlePickLocalImage = useCallback(async () => {
    if (!vaultPath) throw new Error("Please open a vault first.");
    const { insertLocalImage } = await import("./insertLocalImage");
    return insertLocalImage({
      vaultPath,
      activeNotePath,
      attachmentSettings,
    });
  }, [vaultPath, activeNotePath, attachmentSettings]);

  const {
    handlePasteAttachment,
    handleAttachmentError,
    handleResolveMediaUrl,
    handleSaveMediaFile,
  } = useEditorMediaHandlers(activeNotePath);

  const cleanedContent = useMemo(() => stripNoteMetadata(content), [content]);

  const { frontmatter } = useMemo(
    () =>
      activeNotePath ? parseFrontmatter(cleanedContent) : { frontmatter: {} },
    [activeNotePath, cleanedContent],
  );

  const {
    coverUrl,
    coverY,
    isCoverPickerOpen,
    setIsCoverPickerOpen,
    handleSetCover,
    handleRemoveCover,
    handleSaveCoverPosition,
  } = useNoteCoverImage(
    activeNotePath,
    content,
    frontmatter,
    updateNoteContent,
  );

  const { isBookmarked, toggleBookmark } = useBookmarks();
  const isNoteBookmarked = isBookmarked(activeNotePath);

  const displayTitle = useMemo(() => {
    if (!activeNotePath) return "";
    return (
      activeNotePath
        .replace(/\.(md|canvas)$/i, "")
        .split("/")
        .pop() ?? activeNotePath
    );
  }, [activeNotePath]);

  const isBoardNote = useMemo(() => {
    return Boolean(
      frontmatter &&
      (frontmatter as Record<string, unknown>)["kanban-plugin"] === "board",
    );
  }, [frontmatter]);

  const isDatabaseNote = useMemo(() => {
    return Boolean(
      frontmatter &&
      (frontmatter as Record<string, unknown>)["database"] === "table",
    );
  }, [frontmatter]);

  const [noteViewModes, setNoteViewModes] = useState<
    Record<string, "board" | "table" | "markdown">
  >({});
  const defaultMode = isBoardNote
    ? "board"
    : isDatabaseNote
      ? "table"
      : "markdown";
  const currentViewMode = activeNotePath
    ? (noteViewModes[activeNotePath] ?? defaultMode)
    : "markdown";
  const isKanbanActive = isBoardNote && currentViewMode === "board";
  const isDatabaseActive = isDatabaseNote && currentViewMode === "table";

  const [boardParseError, setBoardParseError] = useState<string | null>(null);
  const [databaseParseError, setDatabaseParseError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (isDatabaseNote && content) {
      void import("@app/database")
        .then(({ parseDatabase }) => {
          try {
            parseDatabase(content);
            setDatabaseParseError(null);
          } catch {
            setDatabaseParseError(
              "This note has database: table but could not be parsed safely. Opened as Markdown.",
            );
          }
        })
        .catch(() => {
          setDatabaseParseError(
            "Failed to load database module. Opened as Markdown.",
          );
        });
    } else {
      setDatabaseParseError(null);
    }
  }, [isDatabaseNote, content]);

  useEffect(() => {
    if (isBoardNote && content) {
      void import("@app/kanban")
        .then(({ parseBoard }) => {
          try {
            parseBoard(content);
            setBoardParseError(null);
          } catch {
            setBoardParseError(
              "This note has kanban-plugin: board but could not be parsed safely. Opened as Markdown.",
            );
          }
        })
        .catch(() => {
          setBoardParseError(
            "Failed to load kanban module. Opened as Markdown.",
          );
        });
    } else {
      setBoardParseError(null);
    }
  }, [isBoardNote, content]);

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
  const strictLineBreaks = useWorkspaceStore((state) => state.strictLineBreaks);
  const vimMonospaceMode = useWorkspaceStore((state) => state.vimMonospaceMode);
  const editorFont = useWorkspaceStore((state) => state.editorFont);
  const editorCustomFont = useWorkspaceStore((state) => state.editorCustomFont);
  const editorFontSize = useWorkspaceStore((state) => state.editorFontSize);
  const setVimModeState = useWorkspaceStore((state) => state.setVimModeState);
  const vimMode = useWorkspaceStore((state) => state.vimModeState);
  const saveNoteNow = useWorkspaceStore((state) => state.saveNoteNow);
  const closeNote = useWorkspaceStore((state) => state.closeNote);
  const closeAllNotes = useWorkspaceStore((state) => state.closeAllNotes);

  const isCanvas = activeNotePath?.endsWith(".canvas") ?? false;
  const hasConflict = activeNotePath
    ? conflictNotes.has(activeNotePath)
    : false;

  const noteHeader = (
    <div
      className={`editor-area__note-header${coverUrl ? " editor-area__note-header--overlay" : ""}`}
      data-tauri-drag-region
      data-visible={isInsertMenuOpen || undefined}
    >
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
        {isBoardNote && (
          <button
            type="button"
            className="editor-area__note-header-button"
            aria-label={isKanbanActive ? "Open as markdown" : "Open as board"}
            title={isKanbanActive ? "Open as markdown" : "Open as board"}
            onClick={() => {
              if (!activeNotePath) return;
              setNoteViewModes((prev) => ({
                ...prev,
                [activeNotePath]: isKanbanActive ? "markdown" : "board",
              }));
            }}
          >
            {isKanbanActive ? (
              <FileText size={16} weight="regular" />
            ) : (
              <KanbanIcon size={16} weight="regular" />
            )}
          </button>
        )}
        {isDatabaseNote && (
          <button
            type="button"
            className="editor-area__note-header-button"
            aria-label={isDatabaseActive ? "Open as markdown" : "Open as table"}
            title={isDatabaseActive ? "Open as markdown" : "Open as table"}
            onClick={() => {
              if (!activeNotePath) return;
              setNoteViewModes((prev) => ({
                ...prev,
                [activeNotePath]: isDatabaseActive ? "markdown" : "table",
              }));
            }}
          >
            {isDatabaseActive ? (
              <FileText size={16} weight="regular" />
            ) : (
              <TableIcon size={16} weight="regular" />
            )}
          </button>
        )}
        <button
          type="button"
          className="editor-area__note-header-button"
          aria-label={coverUrl ? "Change cover image" : "Add cover image"}
          title={coverUrl ? "Change cover image" : "Add cover image"}
          onClick={() => setIsCoverPickerOpen(true)}
        >
          <ImageIcon size={16} weight="regular" />
        </button>
        {activeNotePath && (
          <button
            type="button"
            className="editor-area__note-header-button"
            aria-label={isNoteBookmarked ? "Remove bookmark" : "Bookmark note"}
            title={isNoteBookmarked ? "Remove bookmark" : "Bookmark note"}
            data-active={isNoteBookmarked || undefined}
            onClick={() => void toggleBookmark(activeNotePath)}
          >
            <BookmarkSimple
              size={16}
              weight={isNoteBookmarked ? "fill" : "regular"}
            />
          </button>
        )}
        <SyncStatusButton onOpenSyncSettings={onOpenSyncSettings} />
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
        {isCoverPickerOpen && (
          <Suspense fallback={null}>
            <LazyCoverImagePickerModal
              currentCover={coverUrl}
              onSelectCover={handleSetCover}
              onRemoveCover={coverUrl ? handleRemoveCover : undefined}
              onPickLocalFile={handlePickLocalImage}
              onClose={() => setIsCoverPickerOpen(false)}
            />
          </Suspense>
        )}
        {isInsertMenuOpen &&
          insertAnchor &&
          editorViewRef.current &&
          insertSelectionRef.current && (
            <Suspense fallback={null}>
              <LazyInsertMenu
                anchor={insertAnchor}
                selection={insertSelectionRef.current}
                view={editorViewRef.current}
                onClose={() => setIsInsertMenuOpen(false)}
              />
            </Suspense>
          )}
        {insertDialogRequest && (
          <Suspense fallback={null}>
            <LazyInsertDialog
              request={insertDialogRequest}
              onConfirm={(input) => {
                if (insertDialogRequest.item.id === "kanban-board") {
                  const rawName = (input.name as string)?.trim() || "Kanban";
                  const cleanName = rawName.replace(/[<>:"/\\|?*]/g, "");
                  const stem = cleanName.endsWith(".md")
                    ? cleanName
                    : `${cleanName}.md`;
                  const title = cleanName.endsWith(".md")
                    ? cleanName.slice(0, -3)
                    : cleanName;
                  const folder =
                    activeNotePath && activeNotePath.includes("/")
                      ? activeNotePath.slice(0, activeNotePath.lastIndexOf("/"))
                      : "";
                  const newPath = folder ? `${folder}/${stem}` : stem;
                  const starter = `---\nkanban-plugin: board\n---\n\n# ${title}\n\n## To Do\n\n## Doing\n\n## Done\n`;
                  cancelInsertDialog(insertDialogRequest);
                  void createNoteInVault(newPath, starter).then(() => {
                    void openNote(newPath);
                  });
                } else if (insertDialogRequest.item.id === "database-table") {
                  const rawName =
                    (input.name as string)?.trim() || "Database Table";
                  const cleanName = rawName.replace(/[<>:"/\\|?*]/g, "");
                  const stem = cleanName.endsWith(".md")
                    ? cleanName
                    : `${cleanName}.md`;
                  const folder =
                    activeNotePath && activeNotePath.includes("/")
                      ? activeNotePath.slice(0, activeNotePath.lastIndexOf("/"))
                      : "";
                  const newPath = folder ? `${folder}/${stem}` : stem;
                  const starter = `---\ndatabase: table\ncolumns:\n  - name: Name\n    type: text\n  - name: Status\n    type: select\n    options:\n      - { value: Todo, color: blue }\n      - { value: In Progress, color: orange }\n      - { value: Done, color: green }\n  - name: Done\n    type: checkbox\n---\n\n| Name | Status | Done |\n|---|---|---|\n|  | Todo | false |\n`;
                  cancelInsertDialog(insertDialogRequest);
                  void createNoteInVault(newPath, starter).then(() => {
                    void openNote(newPath);
                  });
                } else {
                  completeInsertDialog(insertDialogRequest, input);
                }
              }}
              onCancel={() => cancelInsertDialog(insertDialogRequest)}
              onPickLocalFile={handlePickLocalImage}
            />
          </Suspense>
        )}
        {editingReminder && (
          <Suspense fallback={null}>
            <LazyReminderEditModal
              reminder={editingReminder}
              onClose={() => setEditingReminder(null)}
            />
          </Suspense>
        )}
      </div>
    </div>
  );

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
              path={activeNotePath}
              initialContent={content}
              onContentChange={updateNoteContent}
              allNotePaths={allNotePaths}
              notesContent={notesContent}
              readNoteContent={handleReadNote}
              onOpenFile={(targetPath) => void openNote(targetPath)}
              onCreateNote={handleCreateNote}
              resolveMediaUrl={handleResolveMediaUrl}
              onSaveMediaFile={handleSaveMediaFile}
              onPickLocalImage={handlePickLocalImage}
            />
          </Suspense>
        ) : isKanbanActive && !boardParseError ? (
          <div className="editor-area__container">
            {coverUrl ? (
              <NoteCoverImage
                coverUrl={coverUrl}
                coverY={coverY}
                resolveMediaUrl={handleResolveMediaUrl}
                onChangeCover={() => setIsCoverPickerOpen(true)}
                onRemoveCover={handleRemoveCover}
                onSavePosition={handleSaveCoverPosition}
              >
                {noteHeader}
              </NoteCoverImage>
            ) : null}
            <div className="editor-area__header">{!coverUrl && noteHeader}</div>
            {hasConflict && activeNotePath && (
              <EditorConflictBanner
                path={activeNotePath}
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
            <div
              className="editor-area__body"
              style={{ display: "flex", flex: 1, minHeight: 0 }}
            >
              <Suspense
                fallback={
                  <div
                    className="kanban-view-loading"
                    style={{
                      padding: "16px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Loading kanban board...
                  </div>
                }
              >
                <LazyKanbanView
                  path={activeNotePath}
                  initialContent={content}
                  onContentChange={updateNoteContent}
                  onLinkClick={onLinkClick}
                  onTagClick={onTagClick}
                />
              </Suspense>
            </div>
          </div>
        ) : isDatabaseActive && !databaseParseError ? (
          <div className="editor-area__container">
            {coverUrl ? (
              <NoteCoverImage
                coverUrl={coverUrl}
                coverY={coverY}
                resolveMediaUrl={handleResolveMediaUrl}
                onChangeCover={() => setIsCoverPickerOpen(true)}
                onRemoveCover={handleRemoveCover}
                onSavePosition={handleSaveCoverPosition}
              >
                {noteHeader}
              </NoteCoverImage>
            ) : null}
            <div className="editor-area__header">{!coverUrl && noteHeader}</div>
            {hasConflict && activeNotePath && (
              <EditorConflictBanner
                path={activeNotePath}
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
            <div
              className="editor-area__body"
              style={{ display: "flex", flex: 1, minHeight: 0 }}
            >
              <Suspense
                fallback={
                  <div
                    className="database-view-loading"
                    style={{
                      padding: "16px",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    Loading database table...
                  </div>
                }
              >
                <LazyDatabaseView
                  filePath={activeNotePath}
                  content={content}
                  onChange={(newContent) => {
                    if (activeNotePath) {
                      updateNoteContent(activeNotePath, newContent);
                    }
                  }}
                  onOpenNote={onLinkClick}
                  onOpenAsMarkdown={() => {
                    if (!activeNotePath) return;
                    setNoteViewModes((prev) => ({
                      ...prev,
                      [activeNotePath]: "markdown",
                    }));
                  }}
                />
              </Suspense>
            </div>
          </div>
        ) : (
          <div className="editor-area__container">
            {boardParseError && (
              <div
                style={{
                  padding: "8px 16px",
                  background: "var(--color-bg-status-warning, #fff8e1)",
                  borderBottom: "1px solid var(--color-border-subtle, #e4e4e4)",
                  color: "var(--color-text-normal, #222222)",
                  fontSize: "0.875rem",
                }}
              >
                ⚠️ {boardParseError}
              </div>
            )}
            {databaseParseError && (
              <div
                style={{
                  padding: "8px 16px",
                  background: "var(--color-bg-status-warning, #fff8e1)",
                  borderBottom: "1px solid var(--color-border-subtle, #e4e4e4)",
                  color: "var(--color-text-normal, #222222)",
                  fontSize: "0.875rem",
                }}
              >
                ⚠️ {databaseParseError}
              </div>
            )}
            {coverUrl ? (
              <NoteCoverImage
                coverUrl={coverUrl}
                coverY={coverY}
                resolveMediaUrl={handleResolveMediaUrl}
                onChangeCover={() => setIsCoverPickerOpen(true)}
                onRemoveCover={handleRemoveCover}
                onSavePosition={handleSaveCoverPosition}
              >
                {noteHeader}
              </NoteCoverImage>
            ) : null}
            <div className="editor-area__header">
              {!coverUrl && noteHeader}
              <PropertiesBlock
                frontmatter={frontmatter}
                onLinkClick={onLinkClick}
              />
            </div>
            {hasConflict && activeNotePath && (
              <EditorConflictBanner
                path={activeNotePath}
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
            <EditorFormattingToolbar
              view={editorView ?? editorViewRef.current}
              isInsertOpen={isInsertTrayOpen}
              onOpenInsertMenu={() => {
                setIsInsertTrayOpen((prev) => !prev);
              }}
              onOpenImagePicker={() => {
                const view = editorView ?? editorViewRef.current;
                if (!view) return;
                const imageItem = findInsertItem("image");
                if (imageItem) {
                  runInsertItem(view, imageItem, view.state.selection);
                }
              }}
            />
            {isInsertTrayOpen && (
              <EditorInsertTray
                view={editorView ?? editorViewRef.current}
                onClose={() => setIsInsertTrayOpen(false)}
                onOpenImagePicker={() => {
                  const view = editorView ?? editorViewRef.current;
                  if (!view) return;
                  const imageItem = findInsertItem("image");
                  if (imageItem) {
                    runInsertItem(view, imageItem, view.state.selection);
                  }
                }}
              />
            )}
            {!isAiPopoverOpen && (
              <EditorAiSelectionTrigger
                bounds={aiSelectionBounds}
                onOpen={openAiPopover}
              />
            )}
            <EditorAiSelectionPopover
              bounds={aiSelectionBounds}
              isOpen={isAiPopoverOpen}
              noteTitle={activeNotePath ? pathStem(activeNotePath) : undefined}
              onClose={closeAiPopover}
              onReplace={replaceAiSelection}
              onInsertBelow={insertBelowAiSelection}
              onOpenAgent={() => {
                void openNote("davinci://agent");
              }}
            />
            <div className="editor-area__body">
              <Editor
                key={activeNotePath}
                value={cleanedContent}
                onChange={(newVal) => updateNoteContent(activeNotePath, newVal)}
                notePaths={allNotePaths}
                sourcePath={activeNotePath}
                onLinkClick={onLinkClick}
                onTagClick={onTagClick}
                onReminderClick={setEditingReminder}
                onPasteAttachment={handlePasteAttachment}
                onAttachmentError={handleAttachmentError}
                resolveMediaUrl={handleResolveMediaUrl}
                loadNoteContent={handleReadNote}
                useVimMode={useVimMode}
                slashMenuEnabled={slashMenuEnabled}
                strictLineBreaks={strictLineBreaks}
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
                  setEditorView(view);
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
