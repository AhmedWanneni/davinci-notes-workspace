import { useEffect, useMemo, useRef } from "react";
import {
  NotePencil,
  BookBookmark,
  Sliders,
  Compass,
  ChatCircleDots,
  ChartBar,
  Cpu,
  Globe,
  Trash,
  Question,
} from "@phosphor-icons/react";
import type { LibraryItem } from "@app/ai-agent";
import {
  BUILTIN_SLASH_COMMANDS,
  type SlashCommandItem,
} from "./slashCommandCatalog";
import styles from "./AgentSlashMenu.module.scss";

export type UnifiedSlashItem =
  | { kind: "command"; item: SlashCommandItem }
  | { kind: "library"; item: LibraryItem };

export interface AgentSlashMenuProps {
  isOpen: boolean;
  query: string;
  selectedIndex: number;
  onSelect: (item: UnifiedSlashItem) => void;
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

  const filteredItems = useMemo<UnifiedSlashItem[]>(() => {
    const q = query.trim().toLowerCase();
    const safeLibrary = Array.isArray(libraryItems) ? libraryItems : [];

    const matchedCommands: UnifiedSlashItem[] = BUILTIN_SLASH_COMMANDS.filter(
      (cmd) => {
        if (!q) return true;
        return (
          cmd.name.toLowerCase().includes(q) ||
          cmd.description.toLowerCase().includes(q) ||
          cmd.id.toLowerCase().includes(q)
        );
      },
    ).map((cmd) => ({ kind: "command", item: cmd }));

    const matchedLibrary: UnifiedSlashItem[] = safeLibrary
      .filter((item) => {
        if (!q) return true;
        const titleMatch = item.title?.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const typeMatch = item.type?.toLowerCase().includes(q);
        return titleMatch || descMatch || typeMatch;
      })
      .slice(0, 6)
      .map((item) => ({ kind: "library", item }));

    return [...matchedCommands, ...matchedLibrary].slice(0, 10);
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
      aria-label="Select AI command or prompt template"
    >
      <div className={styles["slash-menu__header"]}>
        <span>AI Commands & Templates</span>
        <span>{filteredItems.length} available</span>
      </div>

      {filteredItems.map((entry, idx) => {
        const isSelected = idx === selectedIndex;
        if (entry.kind === "command") {
          const cmd = entry.item;
          const Icon =
            cmd.iconName === "plan"
              ? Compass
              : cmd.iconName === "interview"
                ? ChatCircleDots
                : cmd.iconName === "usage"
                  ? ChartBar
                  : cmd.iconName === "models"
                    ? Cpu
                    : cmd.iconName === "web"
                      ? Globe
                      : cmd.iconName === "clear"
                        ? Trash
                        : Question;

          return (
            <button
              key={`cmd_${cmd.id}`}
              type="button"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(entry)}
              className={`${styles["slash-menu__item"]} ${isSelected ? styles["is-selected"] : ""}`}
            >
              <span className={styles["slash-menu__item-icon"]}>
                <Icon size={16} />
              </span>
              <div className={styles["slash-menu__item-content"]}>
                <span className={styles["slash-menu__item-title"]}>
                  {cmd.name}
                </span>
                <span className={styles["slash-menu__item-desc"]}>
                  {cmd.description}
                </span>
              </div>
              <span
                className={`${styles["slash-menu__badge"]} ${styles["type-prompt"]}`}
              >
                COMMAND
              </span>
            </button>
          );
        }

        const item = entry.item;
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
            key={`lib_${item.id}`}
            type="button"
            role="option"
            aria-selected={isSelected}
            onClick={() => onSelect(entry)}
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
