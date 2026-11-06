import { Check, FolderSimple, Globe } from "@phosphor-icons/react";
import type { AgentProject } from "@app/ai-agent";
import { AgentPromptSubmenu, AgentPromptMenuWrap } from "./AgentPromptSubmenu";
import styles from "./AgentPromptMenu.module.scss";

export interface AgentPromptExtraOptionsProps {
  projects: AgentProject[];
  activeSubmenu: string | null;
  onToggleSubmenu: (k: string) => void;
  onSelectProject: (projectId: string) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onClose: () => void;
}

export function AgentPromptExtraOptions({
  projects,
  activeSubmenu,
  onToggleSubmenu,
  onSelectProject,
  webSearchEnabled,
  onToggleWebSearch,
  onClose,
}: AgentPromptExtraOptionsProps) {
  return (
    <>
      <AgentPromptMenuWrap
        icon={<FolderSimple size={16} weight="regular" />}
        label="Add to project"
        submenuKey="project"
        activeSubmenu={activeSubmenu}
        onToggle={onToggleSubmenu}
      >
        <AgentPromptSubmenu
          header="Select Project"
          items={projects.map((p) => ({
            id: p.id,
            label: p.name,
            icon: <FolderSimple size={14} />,
            onClick: () => onSelectProject(p.id),
          }))}
          onClose={onClose}
        />
      </AgentPromptMenuWrap>
      <button
        type="button"
        className={styles["menu__item"]}
        onClick={() => {
          onToggleWebSearch();
          onClose();
        }}
        aria-pressed={webSearchEnabled}
      >
        <Globe size={16} weight="regular" />
        <span className={styles["menu__item-text"]}>Web search</span>
        {webSearchEnabled && (
          <Check size={14} weight="bold" className={styles["menu__check"]} />
        )}
      </button>
    </>
  );
}
