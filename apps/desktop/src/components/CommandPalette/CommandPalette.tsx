import React, { useState, useEffect, useMemo, useRef } from "react";
import type { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Dialog, DialogContent } from "@app/design-system";
import { X } from "@phosphor-icons/react";
import { useRecentInsertIds } from "@app/editor";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { useBookmarks } from "../../bookmarks";
import { EmptyState } from "../EmptyState";
import type { RegisteredPluginCommand } from "@app/plugin-runtime";
import { buildPaletteCommands } from "./buildPaletteCommands";
import { executePaletteCommand } from "./executePaletteCommand";
import { usePaletteResults } from "./usePaletteResults";

export interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNote: (path: string) => void;
  onOpenSettings?: () => void;
  onOpenTags?: () => void;
  onOpenReminders?: () => void;
  onOpenLogs?: () => void;
  onDriveSignIn?: () => void;
  onDriveDisconnect?: () => void;
  onDriveRefresh?: () => void;
  onSaveVersionNow?: () => void;
  onToggleBookmark?: () => void;
  onOpenBookmarks?: () => void;
  pluginCommands?: RegisteredPluginCommand[];
  onInvokePluginCommand?: (id: string) => void;
  editorView?: EditorView | null;
  onInsertSuccess?: (itemId: string) => void;
  recentInsertIds?: readonly string[];
}

export function CommandPalette({
  isOpen,
  onOpenChange,
  onSelectNote,
  onOpenSettings,
  onOpenTags,
  onOpenReminders,
  onOpenLogs,
  onDriveSignIn,
  onDriveDisconnect,
  onDriveRefresh,
  onSaveVersionNow,
  onToggleBookmark,
  onOpenBookmarks,
  pluginCommands = [],
  onInvokePluginCommand,
  editorView,
  onInsertSuccess,
  recentInsertIds = [],
}: CommandPaletteProps) {
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const openNotes = useWorkspaceStore((state) => state.openNotes);
  const activeNotePath = useWorkspaceStore((state) => state.activeNotePath);
  const useVimMode = useWorkspaceStore((state) => state.useVimMode);
  const setUseVimMode = useWorkspaceStore((state) => state.setUseVimMode);
  const { isBookmarked } = useBookmarks();
  const isCurrentBookmarked = isBookmarked(activeNotePath);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const editorSelectionRef = useRef<EditorSelection | null>(null);

  const isEditableEditor = Boolean(
    editorView && editorView.state.facet(EditorView.editable),
  );

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      editorSelectionRef.current = editorView?.state.selection ?? null;
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen, editorView]);

  const storedRecentIds = useRecentInsertIds();
  const effectiveRecentIds =
    recentInsertIds.length > 0 ? recentInsertIds : storedRecentIds;

  const preparedTargets = useMemo(
    () =>
      buildPaletteCommands({
        allNotePaths,
        openNotes,
        useVimMode,
        pluginCommands,
        isEditableEditor,
        recentInsertIds: effectiveRecentIds,
        hasActiveNote: Boolean(activeNotePath),
        isBookmarked: isCurrentBookmarked,
      }),
    [
      allNotePaths,
      openNotes,
      useVimMode,
      pluginCommands,
      isEditableEditor,
      effectiveRecentIds,
      activeNotePath,
      isCurrentBookmarked,
    ],
  );

  const results = usePaletteResults(query, preparedTargets);

  const runCommand = (id?: string) => {
    executePaletteCommand({
      id,
      setUseVimMode,
      onOpenSettings,
      onOpenLogs,
      onOpenTags,
      onOpenReminders,
      onSaveVersionNow,
      onToggleBookmark,
      onOpenBookmarks,
      onDriveSignIn,
      onDriveDisconnect,
      onDriveRefresh,
      editorView,
      editorSelection: editorSelectionRef.current,
      onInsertSuccess,
      pluginCommands,
      onInvokePluginCommand,
    });
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleClose = () => {
    onOpenChange(false);
    if (editorView) editorView.focus();
  };

  const scrollSelectedIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    const targetIndex = (index + results.length) % results.length;
    const item = items[targetIndex] as HTMLElement;
    if (item) item.scrollIntoView({ block: "nearest" });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (results.length === 0) return;
      setSelectedIndex((prev) => (prev + 1) % results.length);
      scrollSelectedIntoView(selectedIndex + 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (results.length === 0) return;
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
      scrollSelectedIntoView(selectedIndex - 1);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results.length > 0) {
        const selected = results[selectedIndex];
        if (selected) {
          if (selected.obj.isCommand) runCommand(selected.obj.id);
          else if (selected.obj.path) onSelectNote(selected.obj.path);
          handleClose();
        }
      } else if (query.trim() !== "") {
        onSelectNote(query.trim());
        handleClose();
      }
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent
        className="command-palette__dialog"
        showCloseButton={false}
      >
        <div className="command-palette__input-wrapper">
          <input
            ref={inputRef}
            className="command-palette__input"
            placeholder="Select a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Search commands"
          />
          <button
            type="button"
            className="command-palette__close"
            onClick={handleClose}
            aria-label="Close command palette"
          >
            <X size={10} weight="bold" />
          </button>
        </div>
        <ul
          className="command-palette__list"
          ref={listRef}
          role="listbox"
          aria-label="Command palette results"
        >
          {results.map((result, index) => {
            const isSelected = index === selectedIndex;
            const isCommand = result.obj.isCommand;
            const key = isCommand ? result.obj.id : result.obj.path;
            return (
              <li
                key={key}
                role="option"
                aria-selected={isSelected}
                data-selected={isSelected || undefined}
                className="command-palette__item"
                onClick={() => {
                  if (isCommand) runCommand(result.obj.id);
                  else if (result.obj.path) onSelectNote(result.obj.path);
                  handleClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span
                  className="command-palette__item-title"
                  dangerouslySetInnerHTML={{
                    __html: result.highlightedTitle,
                  }}
                />
              </li>
            );
          })}
          {results.length === 0 && (
            <li className="command-palette__empty">
              <EmptyState
                size="sm"
                description={`No notes found. Press Enter to create "${query}".`}
              />
            </li>
          )}
        </ul>
        <div className="command-palette__footer">
          <span>↑↓ to navigate</span>
          <span>↵ to use</span>
          <span>esc to dismiss</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
