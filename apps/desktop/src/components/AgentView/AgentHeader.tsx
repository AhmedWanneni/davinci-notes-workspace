import { Button } from "@app/design-system";
import { Plus, Sliders, ChatCircleDots } from "@phosphor-icons/react";

export interface AgentHeaderProps {
  onNewChat: () => void;
  isConversationsOpen?: boolean;
  onToggleConversations?: () => void;
  conversationsCount?: number;
  onOpenSettings: () => void;
  isHistoryOpen?: boolean;
  onToggleHistory?: () => void;
  historyCount?: number;
}

export function AgentHeader({
  onNewChat,
  isConversationsOpen,
  onToggleConversations,
  conversationsCount = 0,
  onOpenSettings,
}: AgentHeaderProps) {
  return (
    <header className="agent-view__header">
      <div className="agent-view__header-actions">
        <Button
          variant="secondary"
          size="sm"
          onClick={onNewChat}
          aria-label="Start new conversation"
        >
          <Plus size={14} weight="bold" /> New Chat
        </Button>

        {onToggleConversations && (
          <Button
            variant={isConversationsOpen ? "primary" : "ghost"}
            size="sm"
            onClick={onToggleConversations}
            aria-label="Browse previous chats and projects"
          >
            <ChatCircleDots size={14} /> Chats ({conversationsCount})
          </Button>
        )}
      </div>

      <div className="agent-view__header-actions">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSettings}
          aria-label="Open AI and Agent settings"
          title="Settings"
        >
          <Sliders size={16} />
        </Button>
      </div>
    </header>
  );
}
