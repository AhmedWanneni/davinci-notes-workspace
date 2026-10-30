import { Lightning } from "@phosphor-icons/react";
import type { AgentShortcut } from "@app/ai-agent";

export interface AgentShortcutsBarProps {
  shortcuts: AgentShortcut[];
  onTriggerShortcut: (shortcut: AgentShortcut) => void;
  disabled?: boolean;
}

export function AgentShortcutsBar({
  shortcuts,
  onTriggerShortcut,
  disabled,
}: AgentShortcutsBarProps) {
  if (shortcuts.length === 0) return null;

  return (
    <div className="agent-shortcuts-bar" role="toolbar" aria-label="Quick Agent Shortcuts">
      <div className="agent-shortcuts-bar__label">
        <Lightning size={13} weight="fill" />
        <span>Shortcuts:</span>
      </div>
      <div className="agent-shortcuts-bar__items">
        {shortcuts.map((sc) => (
          <button
            key={sc.id}
            type="button"
            className="agent-shortcuts-bar__chip"
            onClick={() => onTriggerShortcut(sc)}
            disabled={disabled}
            title={sc.description ?? sc.prompt}
          >
            {sc.title}
          </button>
        ))}
      </div>
    </div>
  );
}
