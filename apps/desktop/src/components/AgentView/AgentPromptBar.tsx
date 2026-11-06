import {
  useRef,
  useState,
  useEffect,
  type KeyboardEvent,
  type ChangeEvent,
} from "react";
import { Plus } from "@phosphor-icons/react";
import { AgentPromptMenu } from "./AgentPromptMenu";
import { AgentMentionMenu } from "./AgentMentionMenu";
import { AgentSlashMenu } from "./AgentSlashMenu";
import { AgentPromptModelPicker } from "./AgentPromptModelPicker";
import { AgentImageAttachmentPreview } from "./AgentImageAttachmentPreview";
import { AgentPromptActions } from "./AgentPromptActions";
import { useAgentViewConfig } from "./useAgentViewConfig";
import { usePromptAttachments } from "./usePromptAttachments";
import { useAgentMention } from "./useAgentMention";
import { useAgentStore } from "./useAgentStore";
import type { AgentShortcut, LibraryItem } from "@app/ai-agent";
import styles from "./AgentPromptBar.module.scss";

export interface AgentPromptBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onSendWithImages?: (prompt: string, images: string[]) => void;
  onCancel?: () => void;
  placeholder?: string;
  isStreaming?: boolean;
  disabled?: boolean;
  shortcuts?: AgentShortcut[];
  autoFocus?: boolean;
  variant?: "standard" | "project";
}

export function AgentPromptBar({
  value,
  onChange,
  onSubmit,
  onSendWithImages,
  onCancel,
  placeholder = "How can I help you today?",
  isStreaming = false,
  disabled = false,
  shortcuts: _shortcuts = [],
  autoFocus = false,
  variant = "standard",
}: AgentPromptBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { webSearchEnabled, handleToggleWebSearch } = useAgentViewConfig();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setModelPickerOpen = useAgentStore((s) => s.setModelPickerOpen);
  const libraryItems = useAgentStore((s) => s.libraryItems);

  const {
    attachedImages,
    attachedItems,
    fileInputRef,
    removeImage,
    addAttachmentItem,
    removeAttachmentItem,
    clearImages,
    handlePaste,
    handleFileInput,
    handleTakeScreenshot,
  } = usePromptAttachments((text) =>
    onChange(value ? `${value}\n\n${text}` : text),
  );

  const handleAttachLibraryItem = (item: LibraryItem) => {
    addAttachmentItem({
      id: item.id,
      kind: item.type === "rule" ? "rule" : "skill",
      name: item.title,
      badge: item.type.toUpperCase(),
      content: item.content,
    });
  };

  const {
    mentionQuery,
    mentionSelectedIndex,
    setMentionQuery,
    setMentionItemCount,
    slashQuery,
    slashSelectedIndex,
    setSlashQuery,
    setSlashItemCount,
    handleInputChange,
    handleSelectMention,
    handleSelectSlash,
    handleMentionKeyDown,
  } = useAgentMention(value, onChange, textareaRef, handleAttachLibraryItem);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const nextHeight = Math.min(Math.max(el.scrollHeight, 36), 220);
    el.style.height = `${nextHeight}px`;
  }, [value]);

  const handleSend = () => {
    const hasAttachments =
      attachedImages.length > 0 || attachedItems.length > 0;
    if (isStreaming) {
      onCancel?.();
      return;
    }
    if (disabled || (!value.trim() && !hasAttachments)) return;

    const attachmentsPrefix = attachedItems
      .map((item) => {
        const label =
          item.kind === "skill"
            ? "Skill"
            : item.kind === "rule"
              ? "Rule"
              : "Attached File";
        return `[${label}: ${item.name}]\n${item.content}`;
      })
      .join("\n\n");

    const finalPrompt = [attachmentsPrefix, value.trim()]
      .filter(Boolean)
      .join("\n\n");

    if (onSendWithImages) {
      onSendWithImages(finalPrompt, attachedImages);
    } else {
      if (attachmentsPrefix) onChange(finalPrompt);
      onSubmit();
    }
    clearImages();
    setMentionQuery(null);
    setSlashQuery(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (handleMentionKeyDown(e)) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    if (val.includes("/model")) {
      setModelPickerOpen(true);
      onChange(val.replace("/model", "").trimStart());
      return;
    }
    handleInputChange(e);
  };

  return (
    <div
      className={styles["prompt-bar"]}
      role="region"
      aria-label="AI Prompt Bar"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.html,.htm,.md,.txt,.pdf,.json,.csv,.ts,.tsx,.js,.py"
        multiple
        style={{ display: "none" }}
        onChange={handleFileInput}
      />
      <AgentMentionMenu
        isOpen={mentionQuery !== null}
        query={mentionQuery ?? ""}
        selectedIndex={mentionSelectedIndex}
        onSelect={handleSelectMention}
        onClose={() => setMentionQuery(null)}
        onItemCountChange={setMentionItemCount}
      />
      <AgentSlashMenu
        isOpen={slashQuery !== null}
        query={slashQuery ?? ""}
        selectedIndex={slashSelectedIndex}
        onSelect={handleSelectSlash}
        onClose={() => setSlashQuery(null)}
        onItemCountChange={setSlashItemCount}
        libraryItems={libraryItems}
      />

      <div
        className={`${styles["prompt-bar__inner"]} ${styles["is-project"]}`}
      >
        <AgentImageAttachmentPreview
          images={attachedImages}
          items={attachedItems}
          onRemove={removeImage}
          onRemoveItem={removeAttachmentItem}
        />
        <div className={styles["prompt-bar__project-top"]}>
          <textarea
            ref={textareaRef}
            className={styles["prompt-bar__textarea"]}
            value={value}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={1}
            disabled={disabled}
            autoFocus={autoFocus}
            aria-label="Agent prompt input"
          />
        </div>
        <div className={styles["prompt-bar__project-bottom"]}>
          <div className={styles["prompt-bar__project-left"]}>
            <div className={styles["prompt-bar__anchor"]}>
              <button
                type="button"
                className={styles["prompt-bar__add-btn"]}
                onClick={() => setIsMenuOpen((v) => !v)}
                aria-label="Agent options and capabilities"
                title="Add attachment or options"
              >
                <Plus size={16} weight="bold" />
              </button>
              <AgentPromptMenu
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onUploadFiles={() => fileInputRef.current?.click()}
                onTakeScreenshot={handleTakeScreenshot}
                onSelectPrompt={(p) => onChange(p)}
                onAttachLibraryItem={handleAttachLibraryItem}
                webSearchEnabled={webSearchEnabled}
                onToggleWebSearch={() => void handleToggleWebSearch(!webSearchEnabled)}
                variant={variant}
              />
            </div>
          </div>
          <div className={styles["prompt-bar__project-right"]}>
            <AgentPromptModelPicker />
            <AgentPromptActions
              isStreaming={isStreaming}
              onCancel={onCancel}
              onSend={handleSend}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
