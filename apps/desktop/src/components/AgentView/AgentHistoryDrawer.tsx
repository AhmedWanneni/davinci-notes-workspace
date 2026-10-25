import { Button, Typography, Badge } from "@app/design-system";
import { ArrowCounterClockwise, Clock, X } from "@phosphor-icons/react";
import type { AgentTransaction } from "@app/ai-agent";

export interface AgentHistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: AgentTransaction[];
  onRollback: (transactionId: string) => Promise<void>;
}

export function AgentHistoryDrawer({
  isOpen,
  onClose,
  transactions,
  onRollback,
}: AgentHistoryDrawerProps) {
  if (!isOpen) return null;

  return (
    <aside className="agent-history-drawer" aria-label="Agent transaction history">
      <div className="agent-history-drawer__header">
        <div className="agent-history-drawer__title">
          <Clock size={16} />
          <Typography variant="text" size="sm" weight="semibold">
            Agent Change History
          </Typography>
        </div>
        <button
          type="button"
          className="agent-history-drawer__close-btn"
          onClick={onClose}
          aria-label="Close history"
        >
          <X size={16} />
        </button>
      </div>

      <div className="agent-history-drawer__list">
        {transactions.length === 0 ? (
          <div className="agent-history-drawer__empty">
            <Typography variant="text" size="xs" color="muted">
              No recent changes recorded.
            </Typography>
          </div>
        ) : (
          [...transactions].reverse().map((tx) => (
            <div key={tx.transactionId} className="agent-history-item" data-undone={tx.undone || undefined}>
              <div className="agent-history-item__header">
                <Typography variant="text" size="xs" weight="medium">
                  {tx.prompt}
                </Typography>
                {tx.undone ? (
                  <Badge variant="neutral" size="sm">
                    UNDONE
                  </Badge>
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void onRollback(tx.transactionId)}
                    aria-label={`Undo ${tx.prompt}`}
                  >
                    <ArrowCounterClockwise size={12} /> Undo
                  </Button>
                )}
              </div>

              <div className="agent-history-item__meta">
                <Typography variant="text" size="xs" color="muted">
                  {new Date(tx.timestamp).toLocaleString()} • {tx.changes.length} file(s)
                </Typography>
              </div>

              <ul className="agent-history-item__changes">
                {tx.changes.map((c, idx) => (
                  <li key={idx} className="agent-history-item__change">
                    <span className={`agent-history-item__badge agent-history-item__badge--${c.action}`}>
                      {c.action}
                    </span>
                    <span className="agent-history-item__path">{c.path}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
