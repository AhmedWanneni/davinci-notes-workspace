import { useEffect, useMemo, useRef } from "react";
import { FileText, Folder } from "@phosphor-icons/react";
import { Typography } from "@app/design-system";
import fuzzysort from "fuzzysort";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { MentionItem } from "./agentTypes";

export type { MentionItem } from "./agentTypes";

export interface AgentMentionMenuProps {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  onSelect: (item: MentionItem) => void;
  onClose: () => void;
  onItemCountChange?: (count: number) => void;
}

export function AgentMentionMenu({
  isOpen,
  query,
  selectedIndex,
  onSelect,
  onClose,
  onItemCountChange,
}: AgentMentionMenuProps) {
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const allFolderPaths = useWorkspaceStore((state) => state.allFolderPaths);
  const activeNotePath = useWorkspaceStore((state) => state.activeNotePath);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = useMemo<MentionItem[]>(() => {
    const q = query.trim();
    const allCandidates: MentionItem[] = [];

    for (const folder of allFolderPaths) {
      const normalized = folder.endsWith("/") ? folder : `${folder}/`;
      const label = folder.split("/").filter(Boolean).pop() ?? folder;
      allCandidates.push({
        id: `folder:${normalized}`,
        type: "folder",
        path: normalized,
        label,
      });
    }

    for (const note of allNotePaths) {
      const label = note.split("/").pop() ?? note;
      allCandidates.push({
        id: `file:${note}`,
        type: "file",
        path: note,
        label,
      });
    }

    const currentItem: MentionItem | null = activeNotePath
      ? {
          id: `current:${activeNotePath}`,
          type: "current",
          path: activeNotePath,
          label: `Current: ${activeNotePath.split("/").pop() ?? activeNotePath}`,
        }
      : null;

    if (!q) {
      const list = currentItem ? [currentItem] : [];
      return [...list, ...allCandidates.slice(0, 7)];
    }

    const matches = fuzzysort.go(q, allCandidates, {
      keys: ["label", "path"],
      limit: 8,
      threshold: -10000,
    });

    const results = matches.map((m) => m.obj);

    if (currentItem) {
      const qLower = q.toLowerCase();
      if (
        qLower === "current" ||
        currentItem.label.toLowerCase().includes(qLower) ||
        currentItem.path.toLowerCase().includes(qLower)
      ) {
        if (!results.some((r) => r.path === currentItem.path)) {
          results.unshift(currentItem);
        }
      }
    }

    return results.slice(0, 8);
  }, [allNotePaths, allFolderPaths, activeNotePath, query]);

  useEffect(() => {
    onItemCountChange?.(items.length);
  }, [items.length, onItemCountChange]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen || items.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className="agent-mention-menu"
      role="listbox"
      aria-label="Select file or folder"
    >
      <div className="agent-mention-menu__header">
        <Typography variant="text" size="xs" color="muted">
          Referenced Files & Folders
        </Typography>
      </div>

      {items.map((item, idx) => {
        const isSelected = idx === selectedIndex;
        return (
          <button
            key={item.id}
            type="button"
            className="agent-mention-menu__item"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(item)}
          >
            {item.type === "folder" ? (
              <Folder size={14} color="var(--color-text-accent)" />
            ) : (
              <FileText size={14} color="var(--color-text-muted)" />
            )}
            <div className="agent-mention-menu__item-text">
              <span className="agent-mention-menu__item-title">
                {item.label}
              </span>
              <span className="agent-mention-menu__item-path">{item.path}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
