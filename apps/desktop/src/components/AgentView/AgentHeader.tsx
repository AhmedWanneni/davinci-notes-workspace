import { Button, Typography } from "@app/design-system";
import {
  Sparkle,
  Clock,
  Plus,
  Sliders,
  ChatCircleDots,
} from "@phosphor-icons/react";

export interface AgentHeaderProps {
  onNewChat: () => void;
  isConversationsOpen: boolean;
  onToggleConversations: () => void;
  conversationsCount: number;
  isHistoryOpen: boolean;
  onToggleHistory: () => void;
  historyCount: number;
  onOpenSettings: () => void;
}

export function AgentHeader({
  onNewChat,
  isConversationsOpen,
  onToggleConversations,
  conversationsCount,
  isHistoryOpen,
  onToggleHistory,
  historyCount,
  onOpenSettings,
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
        <Button
          variant="secondary"
          size="sm"
          onClick={onNewChat}
          aria-label="Start new conversation"
        >
          <Plus size={14} weight="bold" /> New Chat
        </Button>

        <Button
          variant={isConversationsOpen ? "primary" : "ghost"}
          size="sm"
          onClick={onToggleConversations}
          aria-label="Browse previous chats and projects"
        >
          <ChatCircleDots size={14} /> Chats ({conversationsCount})
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSettings}
          aria-label="Open AI and Agent settings"
        >
          <Sliders size={14} /> Settings
        </Button>

        <Button
          variant={isHistoryOpen ? "primary" : "ghost"}
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
