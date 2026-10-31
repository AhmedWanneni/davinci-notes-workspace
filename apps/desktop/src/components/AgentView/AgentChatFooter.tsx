import type { RefObject } from "react";
import {
  ArrowUp,
  Stop,
  Plus,
  Hand,
  Lightning,
  Globe,
  Paperclip,
} from "@phosphor-icons/react";
import { AgentModelSelect } from "./AgentModelSelect";
import { AgentCapabilitiesPopover } from "./AgentCapabilitiesPopover";
import type { AIProviderId } from "../../ai/AISubsystem";
import type { AgentShortcut } from "@app/ai-agent";

export interface AgentChatFooterProps {
  fileInputRef: RefObject<HTMLInputElement | null>;
  isCapabilitiesOpen: boolean;
  setIsCapabilitiesOpen: (open: boolean) => void;
  shortcuts?: AgentShortcut[];
  onSelectCapability: (preset: string) => void;
  autoApply: boolean;
  onToggleAutoApply: (auto: boolean) => void;
  currentModel: string;
  currentProvider: AIProviderId;
  onSelectModel: (model: string, provider: AIProviderId) => void;
  selectedCliAgent?: string | null;
  onSelectCliAgent?: (agentId: string | null) => void;
  onOpenSettings: () => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: (enabled: boolean) => void;
  isStreaming: boolean;
  onCancel?: () => void;
  onSubmit: () => void;
  sendDisabled: boolean;
}

export function AgentChatFooter(props: AgentChatFooterProps) {
  const {
    fileInputRef,
    isCapabilitiesOpen,
    setIsCapabilitiesOpen,
    shortcuts,
    onSelectCapability,
    autoApply,
    onToggleAutoApply,
    currentModel,
    currentProvider,
    onSelectModel,
    selectedCliAgent,
    onSelectCliAgent,
    onOpenSettings,
    webSearchEnabled,
    onToggleWebSearch,
    isStreaming,
    onCancel,
    onSubmit,
    sendDisabled,
  } = props;

  return (
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
            onSelectCapability={onSelectCapability}
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
          title={webSearchEnabled ? "Web search enabled" : "Enable web search"}
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
            onClick={onSubmit}
            disabled={sendDisabled}
            aria-label="Send message"
            title="Send message"
          >
            <ArrowUp size={16} weight="bold" />
          </button>
        )}
      </div>
    </div>
  );
}
