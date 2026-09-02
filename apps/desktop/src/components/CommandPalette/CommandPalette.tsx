import React, { useState, useEffect, useMemo, useRef } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import fuzzysort from "fuzzysort";
import { FileText, Gear } from "@phosphor-icons/react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { EmptyState } from "../EmptyState";
import type { RegisteredPluginCommand } from "@app/plugin-runtime";

interface CommandPaletteProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectNote: (path: string) => void;
  onOpenSettings?: () => void;
  onOpenTags?: () => void;
  onDriveSignIn?: () => void;
  onDriveDisconnect?: () => void;
  onDriveRefresh?: () => void;
  pluginCommands?: RegisteredPluginCommand[];
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
  pluginCommands = [],
}: CommandPaletteProps) {
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const openNotes = useWorkspaceStore((state) => state.openNotes);
  const useVimMode = useWorkspaceStore((state) => state.useVimMode);
  const setUseVimMode = useWorkspaceStore((state) => state.setUseVimMode);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      // Small timeout to allow dialog to mount before focusing
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [isOpen]);

  const preparedTargets = useMemo(() => {
    const targets: {
      path?: string;
      title: string;
      recencyScore: number;
      isCommand?: boolean;
      id?: string;
    }[] = allNotePaths.map((path) => {
      const title = path.replace(/\.md$/i, "").split(/[/\\]/).pop() ?? path;
      const recencyScore = openNotes.includes(path) ? 1000 : 0;
      return { path, title, recencyScore };
    });
    if (useVimMode) {
      targets.push({
        isCommand: true,
        id: "action:disable-vim",
        title: "Disable Vim keybindings",
        recencyScore: 600,
      });
    }
    targets.push({
      isCommand: true,
      id: "action:settings",
      title: "Open Settings",
      recencyScore: 500,
    });
    targets.push({
      isCommand: true,
      id: "action:tags",
      title: "Browse Tags",
      recencyScore: 400,
    });
    targets.push({
      isCommand: true,
      id: "action:drive-sign-in",
      title: "Sign in to Drive",
      recencyScore: 300,
    });
    targets.push({
      isCommand: true,
      id: "action:drive-disconnect",
      title: "Disconnect Drive",
      recencyScore: 290,
    });
    targets.push({
      isCommand: true,
      id: "action:drive-refresh",
      title: "Refresh Drive Session",
      recencyScore: 280,
    });
    for (const command of pluginCommands) {
      targets.push({
        isCommand: true,
        id: `plugin:${command.id}`,
        title: command.name,
        recencyScore: 200,
      });
    }
    return targets;
  }, [allNotePaths, openNotes, useVimMode, pluginCommands]);

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
    if (id === "action:disable-vim") void setUseVimMode(false);
    if (id === "action:settings") onOpenSettings?.();
    if (id === "action:tags") onOpenTags?.();
    if (id === "action:drive-sign-in") onDriveSignIn?.();
    if (id === "action:drive-disconnect") onDriveDisconnect?.();
    if (id === "action:drive-refresh") onDriveRefresh?.();
    const pluginId = id?.startsWith("plugin:") ? id.slice(7) : undefined;
    const command = pluginCommands.find((item) => item.id === pluginId);
    if (command) void command.callback();
  };

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

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
          onOpenChange(false);
        }
      } else if (query.trim() !== "") {
        // Create new note
        onSelectNote(query.trim());
        onOpenChange(false);
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
    <DialogPrimitive.Root open={isOpen} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="command-palette__overlay" />
        <DialogPrimitive.Content className="command-palette__dialog">
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
                    onOpenChange(false);
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
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
