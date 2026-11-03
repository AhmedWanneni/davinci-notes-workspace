import { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Camera,
  FolderSimple,
  BookBookmark,
  NotePencil,
  Plugs,
  Palette,
  Plug,
  Globe,
  Check,
} from "@phosphor-icons/react";
import { useAgentStore } from "./useAgentStore";
import { CONNECTOR_OPTIONS, DESIGN_OPTIONS } from "./agentPromptMenuConfig";
import { AgentPromptSubmenu, AgentPromptMenuWrap } from "./AgentPromptSubmenu";
import styles from "./AgentPromptMenu.module.scss";

export interface AgentPromptMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadFiles: () => void;
  onTakeScreenshot: () => void;
  onSelectPrompt: (prompt: string) => void;
}

export function AgentPromptMenu({
  isOpen,
  onClose,
  onUploadFiles,
  onTakeScreenshot,
  onSelectPrompt,
}: AgentPromptMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const libraryItems = useAgentStore((s) => s.libraryItems) ?? [];
  const projects = useAgentStore((s) => s.projects) ?? [];
  const selectProject = useAgentStore((s) => s.selectProject);
  const setActiveNavSection = useAgentStore((s) => s.setActiveNavSection);
  const webSearchEnabled = useAgentStore((s) => s.webSearchEnabled);
  const toggleWebSearch = useAgentStore((s) => s.toggleWebSearch);

  useEffect(() => {
    if (!isOpen) {
      if (activeSubmenu !== null) setActiveSubmenu(null);
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, activeSubmenu, onClose]);

  if (!isOpen) return null;

  const promptTemplates = libraryItems.filter((i) => i.type === "prompt");
  const skillsAndRules = libraryItems.filter((i) => i.type !== "prompt");
  const toggleSubmenu = (k: string) =>
    setActiveSubmenu((curr) => (curr === k ? null : k));

  return (
    <div
      className={styles["menu"]}
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
          <span className={styles["menu__item-text"]}>Upload or add files</span>
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
          label="Prompt templates"
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
          label="Skills & Rules"
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

        <AgentPromptMenuWrap
          icon={<FolderSimple size={16} weight="regular" />}
          label="Add to project"
          submenuKey="project"
          activeSubmenu={activeSubmenu}
          onToggle={toggleSubmenu}
        >
          <AgentPromptSubmenu
            header="Select Project"
            items={projects.map((p) => ({
              id: p.id,
              label: p.name,
              icon: <FolderSimple size={14} />,
              onClick: () => selectProject(p.id),
            }))}
            onClose={onClose}
          />
        </AgentPromptMenuWrap>

        <AgentPromptMenuWrap
          icon={<Plugs size={16} weight="regular" />}
          label="Add connector"
          submenuKey="connector"
          activeSubmenu={activeSubmenu}
          onToggle={toggleSubmenu}
        >
          <AgentPromptSubmenu
            header="Connectors"
            items={CONNECTOR_OPTIONS.map((opt, idx) => ({
              id: idx,
              label: opt.label,
              onClick: () => onSelectPrompt(opt.prompt),
            }))}
            onClose={onClose}
          />
        </AgentPromptMenuWrap>

        <AgentPromptMenuWrap
          icon={<Palette size={16} weight="regular" />}
          label="Design system"
          submenuKey="design"
          activeSubmenu={activeSubmenu}
          onToggle={toggleSubmenu}
        >
          <AgentPromptSubmenu
            header="Design Tokens"
            items={DESIGN_OPTIONS.map((opt, idx) => ({
              id: idx,
              label: opt.label,
              onClick: () => onSelectPrompt(opt.prompt),
            }))}
            onClose={onClose}
          />
        </AgentPromptMenuWrap>

        <button
          type="button"
          className={styles["menu__item"]}
          onClick={() => {
            onSelectPrompt(
              "List and explore community plugins installed in vault.",
            );
            onClose();
          }}
        >
          <Plug size={16} weight="regular" />
          <span className={styles["menu__item-text"]}>Add plugins</span>
        </button>

        <div className={styles["menu__divider"]} />

        <button
          type="button"
          className={styles["menu__item"]}
          onClick={() => {
            toggleWebSearch();
            onClose();
          }}
        >
          <Globe size={16} weight="regular" />
          <span className={styles["menu__item-text"]}>Web search</span>
          {webSearchEnabled && (
            <Check size={14} weight="bold" className={styles["menu__check"]} />
          )}
        </button>
      </div>
    </div>
  );
}
