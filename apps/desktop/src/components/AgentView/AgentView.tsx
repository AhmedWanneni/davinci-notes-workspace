import { useEffect, useRef } from "react";
import { Button, Typography } from "@app/design-system";
import { Sparkle, Clock } from "@phosphor-icons/react";
import { AgentMessageBubble } from "./AgentMessageBubble";
import { AgentDiffViewer } from "./AgentDiffViewer";
import { AgentChatInput } from "./AgentChatInput";
import { AgentHistoryDrawer } from "./AgentHistoryDrawer";
import { useAgentExecution } from "./useAgentExecution";
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

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void loadLedger();
  }, [loadLedger]);

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

        <div className="agent-view__messages">
          {messages.length === 0 ? (
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

        <AgentChatInput
          onSend={sendMessage}
          isStreaming={isStreaming}
          autoApply={autoApply}
          onToggleAutoApply={setAutoApply}
        />
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
