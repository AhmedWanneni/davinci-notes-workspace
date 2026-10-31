import {
  Terminal,
  CheckCircle,
  WarningCircle,
  CircleNotch,
} from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import styles from "./AgentCliStatusCard.module.scss";

export interface AgentCliStatusCardProps {
  agentName: string;
  status: "running" | "done" | "error";
  logs: string[];
  onCancel?: () => void;
}

export function AgentCliStatusCard({
  agentName,
  status,
  logs,
  onCancel,
}: AgentCliStatusCardProps) {
  return (
    <div className={styles["agent-cli-card"]} data-testid="agent-cli-card">
      <div className={styles["agent-cli-card__header"]}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Terminal size={14} />
          <span>{agentName}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className={styles["agent-cli-card__badge"]}>
            {status === "running" && (
              <>
                <CircleNotch size={12} className="spin" /> RUNNING
              </>
            )}
            {status === "done" && (
              <>
                <CheckCircle size={12} /> COMPLETE
              </>
            )}
            {status === "error" && (
              <>
                <WarningCircle size={12} /> ERROR
              </>
            )}
          </span>
          {status === "running" && onCancel && (
            <Button variant="ghost" size="sm" onClick={onCancel}>
              Stop
            </Button>
          )}
        </div>
      </div>

      <div className={styles["agent-cli-card__logs"]}>
        {logs.map((log, index) => {
          let rowClass = "";
          if (
            log.startsWith("Writing") ||
            log.startsWith("Creating") ||
            log.startsWith("Moving")
          ) {
            rowClass = styles["agent-cli-card__action-row"];
          } else if (log.toLowerCase().includes("error")) {
            rowClass = styles["agent-cli-card__error-row"];
          }
          return (
            <div key={index} className={rowClass}>
              {log}
            </div>
          );
        })}
      </div>
    </div>
  );
}
