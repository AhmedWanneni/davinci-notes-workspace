import { useEffect, useRef } from "react";
import { AgentHeader } from "./AgentHeader";
import { AgentMissedBanner } from "./AgentMissedBanner";
import { AgentMessageBubble } from "./AgentMessageBubble";
import { AgentDiffViewer } from "./AgentDiffViewer";
import { AgentChatInput } from "./AgentChatInput";
import { AgentHistoryDrawer } from "./AgentHistoryDrawer";
import { AgentConversationsDrawer } from "./AgentConversationsDrawer";
import { AgentShortcutsBar } from "./AgentShortcutsBar";
import { AgentStarterPrompts } from "./AgentStarterPrompts";
import { AgentCliStatusCard } from "./AgentCliStatusCard";
import { useAgentExecution } from "./useAgentExecution";
import { useAgentSchedules } from "./useAgentSchedules";
import { useAgentConversations } from "./useAgentConversations";
import { useAgentViewConfig } from "./useAgentViewConfig";
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
    ledger,
    isHistoryOpen,
    setIsHistoryOpen,
    loadLedger,
    rollback,
    handleApplyChange,
    handleRejectChange,
    handleApplyAllChanges,
    sendMessage,
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastLoadedConvIdRef = useRef<string | null>(null);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages]);

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
          isHistoryOpen={isHistoryOpen}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          historyCount={ledger.transactions.length}
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

        <div className="agent-view__messages">
          {messages.length === 0 ? (
            <AgentStarterPrompts
              vaultName={vaultName}
              onSelectPrompt={(prompt) => void sendMessage(prompt)}
            />
          ) : (
            messages.map((msg) => (
              <AgentMessageBubble key={msg.id} message={msg} />
            ))
          )}
          {cliSession && (
            <AgentCliStatusCard
              agentName={cliSession.agentName}
              status={cliSession.status}
              logs={cliSession.logs}
              onCancel={cancelActiveCliSession}
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

        <div className="agent-view__controls">
          <AgentShortcutsBar
            shortcuts={shortcuts}
            onTriggerShortcut={(sc) => void sendMessage(sc.prompt)}
            disabled={isStreaming}
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

      <AgentHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transactions={ledger.transactions}
        onRollback={rollback}
      />
    </div>
  );
}
