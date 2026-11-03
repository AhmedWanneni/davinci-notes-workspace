import {
  FolderSimple,
  Plugs,
  Palette,
  Plug,
  Globe,
  Check,
} from "@phosphor-icons/react";
import type { AgentProject } from "@app/ai-agent";
import { CONNECTOR_OPTIONS, DESIGN_OPTIONS } from "./agentPromptMenuConfig";
import { AgentPromptSubmenu, AgentPromptMenuWrap } from "./AgentPromptSubmenu";
import styles from "./AgentPromptMenu.module.scss";

export interface AgentPromptExtraOptionsProps {
  projects: AgentProject[];
  activeSubmenu: string | null;
  onToggleSubmenu: (k: string) => void;
  onSelectPrompt: (prompt: string) => void;
  onSelectProject: (projectId: string) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: () => void;
  onClose: () => void;
}

export function AgentPromptExtraOptions({
  projects,
  activeSubmenu,
  onToggleSubmenu,
  onSelectPrompt,
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

      <AgentPromptMenuWrap
        icon={<Plugs size={16} weight="regular" />}
        label="Add connector"
        submenuKey="connector"
        activeSubmenu={activeSubmenu}
        onToggle={onToggleSubmenu}
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
        onToggle={onToggleSubmenu}
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
          onToggleWebSearch();
          onClose();
        }}
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
