import React, { useState, useEffect, useMemo, useRef } from "react";
import type { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { Dialog, DialogContent } from "@app/design-system";
import fuzzysort from "fuzzysort";
import { FileText, Gear } from "@phosphor-icons/react";
import {
  insertItem,
  insertRegistry,
  recordRecentInsert,
  useRecentInsertIds,
} from "@app/editor";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { EmptyState } from "../EmptyState";
import type { RegisteredPluginCommand } from "@app/plugin-runtime";
import { buildPaletteCommands } from "./buildPaletteCommands";

export interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNote: (path: string) => void;
  onOpenSettings?: () => void;
  onOpenTags?: () => void;
  onDriveSignIn?: () => void;
  onDriveDisconnect?: () => void;
  onDriveRefresh?: () => void;
  onSaveVersionNow?: () => void;
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
  onDriveSignIn,
  onDriveDisconnect,
  onDriveRefresh,
  onSaveVersionNow,
  pluginCommands = [],
  onInvokePluginCommand,
  editorView,
  onInsertSuccess,
  recentInsertIds = [],
}: CommandPaletteProps) {
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const openNotes = useWorkspaceStore((state) => state.openNotes);
  const useVimMode = useWorkspaceStore((state) => state.useVimMode);
  const setUseVimMode = useWorkspaceStore((state) => state.setUseVimMode);
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
      }),
    [
      allNotePaths,
      openNotes,
      useVimMode,
      pluginCommands,
      isEditableEditor,
      effectiveRecentIds,
    ],
  );

  const results = useMemo(() => {
    if (!query) {
      const sorted = [...preparedTargets].sort(
        (a, b) => b.recencyScore - a.recencyScore,
      );
      return sorted.slice(0, 20).map((t) => ({
        obj: t,
        highlightedTitle: t.title,
      }));
    }

    const searchResults = fuzzysort.go(query, preparedTargets, {
      key: "title",
      limit: 20,
    });

    return searchResults.map((result) => ({
      obj: result.obj,
      highlightedTitle:
        result.highlight(
          '<mark class="command-palette__highlight">',
          "</mark>",
        ) || result.obj.title,
    }));
  }, [query, preparedTargets]);

  const runCommand = (id?: string) => {
    if (!id) return;
    if (id === "action:disable-vim") void setUseVimMode(false);
    if (id === "action:settings") onOpenSettings?.();
    if (id === "action:tags") onOpenTags?.();
    if (id === "action:save-version") onSaveVersionNow?.();
    if (id === "action:drive-sign-in") onDriveSignIn?.();
    if (id === "action:drive-disconnect") onDriveDisconnect?.();
    if (id === "action:drive-refresh") onDriveRefresh?.();
    if (id.startsWith("insert:")) {
      const itemId = id.slice(7);
      const item = insertRegistry.find((entry) => entry.id === itemId);
      if (item && editorView && editorView.state.facet(EditorView.editable)) {
        const selection = editorSelectionRef.current ?? editorView.state.selection;
        insertItem(editorView, item, selection);
        recordRecentInsert(item.id);
        onInsertSuccess?.(item.id);
        editorView.focus();
      }
    }
    const pluginId = id.startsWith("plugin:") ? id.slice(7) : undefined;
    const command = pluginCommands.find((item) => item.id === pluginId);
    if (command) onInvokePluginCommand?.(command.id);
  };

  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  const handleClose = () => {
    onOpenChange(false);
    if (editorView) {
      editorView.focus();
    }
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
          if (selected.obj.isCommand) {
            runCommand(selected.obj.id);
          } else if (selected.obj.path) {
            onSelectNote(selected.obj.path);
          }
          handleClose();
        }
      } else if (query.trim() !== "") {
        onSelectNote(query.trim());
        handleClose();
      }
    }
  };

  const scrollSelectedIntoView = (index: number) => {
    if (!listRef.current) return;
    const items = listRef.current.children;
    const targetIndex = (index + results.length) % results.length;
    const item = items[targetIndex] as HTMLElement;
    if (item) {
      item.scrollIntoView({ block: "nearest" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); else onOpenChange(true); }}>
      <DialogContent
        className="command-palette__dialog"
        showCloseButton={false}
      >
        <div className="command-palette__input-wrapper">
          <input
            ref={inputRef}
            className="command-palette__input"
            placeholder="Type to search or create..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
        </div>
        <ul
          className="command-palette__list"
          ref={listRef}
          role="listbox"
          aria-label="Quick switcher results"
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
                  if (isCommand) {
                    runCommand(result.obj.id);
                  } else if (result.obj.path) {
                    onSelectNote(result.obj.path);
                  }
                  handleClose();
                }}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                {isCommand ? (
                  <Gear
                    size={18}
                    className="command-palette__icon"
                    weight="regular"
                  />
                ) : (
                  <FileText
                    size={18}
                    className="command-palette__icon"
                    weight="regular"
                  />
                )}
                <span
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
      </DialogContent>
    </Dialog>
  );
}
