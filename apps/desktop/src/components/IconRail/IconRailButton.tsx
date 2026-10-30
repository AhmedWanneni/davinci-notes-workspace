import type { ReactNode } from "react";
import { Tooltip } from "@app/design-system";

export interface IconRailButtonProps {
  label: string;
  tooltip?: string;
  isActive?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function IconRailButton({
  label,
  tooltip,
  isActive,
  onClick,
  children,
}: IconRailButtonProps) {
  return (
    <Tooltip content={tooltip || label} contentProps={{ side: "right" }}>
      <button
        type="button"
        className="icon-rail__btn"
        data-active={isActive || undefined}
        onClick={onClick}
        aria-label={label}
      >
        {children}
      </button>
    </Tooltip>
  );
}
