import React from "react";
import { Badge, Button, Typography } from "@app/design-system";
import { ArrowClockwise, Play, Stop } from "@phosphor-icons/react";
import type { SyncthingState } from "./useSyncthingStatus";
import styles from "./SyncthingPanel.module.scss";

export interface SyncthingStatusBannerProps {
  status: SyncthingState;
  version: string;
  guiAddress: string;
  errorMessage: string | null;
  lastLogs?: string[] | null;
  isLoading: boolean;
  autoStart: boolean;
  setAutoStart: (enabled: boolean) => void;
  onStart: () => void;
  onStop: () => void;
  onRestart: () => void;
  onRefresh: () => void;
}

function getStatusBadge(status: SyncthingState) {
  switch (status) {
    case "running":
      return <Badge variant="success">Running</Badge>;
    case "starting":
      return <Badge variant="warning">Starting...</Badge>;
    case "stopped":
      return <Badge variant="neutral">Stopped</Badge>;
    case "crashed":
      return <Badge variant="error">Crashed</Badge>;
    case "not-installed":
      return <Badge variant="neutral">Not installed</Badge>;
    case "bad-key":
      return <Badge variant="error">Key problem</Badge>;
    case "loading":
    default:
      return <Badge variant="neutral">Checking...</Badge>;
  }
}

function getStatusHint(
  status: SyncthingState,
  version: string,
  guiAddress: string,
  errorMessage: string | null,
) {
  switch (status) {
    case "running":
      return `Syncthing is active on ${guiAddress || "127.0.0.1:8384"}${version ? ` (${version})` : ""}.`;
    case "starting":
      return "Starting bundled Syncthing daemon...";
    case "stopped":
      return "Syncthing is stopped. Click Start to begin synchronizing your vault.";
    case "crashed":
      return errorMessage || "Syncthing daemon exited unexpectedly.";
    case "not-installed":
      return "Bundled Syncthing binary not found. Run 'pnpm prepare:syncthing' to fetch it.";
    case "bad-key":
      return "API key authentication failure.";
    case "loading":
    default:
      return "Querying local Syncthing daemon...";
  }
}

export function SyncthingStatusBanner({
  status,
  version,
  guiAddress,
  errorMessage,
  lastLogs,
  isLoading,
  autoStart,
  setAutoStart,
  onStart,
  onStop,
  onRestart,
  onRefresh,
}: SyncthingStatusBannerProps) {
  return (
    <>
      <div className={styles["syncthing-panel__status-banner"]}>
        <div className={styles["syncthing-panel__status-info"]}>
          <div className={styles["syncthing-panel__badge-row"]}>
            <Typography variant="h3" size="sm">
              Syncthing Daemon
            </Typography>
            {getStatusBadge(status)}
          </div>
          <p className={styles["syncthing-panel__hint"]}>
            {getStatusHint(status, version, guiAddress, errorMessage)}
          </p>
        </div>

        <div className={styles["syncthing-panel__button-group"]}>
          {status === "stopped" && (
            <Button
              variant="primary"
              size="sm"
              onClick={onStart}
              disabled={isLoading}
              aria-label="Start Syncthing"
            >
              <Play size={14} />
              Start
            </Button>
          )}

          {status === "crashed" && (
            <Button
              variant="primary"
              size="sm"
              onClick={onStart}
              disabled={isLoading}
              aria-label="Retry Start"
            >
              <Play size={14} />
              Retry Start
            </Button>
          )}

          {status === "running" && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={onStop}
                disabled={isLoading}
                aria-label="Stop Syncthing"
              >
                <Stop size={14} />
                Stop
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={onRestart}
                disabled={isLoading}
                aria-label="Restart Syncthing"
              >
                <ArrowClockwise size={14} />
                Restart
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            aria-label="Refresh Syncthing status"
          >
            <ArrowClockwise
              size={14}
              className={isLoading ? styles["is-spinning"] : ""}
            />
            Refresh
          </Button>
        </div>
      </div>

      <label className={styles["syncthing-panel__toggle-row"]}>
        <input
          type="checkbox"
          className={styles["syncthing-panel__checkbox"]}
          checked={autoStart}
          onChange={(e) => setAutoStart(e.target.checked)}
        />
        <span>Start Syncthing automatically when sync is on</span>
      </label>

      {status === "crashed" && lastLogs && lastLogs.length > 0 && (
        <div className={styles["syncthing-panel__logs-card"]} data-testid="syncthing-logs">
          <p className={styles["syncthing-panel__logs-title"]}>Recent Process Logs</p>
          <pre className={styles["syncthing-panel__logs"]}>
            <code>{lastLogs.join("\n")}</code>
          </pre>
        </div>
      )}
    </>
  );
}
