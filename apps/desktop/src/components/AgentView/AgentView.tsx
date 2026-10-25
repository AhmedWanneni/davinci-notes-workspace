import { useEffect, useRef, useState, useCallback } from "react";
import { Button, Typography } from "@app/design-system";
import { Sparkle, Clock, Plus } from "@phosphor-icons/react";
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
import {
  loadAIProviderStatus,
  loadSelectedProvider,
} from "../../ai/AISubsystem";
import { readNote } from "../../vault/vaultCommands";
import "./AgentView.module.scss";

const STARTER_PROMPTS = [
  {
    title: "Weekly Summary",
    desc: "Review this week's notes and decisions",
    prompt:
      "Summarize the notes created or edited this week, highlighting key decisions and action items.",
  },
  {
    title: "Action Items & Tasks",
    desc: "Extract uncompleted task checklists",
    prompt:
      "Scan notes in my vault for uncompleted task checklist items and list them by priority.",
  },
  {
    title: "Create Wiki Topic",
    desc: "Synthesize notes into an evergreen page",
    prompt:
      "Synthesize notes in my vault into an evergreen topic note with [[Wikilinks]].",
  },
  {
    title: "Database Table",
    desc: "Create a structured markdown table",
    prompt:
      "Create a structured database table note summarizing my current active projects.",
  },
];

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
              Missed scheduled task while DaVinci Notes was closed: "
              {missedSchedules[0].title}"
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

        <div className="agent-view__messages">
          {!isConfigured && messages.length === 0 ? (
            <AgentOnboardingCard onConfigured={() => setIsConfigured(true)} />
          ) : messages.length === 0 ? (
            <div className="agent-view__empty">
              <div className="agent-view__empty-badge">
                <Sparkle size={26} weight="fill" />
              </div>
              <Typography variant="text" size="base" weight="semibold">
                What would you like to explore or create?
              </Typography>
              <Typography variant="text" size="xs" color="muted">
                Your AI companion can query notes, synthesize topics, generate
                databases, or organize folders.
              </Typography>

              <div className="agent-view__starter-grid">
                {STARTER_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="agent-view__starter-card"
                    onClick={() => void sendMessage(sp.prompt)}
                  >
                    <div className="agent-view__starter-title">{sp.title}</div>
                    <div className="agent-view__starter-desc">{sp.desc}</div>
                  </button>
                ))}
              </div>
            </div>
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

        {isConfigured && (
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
