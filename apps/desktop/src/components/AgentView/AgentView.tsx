import { useEffect, useRef, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { AgentMessageBubble } from "./AgentMessageBubble";
import { AgentDiffViewer } from "./AgentDiffViewer";
import { AgentWelcomeView } from "./AgentWelcomeView";
import { AgentProjectView } from "./AgentProjectView";
import { AgentPromptBar } from "./AgentPromptBar";
import { AgentConversationHeader } from "./AgentConversationHeader";
import { useAgentExecution } from "./useAgentExecution";
import { useAgentConversations } from "./useAgentConversations";
import { useAgentViewConfig } from "./useAgentViewConfig";
import { useAgentStore } from "./useAgentStore";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { AIProviderId } from "../../ai/AISubsystem";
import type { ChatMessageItem } from "./agentTypes";
import "./AgentView.scss";

export interface AgentViewProps {
  onOpenSettings?: () => void;
}

export function AgentView({
  onOpenSettings: _onOpenSettings,
}: AgentViewProps = {}) {
  const { webSearchEnabled, autoApply, rewriteEnabled, shortcuts } =
    useAgentViewConfig();

  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const vaultName = vaultPath
    ? vaultPath.split(/[/\\]/).pop() || "Ahmed"
    : "Ahmed";

  const selectedModel = useAgentStore((s) => s.selectedModel);
  const selectedProvider = useAgentStore((s) => s.selectedProvider);
  const selectedCliAgent = useAgentStore((s) => s.selectedCliAgent);
  const activeProjectId = useAgentStore((s) => s.activeProjectId);
  const selectProject = useAgentStore((s) => s.selectProject);
  const deleteConversation = useAgentStore((s) => s.deleteConversation);
  const renameConversation = useAgentStore((s) => s.renameConversation);

  const {
    messages,
    stagedChanges,
    isStreaming,
    handleApplyChange,
    handleRejectChange,
    handleApplyAllChanges,
    sendMessage,
    abortExecution,
    setMessages,
  } = useAgentExecution({
    providerId: selectedProvider as AIProviderId,
    model: selectedModel,
    webSearchEnabled,
    autoApply,
    rewriteEnabled,
    vaultName,
    selectedCliAgent,
    vaultPath: vaultPath ?? undefined,
  });

  const {
    projects,
    activeConversation,
    activeConversationId,
    createNewConversation,
    saveActiveMessages,
  } = useAgentConversations();

  const [chatInput, setChatInput] = useState("");
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesScrollRef = useRef<HTMLDivElement>(null);
  const lastLoadedConvIdRef = useRef<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const el = messagesScrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBottom(distance > 120);
    };
    el.addEventListener("scroll", handleScroll);
    return () => el.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (activeConversationId) {
      if (
        activeConversation &&
        activeConversation.id !== lastLoadedConvIdRef.current
      ) {
        lastLoadedConvIdRef.current = activeConversation.id;
        setMessages(activeConversation.messages as ChatMessageItem[]);
      }
    } else {
      lastLoadedConvIdRef.current = null;
      setMessages([]);
    }
  }, [activeConversationId, activeConversation, setMessages]);

  useEffect(() => {
    if (activeConversationId && messages.length > 0) {
      void saveActiveMessages(messages);
    }
  }, [activeConversationId, messages, saveActiveMessages]);

  const activeProject = projects.find(
    (p) => p.id === (activeProjectId || activeConversation?.projectId),
  );

  if (activeProjectId && !activeConversationId) {
    return (
      <div className="agent-view" role="main" aria-label="AI Vault Agent">
        <AgentProjectView
          projectId={activeProjectId}
          onSend={(prompt) => {
            void createNewConversation("New Chat", activeProjectId);
            void sendMessage(prompt);
          }}
          shortcuts={shortcuts}
          isStreaming={isStreaming}
        />
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="agent-view" role="main" aria-label="AI Vault Agent">
        <AgentWelcomeView
          userName={vaultName}
          onSend={(prompt) => void sendMessage(prompt)}
          shortcuts={shortcuts}
          isStreaming={isStreaming}
        />
      </div>
    );
  }

  const chatTitle =
    activeProject?.name || activeConversation?.title || "Search";

  return (
    <div className="agent-view" role="main" aria-label="AI Vault Agent">
      <div className="agent-view__main">
        <AgentConversationHeader
          title={chatTitle}
          projectName={activeProject?.name}
          projectId={activeProject?.id}
          onNavigateProject={(pId) => selectProject(pId)}
          onRename={() => {
            if (!activeConversationId) return;
            const next = window.prompt("Rename conversation:", chatTitle);
            if (next && next.trim())
              void renameConversation(activeConversationId, next.trim());
          }}
          onDelete={() => {
            if (!activeConversationId) return;
            if (window.confirm(`Delete conversation "${chatTitle}"?`)) {
              void deleteConversation(activeConversationId);
            }
          }}
        />

        <div className="agent-view__messages" ref={messagesScrollRef}>
          {messages.map((msg) => (
            <AgentMessageBubble key={msg.id} message={msg} />
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
            onAccept={handleApplyChange}
            onReject={handleRejectChange}
            onAcceptAll={handleApplyAllChanges}
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
            onChange={setChatInput}
            onSubmit={() => {
              if (chatInput.trim()) {
                void sendMessage(chatInput.trim());
                setChatInput("");
              }
            }}
            onSendWithImages={(text, imgs) => {
              void sendMessage(text, imgs);
              setChatInput("");
            }}
            placeholder="Write a message..."
            shortcuts={shortcuts}
            isStreaming={isStreaming}
            onCancel={abortExecution}
          />
        </div>
      </div>
    </div>
  );
}
