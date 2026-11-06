import { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Camera,
  BookBookmark,
  NotePencil,
} from "@phosphor-icons/react";
import type { LibraryItem } from "@app/ai-agent";
import { useAgentStore } from "./useAgentStore";
import { AgentPromptSubmenu, AgentPromptMenuWrap } from "./AgentPromptSubmenu";
import { AgentPromptExtraOptions } from "./AgentPromptExtraOptions";
import styles from "./AgentPromptMenu.module.scss";

export interface AgentPromptMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFiles: () => void;
  onTakeScreenshot: () => void;
  onSelectPrompt: (prompt: string) => void;
  onAttachLibraryItem?: (item: LibraryItem) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  variant?: "chat" | "project" | "standard";
}

export function AgentPromptMenu({
  isOpen,
  onClose,
  onUploadFiles,
  onTakeScreenshot,
  onSelectPrompt,
  onAttachLibraryItem,
  webSearchEnabled = false,
  onToggleWebSearch,
  variant = "standard",
}: AgentPromptMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [placement, setPlacement] = useState<"top" | "bottom">(
    variant === "project" ? "bottom" : "top",
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const libraryItems = useAgentStore((s) => s.libraryItems) ?? [];
  const projects = useAgentStore((s) => s.projects) ?? [];
  const selectProject = useAgentStore((s) => s.selectProject);
  const setActiveNavSection = useAgentStore((s) => s.setActiveNavSection);

  useEffect(() => {
    if (!isOpen) {
      if (activeSubmenu !== null) setActiveSubmenu(null);
      return;
    }
    const updatePlacement = () => {
      if (!menuRef.current) return;
      const parent = menuRef.current.parentElement;
      if (parent) {
        const parentRect = parent.getBoundingClientRect();
        if (parentRect.top < 340) {
          setPlacement("bottom");
          return;
        }
      }
      const rect = menuRef.current.getBoundingClientRect();
      if (rect.top < 20) {
        setPlacement("bottom");
      } else {
        setPlacement("top");
      }
    };
    updatePlacement();
    window.addEventListener("resize", updatePlacement);
    return () => window.removeEventListener("resize", updatePlacement);
  }, [isOpen, variant]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isProject = variant === "project";
  const promptTemplates = libraryItems.filter((i) => i.type === "prompt");
  const skillsAndRules = libraryItems.filter((i) => i.type !== "prompt");
  const toggleSubmenu = (k: string) =>
    setActiveSubmenu((curr) => (curr === k ? null : k));

  return (
    <div
      className={`${styles["menu"]} ${placement === "bottom" ? styles["is-placement-bottom"] : ""}`}
      ref={menuRef}
      role="menu"
      aria-label="Prompt attachments and options"
    >
      <div className={styles["menu__main"]}>
        <button
          type="button"
          className={styles["menu__item"]}
          onClick={() => {
            onUploadFiles();
            onClose();
          }}
        >
          <Paperclip size={16} weight="regular" />
          <span className={styles["menu__item-text"]}>
            {isProject ? "Attach files" : "Upload or add files"}
          </span>
          <span className={styles["menu__shortcut"]}>⌘ U</span>
        </button>

        <button
          type="button"
          className={styles["menu__item"]}
          onClick={() => {
            onTakeScreenshot();
            onClose();
          }}
        >
          <Camera size={16} weight="regular" />
          <span className={styles["menu__item-text"]}>Take a screenshot</span>
        </button>

        <AgentPromptMenuWrap
          icon={<NotePencil size={16} weight="regular" />}
          label={isProject ? "Prompts" : "Prompt templates"}
          submenuKey="templates"
          activeSubmenu={activeSubmenu}
          onToggle={toggleSubmenu}
        >
          <AgentPromptSubmenu
            header="Vault Prompt Templates"
            items={promptTemplates.slice(0, 8).map((item) => ({
              id: item.id,
              label: item.title,
              onClick: () => onSelectPrompt(item.content),
            }))}
            footerLink={{
              label: "Browse All in Library →",
              onClick: () => setActiveNavSection("library"),
            }}
            onClose={onClose}
          />
        </AgentPromptMenuWrap>

        <AgentPromptMenuWrap
          icon={<BookBookmark size={16} weight="regular" />}
          label={isProject ? "Skills" : "Skills & Rules"}
          submenuKey="skills"
          activeSubmenu={activeSubmenu}
          onToggle={toggleSubmenu}
        >
          <AgentPromptSubmenu
            header="Vault Skills & Rules"
            items={skillsAndRules.slice(0, 8).map((item) => ({
              id: item.id,
              label: item.title,
              onClick: () => {
                if (onAttachLibraryItem) {
                  onAttachLibraryItem(item);
                  return;
                }
                const text =
                  item.type === "prompt"
                    ? item.content
                    : `[${item.type.toUpperCase()}: ${item.title}]\n${item.content}`;
                onSelectPrompt(text);
              },
            }))}
            footerLink={{
              label: "Browse All in Library →",
              onClick: () => setActiveNavSection("library"),
            }}
            onClose={onClose}
          />
        </AgentPromptMenuWrap>

        {isProject ? (
          <>
            <div className={styles["menu__divider"]} />
            <button
              type="button"
              className={styles["menu__item"]}
              onClick={() => {
                setActiveNavSection("library");
                onClose();
              }}
            >
              <span
                className={styles["menu__item-text"]}
                style={{ color: "var(--color-text-muted)" }}
              >
                Browse All in Library →
              </span>
            </button>
          </>
        ) : (
          <AgentPromptExtraOptions
            projects={projects}
            activeSubmenu={activeSubmenu}
            onToggleSubmenu={toggleSubmenu}
            onSelectProject={selectProject}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={onToggleWebSearch ?? (() => {})}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
