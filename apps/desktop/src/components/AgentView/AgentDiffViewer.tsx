import { Button, Typography, Badge } from "@app/design-system";
import { Check, X, FileText } from "@phosphor-icons/react";
import type { StagedChangeItem } from "./agentTypes";

export interface AgentDiffViewerProps {
  stagedItems: StagedChangeItem[];
  onAccept: (item: StagedChangeItem) => void;
  onReject: (item: StagedChangeItem) => void;
  onAcceptAll: () => void;
}

export function AgentDiffViewer({
  stagedItems,
  onAccept,
  onReject,
  onAcceptAll,
}: AgentDiffViewerProps) {
  const pending = stagedItems.filter((i) => i.status === "pending");
  if (pending.length === 0) return null;

  return (
    <div className="agent-diff-viewer" aria-label="Review proposed file changes">
      <div className="agent-diff-viewer__header">
        <Typography variant="text" size="sm" weight="semibold">
          Proposed Vault Changes ({pending.length})
        </Typography>
        <Button variant="primary" size="sm" onClick={onAcceptAll}>
          Accept All Changes
        </Button>
      </div>

      <div className="agent-diff-viewer__list">
        {pending.map((item) => {
          const { changeRecord, diff } = item.plan;
          const badgeVariant =
            changeRecord.action === "create"
              ? "success"
              : changeRecord.action === "delete"
                ? "danger"
                : "neutral";

          return (
            <div key={item.id} className="agent-diff-card">
              <div className="agent-diff-card__header">
                <div className="agent-diff-card__title">
                  <FileText size={15} />
                  <Typography variant="text" size="xs" weight="medium">
                    {changeRecord.path}
                  </Typography>
                  <Badge variant={badgeVariant} size="sm">
                    {changeRecord.action.toUpperCase()}
                  </Badge>
                </div>
                <div className="agent-diff-card__actions">
                  <Button variant="secondary" size="sm" onClick={() => onReject(item)} aria-label="Reject change">
                    <X size={13} /> Reject
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => onAccept(item)} aria-label="Accept change">
                    <Check size={13} /> Accept
                  </Button>
                </div>
              </div>

              <div className="agent-diff-card__body">
                <pre className="agent-diff-card__lines">
                  {diff.slice(0, 40).map((line, idx) => (
                    <div
                      key={idx}
                      className={`agent-diff-card__line agent-diff-card__line--${line.kind}`}
                    >
                      <span className="agent-diff-card__prefix">
                        {line.kind === "added" ? "+" : line.kind === "removed" ? "-" : " "}
                      </span>
                      <span className="agent-diff-card__text">{line.text}</span>
                    </div>
                  ))}
                  {diff.length > 40 && (
                    <div className="agent-diff-card__line agent-diff-card__line--truncated">
                      ... {diff.length - 40} more lines
                    </div>
                  )}
                </pre>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
