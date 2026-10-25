import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Typography } from "@app/design-system";
import { Sparkle, Clock } from "@phosphor-icons/react";
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
import { AgentOnboardingCard } from "./AgentOnboardingCard";
import { useAgentExecution } from "./useAgentExecution";
import { useAgentSchedules } from "./useAgentSchedules";
import { loadAIProviderStatus, loadSelectedProvider } from "../../ai/AISubsystem";
import { readNote } from "../../vault/vaultCommands";
import "./AgentView.module.scss";

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
  } = useAgentExecution();

  const [isConfigured, setIsConfigured] = useState(true);
  const [shortcuts, setShortcuts] = useState<AgentShortcut[]>([]);
  const { missedSchedules, dismissMissed } = useAgentSchedules();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const checkProviderConfig = useCallback(async () => {
    try {
      const providerId = await loadSelectedProvider();
      const status = await loadAIProviderStatus(providerId);
      setIsConfigured(status === "ready");
    } catch {
      setIsConfigured(false);
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
        <header className="agent-view__header">
          <div className="agent-view__title-group">
            <Sparkle size={18} weight="fill" />
            <Typography variant="text" size="md" weight="semibold">
              AI Vault Agent
            </Typography>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            aria-label="Toggle change history"
          >
            <Clock size={14} /> History ({ledger.transactions.length})
          </Button>
        </header>

        {missedSchedules.length > 0 && (
          <div className="agent-view__missed-banner" role="alert">
            <Typography variant="text" size="xs">
              Missed scheduled task while DaVinci Notes was closed: "{missedSchedules[0].title}"
            </Typography>
            <div className="agent-view__banner-actions">
              <Button
                variant="secondary"
                size="xs"
                onClick={() => {
                  const task = missedSchedules[0];
                  dismissMissed();
                  void sendMessage(task.prompt);
                }}
              >
                Run Now
              </Button>
              <Button variant="ghost" size="xs" onClick={dismissMissed}>
                Dismiss
              </Button>
            </div>
          </div>
        )}

        <div className="agent-view__messages">
          {!isConfigured && messages.length === 0 ? (
            <AgentOnboardingCard onConfigured={() => setIsConfigured(true)} />
          ) : messages.length === 0 ? (
            <div className="agent-view__empty">
              <Sparkle size={32} weight="duotone" />
              <Typography variant="text" size="sm" weight="medium">
                Talk to your vault
              </Typography>
              <Typography variant="text" size="xs" color="muted">
                Ask questions, summarize topics, create to-do lists, or organize notes across folders.
              </Typography>
            </div>
          ) : (
            messages.map((msg) => <AgentMessageBubble key={msg.id} message={msg} />)
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

        {isConfigured && (
          <div className="agent-view__controls">
            <AgentShortcutsBar
              shortcuts={shortcuts}
              onTriggerShortcut={(sc) => void sendMessage(sc.prompt)}
              disabled={isStreaming}
            />
            <AgentChatInput
              onSend={sendMessage}
              isStreaming={isStreaming}
              autoApply={autoApply}
              onToggleAutoApply={setAutoApply}
            />
          </div>
        )}
      </div>

      <AgentHistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        transactions={ledger.transactions}
        onRollback={rollback}
      />
    </div>
  );
}
