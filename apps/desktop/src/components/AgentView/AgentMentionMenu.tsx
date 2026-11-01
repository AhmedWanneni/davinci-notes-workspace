import { useEffect, useMemo, useRef } from "react";
import { FileText, Folder } from "@phosphor-icons/react";
import { Typography } from "@app/design-system";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";

export interface MentionItem {
  id: string;
  type: "file" | "folder";
  path: string;
  label: string;
}

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
  const menuRef = useRef<HTMLDivElement>(null);

  const items = useMemo<MentionItem[]>(() => {
    const q = query.trim().toLowerCase();
    const result: MentionItem[] = [];

    // Search folders first if matching
    for (const folder of allFolderPaths) {
      const normalized = folder.endsWith("/") ? folder : `${folder}/`;
      const label = folder.split("/").filter(Boolean).pop() ?? folder;
      if (!q || normalized.toLowerCase().includes(q)) {
        result.push({
          id: `folder:${normalized}`,
          type: "folder",
          path: normalized,
          label,
        });
      }
      if (result.length >= 15) break;
    }

    // Search notes
    for (const note of allNotePaths) {
      const label = note.split("/").pop() ?? note;
      if (!q || note.toLowerCase().includes(q)) {
        result.push({
          id: `file:${note}`,
          type: "file",
          path: note,
          label,
        });
      }
      if (result.length >= 20) break;
    }

    // Sort: exact matches first, then startsWith, then includes
    return result
      .sort((a, b) => {
        if (!q) return 0;
        const aStart = a.label.toLowerCase().startsWith(q);
        const bStart = b.label.toLowerCase().startsWith(q);
        if (aStart && !bStart) return -1;
        if (!aStart && bStart) return 1;
        return a.label.localeCompare(b.label);
      })
      .slice(0, 8);
  }, [allNotePaths, allFolderPaths, query]);

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
      style={{
        position: "absolute",
        bottom: "100%",
        left: 0,
        right: 0,
        marginBottom: "var(--space-2)",
        backgroundColor: "var(--color-bg-primary)",
        border: "var(--border-width-thin) solid var(--color-border-subtle)",
        borderRadius: "var(--border-radius-md)",
        padding: "var(--space-1)",
        maxHeight: "220px",
        overflowY: "auto",
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        gap: "1px",
      }}
    >
      <div
        style={{
          padding: "var(--space-1) var(--space-2)",
          borderBottom:
            "var(--border-width-thin) solid var(--color-border-subtle)",
          marginBottom: "2px",
        }}
      >
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
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(item)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "var(--space-2)",
              padding: "var(--space-1) var(--space-2)",
              border: "none",
              borderRadius: "var(--border-radius-sm)",
              backgroundColor: isSelected
                ? "var(--color-bg-hover)"
                : "transparent",
              cursor: "pointer",
              textAlign: "left",
              width: "100%",
              color: "var(--color-text-normal)",
            }}
          >
            {item.type === "folder" ? (
              <Folder size={14} color="var(--color-text-accent)" />
            ) : (
              <FileText size={14} color="var(--color-text-muted)" />
            )}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  fontSize: "var(--type-scale-xs)",
                  fontWeight: "var(--type-weight-medium)",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {item.label}
              </span>
              <span
                style={{
                  fontSize: "var(--type-scale-xs)",
                  color: "var(--color-text-muted)",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  overflow: "hidden",
                }}
              >
                {item.path}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
