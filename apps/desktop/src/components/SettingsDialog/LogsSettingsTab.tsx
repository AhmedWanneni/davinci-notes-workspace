import React from "react";
import { SettingsCard } from "./SettingsCard";
import styles from "./SettingsDialog.module.scss";

export interface LogsSettingsTabProps {
  log: string[];
}

export function LogsSettingsTab({ log }: LogsSettingsTabProps) {
  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard
        title="Vault Activity Logs"
        description="Recent vault events, indexing activities, and system messages."
      >
        {log.length > 0 ? (
          <pre
            className="debug-log"
            style={{ maxHeight: "350px", margin: "var(--space-2) 0" }}
          >
            {log.join("\n")}
          </pre>
        ) : (
          <p
            style={{
              color: "var(--color-text-muted)",
              fontSize: "var(--type-scale-xs)",
              margin: "var(--space-2) 0",
            }}
          >
            No log entries recorded.
          </p>
        )}
      </SettingsCard>
    </div>
  );
}
