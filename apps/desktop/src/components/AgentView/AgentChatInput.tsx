import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import {
  ArrowUp,
  Stop,
  Plus,
  Hand,
  Lightning,
  Globe,
  Paperclip,
  Warning,
} from "@phosphor-icons/react";
import { AgentModelSelect } from "./AgentModelSelect";
import { AgentCapabilitiesPopover } from "./AgentCapabilitiesPopover";
import { AgentMentionMenu } from "./AgentMentionMenu";
import { AgentImageThumbnail } from "./AgentImageThumbnail";
import { useAgentMention } from "./useAgentMention";
import { useChatAttachments } from "./useChatAttachments";
import { isVisionSupported } from "./imageAttachmentUtils";
import type { AIProviderId } from "../../ai/AISubsystem";
import type { AgentShortcut } from "@app/ai-agent";
import type { ChatAttachmentItem, AgentChatInputProps } from "./agentTypes";

export function AgentChatInput(props: AgentChatInputProps) {
  const {
    onSend, onCancel, isStreaming, autoApply, onToggleAutoApply,
    currentProvider, currentModel, onSelectModel, selectedCliAgent,
    onSelectCliAgent, webSearchEnabled, onToggleWebSearch,
    onOpenSettings, shortcuts, disabled,
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
    if (disabled || (!input.trim() && attachments.length === 0) || isStreaming)
      return;
    if (attachments.length > 0) onSend(input.trim(), attachments);
    else onSend(input.trim());
    setInput("");
    setAttachments([]);
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

        <div className="agent-chat-input__footer">
          <div className="agent-chat-input__footer-left">
            <button
              type="button"
              className="agent-chat-input__icon-btn"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach images"
              title="Attach images"
            >
              <Paperclip size={15} />
            </button>

            <div className="agent-chat-input__popover-anchor">
              <button
                type="button"
                className={`agent-chat-input__icon-btn${isCapabilitiesOpen ? " agent-chat-input__icon-btn--active" : ""}`}
                onClick={() => setIsCapabilitiesOpen(!isCapabilitiesOpen)}
                aria-label="Agent options and capabilities"
                title="Explore what the agent can do"
              >
                <Plus size={15} weight="bold" />
              </button>
              <AgentCapabilitiesPopover
                isOpen={isCapabilitiesOpen}
                onClose={() => setIsCapabilitiesOpen(false)}
                shortcuts={shortcuts}
                onSelectCapability={(preset) => {
                  setInput(preset);
                }}
              />
            </div>

            <button
              type="button"
              className={`agent-chat-input__approval-pill${autoApply ? " agent-chat-input__approval-pill--auto" : ""}`}
              onClick={() => onToggleAutoApply(!autoApply)}
              aria-label={
                autoApply ? "Auto-applying changes" : "Asking for approval"
              }
              title="Click to toggle between Ask for Approval and Auto-apply"
            >
              {autoApply ? (
                <>
                  <Lightning size={14} weight="fill" />
                  <span>Auto-apply</span>
                </>
              ) : (
                <>
                  <Hand size={14} weight="regular" />
                  <span>Ask for approval</span>
                </>
              )}
            </button>
          </div>

          <div className="agent-chat-input__footer-right">
            <AgentModelSelect
              currentModel={currentModel}
              currentProvider={currentProvider}
              onSelectModel={onSelectModel}
              selectedCliAgent={selectedCliAgent}
              onSelectCliAgent={onSelectCliAgent}
              onOpenSettings={onOpenSettings}
              disabled={isStreaming}
            />

            <button
              type="button"
              className={`agent-chat-input__icon-btn${webSearchEnabled ? " agent-chat-input__icon-btn--active" : ""}`}
              onClick={() => onToggleWebSearch(!webSearchEnabled)}
              title={
                webSearchEnabled ? "Web search enabled" : "Enable web search"
              }
              aria-label="Toggle web search"
            >
              <Globe size={15} />
            </button>

            {isStreaming ? (
              <button
                type="button"
                className="agent-chat-input__action-circle agent-chat-input__action-circle--stop"
                onClick={onCancel}
                aria-label="Stop generation"
                title="Stop generation"
              >
                <Stop size={14} weight="fill" />
              </button>
            ) : (
              <button
                type="button"
                className="agent-chat-input__action-circle agent-chat-input__action-circle--send"
                onClick={handleSubmit}
                disabled={disabled || !input.trim()}
                aria-label="Send message"
                title="Send message"
              >
                <ArrowUp size={16} weight="bold" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
