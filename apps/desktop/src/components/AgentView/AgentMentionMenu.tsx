import { useEffect, useMemo, useRef } from "react";
import { FileText, Folder } from "@phosphor-icons/react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import styles from "./AgentMentionMenu.module.scss";

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
      if (result.length >= 10) break;
    }

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
      className={styles["mention-menu"]}
      role="listbox"
      aria-label="Select file or folder"
    >
      <div className={styles["mention-menu__header"]}>
        Referenced Files & Folders
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
            className={`${styles["mention-menu__item"]} ${isSelected ? styles["is-selected"] : ""}`}
          >
            <span className={styles["mention-menu__item-icon"]}>
              {item.type === "folder" ? (
                <Folder size={15} weight="regular" />
              ) : (
                <FileText size={15} />
              )}
            </span>
            <div className={styles["mention-menu__item-text"]}>
              <span className={styles["mention-menu__item-label"]}>
                {item.label}
              </span>
              <span className={styles["mention-menu__item-path"]}>
                {item.path}
              </span>
            </div>
            <span className={styles["mention-menu__badge"]}>
              {item.type === "folder" ? "DIR" : "NOTE"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
