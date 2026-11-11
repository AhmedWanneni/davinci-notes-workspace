import type { JSX } from "react";
import { Gear, SignOut } from "@phosphor-icons/react";
import { IconRailButton } from "./IconRailButton";
import { IconRailTopGroup, type IconRailTopGroupProps } from "./IconRailTopGroup";

export interface IconRailProps extends IconRailTopGroupProps {
  isLeftSidebarOpen: boolean;
  onOpenSettings: () => void;
  onCloseVault: () => void;
}

export function IconRail({
  onOpenSettings,
  onCloseVault,
  ...topGroupProps
}: IconRailProps): JSX.Element {
  return (
    <nav className="icon-rail" aria-label="Primary navigation">
      <IconRailTopGroup {...topGroupProps} />

      <div className="icon-rail__group icon-rail__group--bottom">
        <IconRailButton label="Settings" onClick={onOpenSettings}>
          <Gear size={18} weight="regular" />
        </IconRailButton>

        <IconRailButton label="Close vault" onClick={onCloseVault}>
          <SignOut size={18} weight="regular" />
        </IconRailButton>
      </div>
    </nav>
  );
}
