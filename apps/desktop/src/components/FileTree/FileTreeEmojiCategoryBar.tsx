import type { Icon } from "@phosphor-icons/react";
import {
  Car,
  Flag,
  Heart,
  Lightbulb,
  PawPrint,
  Smiley,
  SoccerBall,
  ForkKnife,
} from "@phosphor-icons/react";

interface CategoryTab {
  key: string;
  label: string;
  icon: Icon;
}

const TABS: CategoryTab[] = [
  { key: "smileys", label: "Smileys & people", icon: Smiley },
  { key: "animals", label: "Animals & nature", icon: PawPrint },
  { key: "food", label: "Food & drink", icon: ForkKnife },
  { key: "activities", label: "Activities", icon: SoccerBall },
  { key: "travel", label: "Travel & places", icon: Car },
  { key: "objects", label: "Objects", icon: Lightbulb },
  { key: "symbols", label: "Symbols", icon: Heart },
  { key: "flags", label: "Flags", icon: Flag },
];

interface FileTreeEmojiCategoryBarProps {
  onJump: (key: string) => void;
}

export function FileTreeEmojiCategoryBar({
  onJump,
}: FileTreeEmojiCategoryBarProps) {
  return (
    <div className="file-tree__emoji-categories">
      {TABS.map(({ key, label, icon: TabIcon }) => (
        <button
          key={key}
          type="button"
          className="file-tree__emoji-category"
          aria-label={label}
          title={label}
          onClick={() => onJump(key)}
        >
          <TabIcon size={16} />
        </button>
      ))}
    </div>
  );
}
