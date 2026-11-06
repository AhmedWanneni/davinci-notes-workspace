import { useRef, useState, useEffect } from "react";
import { CaretDown } from "@phosphor-icons/react";
import type { AgentProject, AgentShortcut } from "@app/ai-agent";
import { AgentConversationHeader } from "./AgentConversationHeader";
import { AgentMessageBubble } from "./AgentMessageBubble";
import { AgentDiffViewer } from "./AgentDiffViewer";
import { AgentPromptBar } from "./AgentPromptBar";
import { normalizeVaultPath } from "./desktopAgentBridge";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { ChatMessageItem, StagedChangeItem } from "./agentTypes";

export interface AgentActiveChatProps {
  chatTitle: string;
  activeProject?: AgentProject;
  onNavigateProject: (pId: string) => void;
  onRename: () => void;
  onDelete: () => void;
  messages: ChatMessageItem[];
  isStreaming: boolean;
  stagedChanges: StagedChangeItem[];
  onAcceptChange: (id: string) => void;
  onRejectChange: (id: string) => void;
  onAcceptAllChanges: () => void;
  chatInput: string;
  onChangeChatInput: (val: string) => void;
  onSendChat: (text: string, imgs?: string[]) => void;
  shortcuts: AgentShortcut[];
  onCancel: () => void;
}

export function AgentActiveChat({
  chatTitle,
  activeProject,
  onNavigateProject,
  onRename,
  onDelete,
  messages,
  isStreaming,
  stagedChanges,
  onAcceptChange,
  onRejectChange,
  onAcceptAllChanges,
  chatInput,
  onChangeChatInput,
  onSendChat,
  shortcuts,
  onCancel,
}: AgentActiveChatProps) {
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const handleScroll = () =>
      setShowScrollBottom(
        el.scrollHeight - el.scrollTop - el.clientHeight > 120,
      );
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="agent-view" role="main" aria-label="AI Vault Agent">
      <div className="agent-view__main">
        <AgentConversationHeader
          title={chatTitle}
          projectName={activeProject?.name}
          projectId={activeProject?.id}
          onNavigateProject={onNavigateProject}
          onRename={onRename}
          onDelete={onDelete}
        />

        <div className="agent-view__messages" ref={messagesScrollRef}>
          {messages.map((msg) => (
            <AgentMessageBubble
              key={msg.id}
              message={msg}
              onNavigateNote={(notePath) => {
                const state = useWorkspaceStore.getState();
                const resolved = normalizeVaultPath(
                  notePath,
                  state.allNotePaths,
                );
                void state.openNote(resolved);
              }}
              onNavigateFolder={(folderPath) => {
                useWorkspaceStore.getState().revealFolderInTree(folderPath);
              }}
            />
          ))}
          {isStreaming && messages[messages.length - 1]?.role === "user" && (
            <AgentMessageBubble
              message={{
                id: "streaming-thinking-placeholder",
                role: "assistant",
                content: "",
                isStreaming: true,
                timestamp: Date.now(),
              }}
            />
          )}
          <div ref={messagesEndRef} />
        </div>

        {stagedChanges.length > 0 && (
          <AgentDiffViewer
            stagedItems={stagedChanges}
            onAccept={onAcceptChange}
            onReject={onRejectChange}
            onAcceptAll={onAcceptAllChanges}
          />
        )}

        {showScrollBottom && (
          <button
            type="button"
            className="agent-scroll-bottom-btn"
            onClick={scrollToBottom}
            aria-label="Scroll to bottom"
          >
            <CaretDown size={16} weight="bold" />
          </button>
        )}

        <div className="agent-view__controls">
          <AgentPromptBar
            value={chatInput}
            onChange={onChangeChatInput}
            onSubmit={() => onSendChat(chatInput)}
            onSendWithImages={onSendChat}
            placeholder="Write a message..."
            shortcuts={shortcuts}
            isStreaming={isStreaming}
            onCancel={onCancel}
          />
        </div>
      </div>
    </div>
  );
}
