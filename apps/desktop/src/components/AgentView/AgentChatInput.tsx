import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Warning } from "@phosphor-icons/react";
import { AgentChatFooter } from "./AgentChatFooter";
import { AgentMentionMenu } from "./AgentMentionMenu";
import { AgentMentionChip } from "./AgentMentionChip";
import { AgentImageThumbnail } from "./AgentImageThumbnail";
import { useAgentMention } from "./useAgentMention";
import { useChatAttachments } from "./useChatAttachments";
import { isVisionSupported } from "./imageAttachmentUtils";
import type { AgentChatInputProps } from "./agentTypes";

export function AgentChatInput(props: AgentChatInputProps) {
  const {
    onSend,
    onCancel,
    isStreaming,
    autoApply,
    onToggleAutoApply,
    currentProvider,
    currentModel,
    onSelectModel,
    selectedCliAgent,
    onSelectCliAgent,
    webSearchEnabled,
    onToggleWebSearch,
    onOpenSettings,
    shortcuts,
    disabled,
  } = props;
  const [input, setInput] = useState("");
  const [isCapabilitiesOpen, setIsCapabilitiesOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const {
    attachments,
    setAttachments,
    fileInputRef,
    addFiles,
    handlePaste,
    handleDrop,
    handleDragOver,
    removeAttachment,
  } = useChatAttachments();

  const {
    mentions,
    removeMention,
    clearMentions,
    mentionQuery,
    mentionSelectedIndex,
    setMentionQuery,
    setMentionItemCount,
    handleInputChange,
    handleSelectMention,
    handleMentionKeyDown,
  } = useAgentMention(input, setInput, textareaRef);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = "auto";
    const nextHeight = Math.min(Math.max(textarea.scrollHeight, 48), 200);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 200 ? "auto" : "hidden";
  }, [input]);

  const handleSubmit = () => {
    if (
      disabled ||
      (!input.trim() && attachments.length === 0 && mentions.length === 0) ||
      isStreaming
    )
      return;
    if (attachments.length > 0 || mentions.length > 0) {
      onSend(
        input.trim(),
        attachments.length > 0 ? attachments : undefined,
        mentions.length > 0 ? mentions : undefined,
      );
    } else {
      onSend(input.trim());
    }
    setInput("");
    setAttachments([]);
    clearMentions();
    setMentionQuery(null);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (handleMentionKeyDown(e)) return;

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const visionWarning =
    attachments.length > 0 && !isVisionSupported(currentModel);

  return (
    <div className="agent-chat-dock">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: "none" }}
        onChange={(e) => e.target.files && void addFiles(e.target.files)}
      />

      <div
        className="agent-chat-input__box"
        style={{ position: "relative" }}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <AgentMentionMenu
          isOpen={mentionQuery !== null}
          query={mentionQuery ?? ""}
          selectedIndex={mentionSelectedIndex}
          onSelect={handleSelectMention}
          onClose={() => setMentionQuery(null)}
          onItemCountChange={setMentionItemCount}
        />

        {mentions.length > 0 && (
          <div className="agent-chat-input__mentions">
            {mentions.map((m) => (
              <AgentMentionChip
                key={m.id}
                mention={m}
                onRemove={removeMention}
              />
            ))}
          </div>
        )}

        {attachments.length > 0 && (
          <div className="agent-chat-input__attachments">
            {attachments.map((att) => (
              <AgentImageThumbnail
                key={att.id}
                attachment={att}
                onRemove={removeAttachment}
              />
            ))}
          </div>
        )}

        {visionWarning && (
          <div className="agent-chat-input__vision-warning">
            <Warning size={13} weight="bold" />
            <span>{currentModel} may not support image understanding</span>
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="agent-chat-input__textarea"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Ask a question or request changes (type @ to reference files)..."
          rows={1}
          disabled={disabled}
          aria-label="Agent prompt input"
        />

        <AgentChatFooter
          fileInputRef={fileInputRef}
          isCapabilitiesOpen={isCapabilitiesOpen}
          setIsCapabilitiesOpen={setIsCapabilitiesOpen}
          shortcuts={shortcuts}
          onSelectCapability={(preset) => setInput(preset)}
          autoApply={autoApply}
          onToggleAutoApply={onToggleAutoApply}
          currentModel={currentModel}
          currentProvider={currentProvider}
          onSelectModel={onSelectModel}
          selectedCliAgent={selectedCliAgent}
          onSelectCliAgent={onSelectCliAgent}
          onOpenSettings={onOpenSettings}
          webSearchEnabled={webSearchEnabled}
          onToggleWebSearch={onToggleWebSearch}
          isStreaming={isStreaming}
          onCancel={onCancel}
          onSubmit={handleSubmit}
          sendDisabled={
            disabled ||
            (!input.trim() && attachments.length === 0 && mentions.length === 0)
          }
        />
      </div>
    </div>
  );
}
