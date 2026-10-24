import { useRef } from "react";
import { EmojiPicker } from "frimousse";
import { MagnifyingGlass, Smiley, X } from "@phosphor-icons/react";
import { FileTreeEmojiCategoryBar } from "./FileTreeEmojiCategoryBar";
import { FileTreeEmojiSkeleton } from "./FileTreeEmojiSkeleton";

interface FileTreeEmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const CATEGORY_MATCH: Record<string, string> = {
  smileys: "smileys",
  animals: "animals",
  food: "food",
  activities: "activities",
  travel: "travel",
  objects: "objects",
  symbols: "symbols",
  flags: "flags",
};

export function FileTreeEmojiPicker({
  onSelect,
  onClose,
}: FileTreeEmojiPickerProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  const jumpToCategory = (key: string) => {
    const headers = rootRef.current?.querySelectorAll<HTMLElement>(
      "[data-emoji-category]",
    );
    const needle = CATEGORY_MATCH[key];
    headers?.forEach((header) => {
      if (header.dataset.emojiCategory?.toLowerCase().startsWith(needle)) {
        header.scrollIntoView({ block: "start" });
      }
    });
  };

  return (
    <div
      ref={rootRef}
      className="file-tree__emoji-picker"
      role="dialog"
      aria-label="Choose an emoji"
    >
      <div className="file-tree__emoji-picker-header">
        <span className="file-tree__emoji-tab" aria-hidden="true">
          <Smiley size={14} />
        </span>
        <button
          type="button"
          className="file-tree__emoji-close"
          onClick={onClose}
          aria-label="Close emoji picker"
        >
          <X size={12} />
        </button>
      </div>
      <EmojiPicker.Root
        columns={6}
        emojibaseUrl="/emoji-data"
        onEmojiSelect={({ emoji }) => onSelect(emoji)}
      >
        <div className="file-tree__emoji-search-row">
          <div className="file-tree__emoji-search-wrap">
            <MagnifyingGlass size={12} aria-hidden="true" />
            <EmojiPicker.Search
              className="file-tree__emoji-search"
              placeholder="Search emoji"
              autoFocus
            />
          </div>
        </div>
        <EmojiPicker.Viewport className="file-tree__emoji-viewport">
          <EmojiPicker.Loading>
            <FileTreeEmojiSkeleton />
          </EmojiPicker.Loading>
          <EmojiPicker.Empty>No emoji found.</EmojiPicker.Empty>
          <EmojiPicker.List
            components={{
              CategoryHeader: ({ category, ...props }) => (
                <div
                  data-emoji-category={category.label}
                  {...props}
                  style={{ ...props.style, position: "relative", top: "auto" }}
                >
                  {category.label}
                </div>
              ),
              Row: ({ className, ...props }) => (
                <div
                  className={["file-tree__emoji-row", className]
                    .filter(Boolean)
                    .join(" ")}
                  {...props}
                />
              ),
              Emoji: ({ emoji, ...props }) => (
                <button type="button" {...props}>
                  {emoji.emoji}
                </button>
              ),
            }}
          />
        </EmojiPicker.Viewport>
      </EmojiPicker.Root>
      <FileTreeEmojiCategoryBar onJump={jumpToCategory} />
    </div>
  );
}
