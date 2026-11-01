import { useState, useRef, useEffect } from "react";
import {
  Paperclip,
  Camera,
  FolderSimple,
  BookBookmark,
  Plugs,
  Palette,
  Plug,
  Globe,
  CaretRight,
  Check,
} from "@phosphor-icons/react";
import { useAgentStore } from "./useAgentStore";
import { AGENT_CAPABILITIES } from "./AgentCapabilitiesPopover";
import { CONNECTOR_OPTIONS, DESIGN_OPTIONS } from "./agentPromptMenuConfig";
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

  const projects = useAgentStore((s) => s.projects);
  const selectProject = useAgentStore((s) => s.selectProject);
  const webSearchEnabled = useAgentStore((s) => s.webSearchEnabled);
  const toggleWebSearch = useAgentStore((s) => s.toggleWebSearch);

  useEffect(() => {
    if (!isOpen) {
      setActiveSubmenu(null);
      return;
    }
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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

        <div
          className={styles["menu__item-wrap"]}
          onMouseEnter={() => setActiveSubmenu("project")}
        >
          <button
            type="button"
            className={styles["menu__item"]}
            onClick={() =>
              setActiveSubmenu((v) => (v === "project" ? null : "project"))
            }
          >
            <FolderSimple size={16} weight="regular" />
            <span className={styles["menu__item-text"]}>Add to project</span>
            <CaretRight
              size={13}
              weight="bold"
              className={styles["menu__caret"]}
            />
          </button>
          {activeSubmenu === "project" && (
            <div className={styles["menu__submenu"]}>
              <div className={styles["menu__sub-header"]}>Select Project</div>
              {projects.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles["menu__sub-item"]}
                  onClick={() => {
                    selectProject(p.id);
                    onClose();
                  }}
                >
                  <FolderSimple size={14} />
                  <span>{p.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={styles["menu__item-wrap"]}
          onMouseEnter={() => setActiveSubmenu("skills")}
        >
          <button
            type="button"
            className={styles["menu__item"]}
            onClick={() =>
              setActiveSubmenu((v) => (v === "skills" ? null : "skills"))
            }
          >
            <BookBookmark size={16} weight="regular" />
            <span className={styles["menu__item-text"]}>Skills</span>
            <CaretRight
              size={13}
              weight="bold"
              className={styles["menu__caret"]}
            />
          </button>
          {activeSubmenu === "skills" && (
            <div className={styles["menu__submenu"]}>
              <div className={styles["menu__sub-header"]}>Agent Skills</div>
              {AGENT_CAPABILITIES.map((cap, i) => (
                <button
                  key={i}
                  type="button"
                  className={styles["menu__sub-item"]}
                  onClick={() => {
                    onSelectPrompt(cap.prompt);
                    onClose();
                  }}
                >
                  <span>{cap.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={styles["menu__item-wrap"]}
          onMouseEnter={() => setActiveSubmenu("connector")}
        >
          <button
            type="button"
            className={styles["menu__item"]}
            onClick={() =>
              setActiveSubmenu((v) => (v === "connector" ? null : "connector"))
            }
          >
            <Plugs size={16} weight="regular" />
            <span className={styles["menu__item-text"]}>Add connector</span>
            <CaretRight
              size={13}
              weight="bold"
              className={styles["menu__caret"]}
            />
          </button>
          {activeSubmenu === "connector" && (
            <div className={styles["menu__submenu"]}>
              <div className={styles["menu__sub-header"]}>Connectors</div>
              {CONNECTOR_OPTIONS.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles["menu__sub-item"]}
                  onClick={() => {
                    onSelectPrompt(opt.prompt);
                    onClose();
                  }}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className={styles["menu__item-wrap"]}
          onMouseEnter={() => setActiveSubmenu("design")}
        >
          <button
            type="button"
            className={styles["menu__item"]}
            onClick={() =>
              setActiveSubmenu((v) => (v === "design" ? null : "design"))
            }
          >
            <Palette size={16} weight="regular" />
            <span className={styles["menu__item-text"]}>Design system</span>
            <CaretRight
              size={13}
              weight="bold"
              className={styles["menu__caret"]}
            />
          </button>
          {activeSubmenu === "design" && (
            <div className={styles["menu__submenu"]}>
              <div className={styles["menu__sub-header"]}>Design Tokens</div>
              {DESIGN_OPTIONS.map((opt, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={styles["menu__sub-item"]}
                  onClick={() => {
                    onSelectPrompt(opt.prompt);
                    onClose();
                  }}
                >
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

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
