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
import { AgentSettingsPanel } from "./AgentSettingsPanel";
import { useAgentExecution } from "./useAgentExecution";
import { useAgentSchedules } from "./useAgentSchedules";
import { useAgentConversations } from "./useAgentConversations";
import { useAgentViewConfig } from "./useAgentViewConfig";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import type { ChatMessageItem } from "./agentTypes";
import "./AgentView.scss";

export function AgentView() {
  const {
    currentProvider,
    setCurrentProvider,
    currentModel,
    setCurrentModel,
    webSearchEnabled,
    handleToggleWebSearch,
    autoApply,
    handleToggleAutoApply,
    isSettingsOpen,
    setIsSettingsOpen,
    isConversationsOpen,
    setIsConversationsOpen,
    isConfigured,
    setIsConfigured,
    shortcuts,
    handleModelSelect,
  } = useAgentViewConfig();

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
  } = useAgentExecution({
    providerId: currentProvider,
    model: currentModel,
    webSearchEnabled,
    autoApply,
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

  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const vaultName = vaultPath
    ? vaultPath.split(/[/\\]/).pop() || "davinci-notes"
    : "davinci-notes";
  const { missedSchedules, dismissMissed } = useAgentSchedules();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (activeConversation)
      setMessages(activeConversation.messages as ChatMessageItem[]);
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
          hasMessages={messages.length > 0}
          onNewChat={() => {
            void createNewConversation(
              "New Chat",
              activeConversation?.projectId,
            );
            clearMessages();
          }}
          isSettingsOpen={isSettingsOpen}
          onToggleSettings={() => setIsSettingsOpen(!isSettingsOpen)}
          isConversationsOpen={isConversationsOpen}
          onToggleConversations={() =>
            setIsConversationsOpen(!isConversationsOpen)
          }
          conversationsCount={conversations.length}
          isHistoryOpen={isHistoryOpen}
          onToggleHistory={() => setIsHistoryOpen(!isHistoryOpen)}
          historyCount={ledger.transactions.length}
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
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={handleToggleWebSearch}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenConversations={() => setIsConversationsOpen(true)}
            disabled={!isConfigured && !currentModel}
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

      <AgentSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentProvider={currentProvider}
        onProviderChanged={(p) => {
          setCurrentProvider(p);
          setIsConfigured(true);
        }}
        currentModel={currentModel}
        onModelChanged={(m) => setCurrentModel(m)}
        webSearchEnabled={webSearchEnabled}
        onToggleWebSearch={handleToggleWebSearch}
        autoApply={autoApply}
        onToggleAutoApply={handleToggleAutoApply}
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
