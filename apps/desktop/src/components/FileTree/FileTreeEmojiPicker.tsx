import { EmojiPicker } from "frimousse";
import { X } from "@phosphor-icons/react";
import { Button } from "@app/design-system";

interface FileTreeEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function FileTreeEmojiPicker({
  onSelect,
  onClose,
}: FileTreeEmojiPickerProps) {
  return (
    <div
      className="file-tree__emoji-picker"
      role="dialog"
      aria-label="Choose an emoji"
    >
      <div className="file-tree__emoji-picker-header">
        <span>Choose icon</span>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          aria-label="Close emoji picker"
        >
          <X size={14} />
        </Button>
      </div>
      <EmojiPicker.Root
        emojibaseUrl="/emoji-data"
        onEmojiSelect={({ emoji }) => onSelect(emoji)}
      >
        <EmojiPicker.Search className="file-tree__emoji-search" autoFocus />
        <EmojiPicker.Viewport className="file-tree__emoji-viewport">
          <EmojiPicker.Loading>Loading emoji…</EmojiPicker.Loading>
          <EmojiPicker.Empty>No emoji found.</EmojiPicker.Empty>
          <EmojiPicker.List
            components={{
              CategoryHeader: ({ category, ...props }) => (
                <div {...props}>{category.label}</div>
              ),
              Row: (props) => <div {...props} />,
              Emoji: ({ emoji, ...props }) => (
                <button {...props}>{emoji.emoji}</button>
              ),
            }}
          />
        </EmojiPicker.Viewport>
      </EmojiPicker.Root>
    </div>
  );
}
