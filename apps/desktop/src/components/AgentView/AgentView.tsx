import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Typography } from "@app/design-system";
import { Sparkle, Clock, Plus, Sliders } from "@phosphor-icons/react";
import {
  parseShortcuts,
  type AgentShortcut,
  SHORTCUTS_FILE_PATH,
} from "@app/ai-agent";
import { AgentMessageBubble } from "./AgentMessageBubble";
import { AgentDiffViewer } from "./AgentDiffViewer";
import { AgentChatInput } from "./AgentChatInput";
import { AgentHistoryDrawer } from "./AgentHistoryDrawer";
import { AgentShortcutsBar } from "./AgentShortcutsBar";
import { AgentStarterPrompts } from "./AgentStarterPrompts";
import { AgentSettingsPanel } from "./AgentSettingsPanel";
import { useAgentExecution } from "./useAgentExecution";
import { useAgentSchedules } from "./useAgentSchedules";
import {
  loadAIProviderStatus,
  loadSelectedProvider,
  loadProviderModels,
  type AIProviderId,
} from "../../ai/AISubsystem";
import { readNote } from "../../vault/vaultCommands";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import "./AgentView.scss";

export function AgentView() {
  const {
    messages,
    stagedChanges,
    isStreaming,
    autoApply,
    setAutoApply,
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
  } = useAgentExecution();

  const vaultPath = useWorkspaceStore((state) => state.vaultPath);
  const vaultName = vaultPath ? vaultPath.split(/[/\\]/).pop() || "davinci-notes" : "davinci-notes";

  const [currentProvider, setCurrentProvider] = useState<AIProviderId>("gemini");
  const [currentModel, setCurrentModel] = useState("gemini-2.0-flash");
  const [webSearchEnabled, setWebSearchEnabled] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfigured, setIsConfigured] = useState(true);
  const [shortcuts, setShortcuts] = useState<AgentShortcut[]>([]);
  const { missedSchedules, dismissMissed } = useAgentSchedules();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const checkProviderConfig = useCallback(async () => {
    try {
      const providerId = await loadSelectedProvider();
      setCurrentProvider(providerId);
      const models = await loadProviderModels(providerId);
      setCurrentModel(models.chatModel);
      const status = await loadAIProviderStatus(providerId);
      const ready = status === "ready";
      setIsConfigured(ready);
      if (!ready) {
        setIsSettingsOpen(true);
      }
    } catch {
      setIsConfigured(false);
      setIsSettingsOpen(true);
    }
  }, []);

  const loadShortcuts = useCallback(async () => {
    try {
      const file = await readNote(SHORTCUTS_FILE_PATH);
      setShortcuts(parseShortcuts(file.content).shortcuts);
    } catch {
      setShortcuts(parseShortcuts(null).shortcuts);
    }
  }, []);

  useEffect(() => {
    void loadLedger();
    void checkProviderConfig();
    void loadShortcuts();
  }, [checkProviderConfig, loadLedger, loadShortcuts]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="agent-view" role="main" aria-label="AI Vault Agent">
      <div className="agent-view__main">
        {/* Top Header */}
        <header className="agent-view__header">
          <div className="agent-view__title-group">
            <Sparkle size={18} weight="fill" />
            <Typography variant="text" size="base" weight="semibold">
              AI Vault Agent
            </Typography>
          </div>
          <div className="agent-view__header-actions">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearMessages}
                aria-label="Start new conversation"
              >
                <Plus size={14} weight="bold" /> New Chat
              </Button>
            )}
            <Button
              variant={isSettingsOpen ? "primary" : "ghost"}
              size="sm"
              onClick={() => setIsSettingsOpen(!isSettingsOpen)}
              aria-label="Toggle agent settings"
            >
              <Sliders size={14} /> Settings
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsHistoryOpen(!isHistoryOpen)}
              aria-label="Toggle change history"
            >
              <Clock size={14} /> History ({ledger.transactions.length})
            </Button>
          </div>
        </header>

        {missedSchedules.length > 0 && (
          <div className="agent-view__missed-banner" role="alert">
            <Typography variant="text" size="xs">
              Missed scheduled task: "{missedSchedules[0].title}"
            </Typography>
            <div className="agent-view__banner-actions">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  const task = missedSchedules[0];
                  dismissMissed();
                  void sendMessage(task.prompt);
                }}
              >
                Run Now
              </Button>
              <Button variant="ghost" size="sm" onClick={dismissMissed}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        {/* Conversation Stream & Empty State */}
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

        {/* Staged Changes Diff Viewer */}
        {stagedChanges.length > 0 && (
          <AgentDiffViewer
            stagedItems={stagedChanges}
            onAccept={handleApplyChange}
            onReject={handleRejectChange}
            onAcceptAll={handleApplyAllChanges}
          />
        )}

        {/* Floating Input Dock matching screenshot */}
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
            onToggleAutoApply={setAutoApply}
            vaultName={vaultName}
            currentProvider={currentProvider}
            currentModel={currentModel}
            onSelectModel={(model, provider) => {
              setCurrentModel(model);
              setCurrentProvider(provider);
            }}
            webSearchEnabled={webSearchEnabled}
            onToggleWebSearch={setWebSearchEnabled}
            onOpenSettings={() => setIsSettingsOpen(true)}
            disabled={!isConfigured && !currentModel}
          />
        </div>
      </div>

      {/* On-page Settings Panel */}
      <AgentSettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        currentProvider={currentProvider}
        onProviderChanged={(p) => {
          setCurrentProvider(p);
          setIsConfigured(true);
        }}
        webSearchEnabled={webSearchEnabled}
        onToggleWebSearch={setWebSearchEnabled}
        autoApply={autoApply}
        onToggleAutoApply={setAutoApply}
      />

      {/* History Drawer */}
      <AgentHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transactions={ledger.transactions}
        onRollback={rollback}
      />
    </div>
  );
}
