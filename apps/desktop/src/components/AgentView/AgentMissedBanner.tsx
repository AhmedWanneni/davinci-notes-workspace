import { Button, Typography } from "@app/design-system";
import type { AgentScheduleTask } from "@app/ai-agent";

export interface AgentMissedBannerProps {
  task: AgentScheduleTask;
  onRunNow: () => void;
  onDismiss: () => void;
}

export function AgentMissedBanner({
  task,
  onRunNow,
  onDismiss,
}: AgentMissedBannerProps) {
  return (
    <div className="agent-view__missed-banner" role="alert">
      <Typography variant="text" size="xs">
        Missed scheduled task: "{task.title}"
      </Typography>
      <div className="agent-view__banner-actions">
        <Button variant="secondary" size="sm" onClick={onRunNow}>
          Run Now
        </Button>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Dismiss
        </Button>
      </div>
    </div>
  );
}
