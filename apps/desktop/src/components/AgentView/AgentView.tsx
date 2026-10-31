import { useEffect, useRef } from "react";
import { AgentHeader } from "./AgentHeader";
import { AgentMissedBanner } from "./AgentMissedBanner";
import { AgentMessageList } from "./AgentMessageList";
import { AgentDiffViewer } from "./AgentDiffViewer";
import { AgentChatInput } from "./AgentChatInput";
import { AgentConversationsDrawer } from "./AgentConversationsDrawer";
import { AgentScrollBottomBtn } from "./AgentScrollBottomBtn";
import { useAgentExecution } from "./useAgentExecution";
import { useAgentSchedules } from "./useAgentSchedules";
import { useAgentConversations } from "./useAgentConversations";
import { useAgentViewConfig } from "./useAgentViewConfig";
import { useChatScroll } from "./useChatScroll";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { ChatMessageItem } from "./agentTypes";
import "./AgentView.scss";

export interface AgentViewProps {
  onOpenSettings?: () => void;
}

export function AgentView({ onOpenSettings }: AgentViewProps = {}) {
  const {
    currentProvider,
    currentModel,
    webSearchEnabled,
    handleToggleWebSearch,
    autoApply,
    handleToggleAutoApply,
    rewriteEnabled,
    isConversationsOpen,
    setIsConversationsOpen,
    isConfigured,
    shortcuts,
    handleModelSelect,
    selectedCliAgent,
    setSelectedCliAgent,
  } = useAgentViewConfig();

  const handleOpenSettings = () => {
    if (onOpenSettings) {
      onOpenSettings();
    } else {
      window.dispatchEvent(
        new CustomEvent("davinci-open-settings", { detail: { tab: "ai" } }),
      );
    }
  };

  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const vaultName = vaultPath
    ? vaultPath.split(/[/\\]/).pop() || "davinci-notes"
    : "davinci-notes";

  const {
    messages,
    stagedChanges,
    isStreaming,
    handleApplyChange,
    handleRejectChange,
    handleApplyAllChanges,
    sendMessage,
    handleEditMessage,
    handleRegenerateMessage,
    abortExecution,
    clearMessages,
    setMessages,
    cliSession,
    cancelActiveCliSession,
  } = useAgentExecution({
    providerId: currentProvider,
    model: currentModel,
    webSearchEnabled,
    autoApply,
    rewriteEnabled,
    vaultName,
    selectedCliAgent,
    vaultPath: vaultPath ?? undefined,
  });

  const {
    conversations,
    projects,
    activeConversation,
    activeConversationId,
    createNewConversation,
    selectConversation,
    saveActiveMessages,
    removeConversation,
    addProject,
    assignConversationProject,
  } = useAgentConversations();

  const { missedSchedules, dismissMissed } = useAgentSchedules();
  const lastLoadedConvIdRef = useRef<string | null>(null);

  const { scrollRef, showScrollBottomBtn, scrollToBottom } = useChatScroll([
    messages,
    isStreaming,
    cliSession?.logs?.length,
  ]);

  // Only load conversation messages when switching conversations to prevent infinite effect loops
  useEffect(() => {
    if (
      activeConversation &&
      activeConversation.id !== lastLoadedConvIdRef.current
    ) {
      lastLoadedConvIdRef.current = activeConversation.id;
      setMessages(activeConversation.messages as ChatMessageItem[]);
    }
  }, [activeConversation, setMessages]);

  useEffect(() => {
    if (messages.length > 0) void saveActiveMessages(messages);
  }, [messages, saveActiveMessages]);

  const activeProject = projects.find(
    (p) => p.id === activeConversation?.projectId,
  );

  return (
    <div className="agent-view" role="main" aria-label="AI Vault Agent">
      <div className="agent-view__main">
        <AgentHeader
          onNewChat={() => {
            void createNewConversation("New Chat", activeProject?.id);
            clearMessages();
          }}
          isConversationsOpen={isConversationsOpen}
          onToggleConversations={() =>
            setIsConversationsOpen(!isConversationsOpen)
          }
          conversationsCount={conversations.length}
          onOpenSettings={handleOpenSettings}
        />

        {missedSchedules.length > 0 && (
          <AgentMissedBanner
            task={missedSchedules[0]}
            onRunNow={() => {
              const task = missedSchedules[0];
              dismissMissed();
              void sendMessage(task.prompt);
            }}
            onDismiss={dismissMissed}
          />
        )}

        <AgentMessageList
          messages={messages}
          scrollRef={scrollRef}
          vaultName={vaultName}
          onSendMessage={(prompt) => void sendMessage(prompt)}
          onEditMessage={(id, text) => void handleEditMessage(id, text)}
          onRegenerateMessage={(id) => void handleRegenerateMessage(id)}
          cliSession={cliSession}
          cancelActiveCliSession={cancelActiveCliSession}
        />

        {stagedChanges.length > 0 && (
          <AgentDiffViewer
            stagedItems={stagedChanges}
            onAccept={handleApplyChange}
            onReject={handleRejectChange}
            onAcceptAll={handleApplyAllChanges}
          />
        )}

        <div className="agent-view__controls">
          <AgentScrollBottomBtn
            visible={showScrollBottomBtn}
            onClick={() => scrollToBottom(true)}
          />
          <AgentChatInput
            onSend={sendMessage}
            onCancel={abortExecution}
            isStreaming={isStreaming}
            autoApply={autoApply}
            onToggleAutoApply={handleToggleAutoApply}
            vaultName={vaultName}
            projectName={activeProject?.name}
            currentProvider={currentProvider}
            currentModel={currentModel}
            onSelectModel={handleModelSelect}
            selectedCliAgent={selectedCliAgent}
            onSelectCliAgent={setSelectedCliAgent}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={handleToggleWebSearch}
            onOpenSettings={handleOpenSettings}
            onOpenConversations={() => setIsConversationsOpen(true)}
            shortcuts={shortcuts}
            disabled={!isConfigured && !currentModel && !selectedCliAgent}
          />
        </div>
      </div>

      <AgentConversationsDrawer
        isOpen={isConversationsOpen}
        onClose={() => setIsConversationsOpen(false)}
        conversations={conversations}
        projects={projects}
        activeConversationId={activeConversationId}
        onSelectConversation={(id) => {
          void selectConversation(id);
          setIsConversationsOpen(false);
        }}
        onNewConversation={(projId) => {
          void createNewConversation("New Chat", projId);
          clearMessages();
          setIsConversationsOpen(false);
        }}
        onDeleteConversation={(id) => void removeConversation(id)}
        onAddProject={(name) => void addProject(name)}
        onAssignProject={(cId, pId) => void assignConversationProject(cId, pId)}
      />
    </div>
  );
}
