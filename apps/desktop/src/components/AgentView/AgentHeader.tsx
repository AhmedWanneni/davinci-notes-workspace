import { Button, Typography } from "@app/design-system";
import { Sparkle, Clock, Plus, Sliders, ChatCircleDots } from "@phosphor-icons/react";

export interface AgentHeaderProps {
  hasMessages: boolean;
  onNewChat: () => void;
  isSettingsOpen: boolean;
  onToggleSettings: () => void;
  isConversationsOpen: boolean;
  onToggleConversations: () => void;
  conversationsCount: number;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  historyCount: number;
}

export function AgentHeader({
  hasMessages,
  onNewChat,
  isSettingsOpen,
  onToggleSettings,
  isConversationsOpen,
  onToggleConversations,
  conversationsCount,
  isHistoryOpen,
  onToggleHistory,
  historyCount,
}: AgentHeaderProps) {
  return (
    <header className="agent-view__header">
      <div className="agent-view__title-group">
        <Sparkle size={18} weight="fill" />
        <Typography variant="text" size="base" weight="semibold">
          AI Vault Agent
        </Typography>
      </div>

      <div className="agent-view__header-actions">
        {hasMessages && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onNewChat}
            aria-label="Start new conversation"
          >
            <Plus size={14} weight="bold" /> New Chat
          </Button>
        )}

        <Button
          variant={isConversationsOpen ? "primary" : "ghost"}
          size="sm"
          onClick={onToggleConversations}
          aria-label="Browse previous chats and projects"
        >
          <ChatCircleDots size={14} /> Chats ({conversationsCount})
        </Button>

        <Button
          variant={isSettingsOpen ? "primary" : "ghost"}
          size="sm"
          onClick={onToggleSettings}
          aria-label="Toggle agent settings"
        >
          <Sliders size={14} /> Settings
        </Button>

        <Button
          variant={isHistoryOpen ? "primary" : "secondary"}
          size="sm"
          onClick={onToggleHistory}
          aria-label="Toggle change history"
        >
          <Clock size={14} /> History ({historyCount})
        </Button>
      </div>
    </header>
  );
}
