import { useRef, useState, type KeyboardEvent, type ChangeEvent } from "react";
import { Plus } from "@phosphor-icons/react";
import { AgentPromptMenu } from "./AgentPromptMenu";
import { AgentMentionMenu } from "./AgentMentionMenu";
import { AgentSlashMenu } from "./AgentSlashMenu";
import { AgentPromptModelPicker } from "./AgentPromptModelPicker";
import { AgentImageAttachmentPreview } from "./AgentImageAttachmentPreview";
import { AgentPromptActions } from "./AgentPromptActions";
import { usePromptAttachments } from "./usePromptAttachments";
import { useAgentMention } from "./useAgentMention";
import { useAgentStore } from "./useAgentStore";
import type { AgentShortcut } from "@app/ai-agent";
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
  onVoiceClick?: () => void;
  autoFocus?: boolean;
  variant?: "standard" | "project";
}

export function AgentPromptBar({
  value,
  onChange,
  onSubmit,
  onSendWithImages,
  onCancel,
  placeholder = "Write a message...",
  isStreaming = false,
  disabled = false,
  shortcuts: _shortcuts = [],
  onVoiceClick,
  autoFocus = false,
  variant = "standard",
}: AgentPromptBarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const setModelPickerOpen = useAgentStore((s) => s.setModelPickerOpen);
  const libraryItems = useAgentStore((s) => s.libraryItems);

  const {
    attachedImages,
    fileInputRef,
    removeImage,
    clearImages,
    handlePaste,
    handleFileInput,
    handleTakeScreenshot,
  } = usePromptAttachments((text) =>
    onChange(value ? `${value}\n\n${text}` : text),
  );

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
  } = useAgentMention(value, onChange, textareaRef);

  const handleSend = () => {
    if (
      disabled ||
      isStreaming ||
      (!value.trim() && attachedImages.length === 0)
    )
      return;
    if (onSendWithImages) onSendWithImages(value.trim(), attachedImages);
    else onSubmit();
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

  const canSend = Boolean(value.trim() || attachedImages.length > 0);

  const menuButton = (
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
        variant={variant}
      />
    </div>
  );

  return (
    <div
      className={styles["prompt-bar"]}
      role="region"
      aria-label="AI Prompt Bar"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.md,.txt,.pdf"
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

      {variant === "project" ? (
        <div
          className={`${styles["prompt-bar__inner"]} ${styles["is-project"]}`}
        >
          <AgentImageAttachmentPreview
            images={attachedImages}
            onRemove={removeImage}
          />
          <div className={styles["prompt-bar__project-top"]}>
            <textarea
              ref={textareaRef}
              className={styles["prompt-bar__textarea"]}
              value={value}
              onChange={handleTextChange}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={placeholder || "How can I help you today?"}
              rows={2}
              disabled={disabled}
              autoFocus={autoFocus}
              aria-label="Agent prompt input"
            />
          </div>
          <div className={styles["prompt-bar__project-bottom"]}>
            <div className={styles["prompt-bar__project-left"]}>
              {menuButton}
            </div>
            <div className={styles["prompt-bar__project-right"]}>
              <AgentPromptModelPicker />
              <AgentPromptActions
                isStreaming={isStreaming}
                canSend={canSend}
                onVoiceClick={onVoiceClick}
                onCancel={onCancel}
                onSend={handleSend}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={styles["prompt-bar__inner"]}>
            <AgentImageAttachmentPreview
              images={attachedImages}
              onRemove={removeImage}
            />
            <div className={styles["prompt-bar__row"]}>
              {menuButton}
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
              <AgentPromptActions
                isStreaming={isStreaming}
                canSend={canSend}
                onVoiceClick={onVoiceClick}
                onCancel={onCancel}
                onSend={handleSend}
              />
            </div>
          </div>
          <div className={styles["prompt-bar__footer"]}>
            <span className={styles["prompt-bar__disclaimer"]}>
              Sophia is AI and can make mistakes. Please double-check responses.
            </span>
            <AgentPromptModelPicker />
          </div>
        </>
      )}
    </div>
  );
}
