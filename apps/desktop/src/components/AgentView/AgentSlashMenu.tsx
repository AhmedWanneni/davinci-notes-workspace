import { useEffect, useMemo, useRef } from "react";
import { NotePencil, BookBookmark, Sliders } from "@phosphor-icons/react";
import type { LibraryItem } from "@app/ai-agent";
import styles from "./AgentSlashMenu.module.scss";

export interface AgentSlashMenuProps {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  onSelect: (item: LibraryItem) => void;
  onClose: () => void;
  onItemCountChange?: (count: number) => void;
  libraryItems: LibraryItem[];
}

export function AgentSlashMenu({
  isOpen,
  query,
  selectedIndex,
  onSelect,
  onClose,
  onItemCountChange,
  libraryItems,
}: AgentSlashMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const safeItems = Array.isArray(libraryItems) ? libraryItems : [];
    if (!q) return safeItems.slice(0, 8);

    return safeItems
      .filter((item) => {
        const titleMatch = item.title?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const typeMatch = item.type?.toLowerCase().includes(q);
        const tagMatch = item.tags?.some((t) => t.toLowerCase().includes(q));
        return titleMatch || descMatch || typeMatch || tagMatch;
      })
      .slice(0, 8);
  }, [libraryItems, query]);

  useEffect(() => {
    onItemCountChange?.(filteredItems.length);
  }, [filteredItems.length, onItemCountChange]);

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

  if (!isOpen || filteredItems.length === 0) return null;

  return (
    <div
      ref={menuRef}
      className={styles["slash-menu"]}
      role="listbox"
      aria-label="Select AI library prompt, skill or rule"
    >
      <div className={styles["slash-menu__header"]}>
        <span>AI Vault Library & Templates</span>
        <span>{filteredItems.length} available</span>
      </div>

      {filteredItems.map((item, idx) => {
        const isSelected = idx === selectedIndex;
        const Icon =
          item.type === "skill"
            ? BookBookmark
            : item.type === "rule"
              ? Sliders
              : NotePencil;

        const typeClass =
          item.type === "prompt"
            ? styles["type-prompt"]
            : item.type === "skill"
              ? styles["type-skill"]
              : styles["type-rule"];

        return (
          <button
            key={item.id}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(item)}
            className={`${styles["slash-menu__item"]} ${isSelected ? styles["is-selected"] : ""}`}
          >
            <span className={styles["slash-menu__item-icon"]}>
              <Icon size={16} />
            </span>
            <div className={styles["slash-menu__item-content"]}>
              <span className={styles["slash-menu__item-title"]}>
                {item.title}
              </span>
              <span className={styles["slash-menu__item-desc"]}>
                {item.description || item.content.slice(0, 80)}
              </span>
            </div>
            <span className={`${styles["slash-menu__badge"]} ${typeClass}`}>
              {item.type}
            </span>
          </button>
        );
      })}
    </div>
  );
}
