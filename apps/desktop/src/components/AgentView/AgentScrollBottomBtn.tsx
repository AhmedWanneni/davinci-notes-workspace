import { ArrowDown } from "@phosphor-icons/react";

export interface AgentScrollBottomBtnProps {
  onClick: () => void;
  visible: boolean;
}

export function AgentScrollBottomBtn({
  onClick,
  visible,
}: AgentScrollBottomBtnProps) {
  if (!visible) return null;

  return (
    <button
      type="button"
      className="agent-scroll-bottom-btn"
      onClick={onClick}
      aria-label="Jump to latest message"
      title="Jump to latest"
    >
      <ArrowDown size={14} weight="bold" />
      <span>Jump to latest</span>
    </button>
  );
}
