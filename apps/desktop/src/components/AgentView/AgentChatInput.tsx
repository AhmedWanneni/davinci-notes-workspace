import { useState, type KeyboardEvent } from "react";
import {
  ArrowUp,
  Stop,
  Plus,
  Hand,
  Lightning,
  Globe,
  Folder,
  Sliders,
  Cpu,
} from "@phosphor-icons/react";
import { AgentModelSelect } from "./AgentModelSelect";
import { AgentCapabilitiesPopover } from "./AgentCapabilitiesPopover";
import type { AIProviderId } from "../../ai/AISubsystem";

export interface AgentChatInputProps {
  onSend: (prompt: string) => void;
  onCancel?: () => void;
  isStreaming: boolean;
  autoApply: boolean;
  onToggleAutoApply: (enabled: boolean) => void;
  vaultName: string;
  projectName?: string;
  currentProvider: AIProviderId;
  currentModel: string;
  onSelectModel: (model: string, provider: AIProviderId) => void;
  selectedCliAgent?: string | null;
  onSelectCliAgent?: (agentId: string | null) => void;
  webSearchEnabled: boolean;
  onToggleWebSearch: (enabled: boolean) => void;
  onOpenSettings: () => void;
  onOpenConversations?: () => void;
  disabled?: boolean;
}

export function AgentChatInput({
  onSend,
  onCancel,
  isStreaming,
  autoApply,
  onToggleAutoApply,
  vaultName,
  projectName,
  currentProvider,
  currentModel,
  onSelectModel,
  selectedCliAgent,
  onSelectCliAgent,
  webSearchEnabled,
  onToggleWebSearch,
  onOpenSettings,
  onOpenConversations,
  disabled,
}: AgentChatInputProps) {
  const [input, setInput] = useState("");
  const [isCapabilitiesOpen, setIsCapabilitiesOpen] = useState(false);

  const handleSubmit = () => {
    if (disabled || !input.trim() || isStreaming) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="agent-chat-dock">
      {/* Context Chip Bar matching the screenshot */}
      <div className="agent-chat-dock__chips">
        <div
          className="agent-chat-dock__chip"
          title={`Current Vault: ${vaultName}`}
        >
          <Folder size={13} weight="bold" />
          <span>{vaultName}</span>
        </div>
        {projectName && (
          <button
            type="button"
            className="agent-chat-dock__chip agent-chat-dock__chip--interactive"
            onClick={onOpenConversations}
            title={`Active Project: ${projectName}. Click to browse conversations.`}
          >
            <span>{projectName}</span>
          </button>
        )}
        <button
          type="button"
          className="agent-chat-dock__chip agent-chat-dock__chip--interactive"
          onClick={onOpenSettings}
          title="AI Provider & Model / Agent Settings"
        >
          <Cpu size={13} weight="bold" />
          <span>
            {selectedCliAgent
              ? `Agent: ${selectedCliAgent}`
              : currentProvider === "ollama"
                ? "Local Ollama"
                : currentModel || "AI Agent"}
          </span>
        </button>
        <button
          type="button"
          className="agent-chat-dock__chip agent-chat-dock__chip--interactive"
          onClick={onOpenSettings}
          title="Configure Agent & Settings"
        >
          <Sliders size={13} />
          <span>Settings</span>
        </button>
      </div>

      {/* Main Floating Input Card */}
      <div className="agent-chat-input__box">
        <textarea
          className="agent-chat-input__textarea"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a question or request changes (e.g. 'Summarize notes in Finance', 'Make a to-do list')..."
          rows={2}
          disabled={disabled}
          aria-label="Agent prompt input"
        />

        <div className="agent-chat-input__footer">
          {/* Left Controls: + button and Ask for approval */}
          <div className="agent-chat-input__footer-left">
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

          {/* Right Controls: Model Select, Web toggle, Send button */}
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
