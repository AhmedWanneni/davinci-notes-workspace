import React, { useState } from "react";
import { CircleNotch, Clock, Pulse, ShieldCheck } from "@phosphor-icons/react";
import { Button, Typography } from "@app/design-system";
import {
  syncthingCheckSync,
  type SyncthingCheckReport,
} from "./syncthingCommands";
import { SyncthingCheckItemRow } from "./SyncthingCheckItemRow";
import styles from "./SyncthingSyncCheckSection.module.scss";

export interface SyncthingSyncCheckSectionProps {
  customReport?: SyncthingCheckReport | null;
  onChecked?: (report: SyncthingCheckReport) => void;
}

export function SyncthingSyncCheckSection({
  customReport = null,
  onChecked,
}: SyncthingSyncCheckSectionProps): React.JSX.Element {
  const [report, setReport] = useState<SyncthingCheckReport | null>(
    customReport,
  );
  const [isChecking, setIsChecking] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  const activeReport = customReport ?? report;

  const handleRunCheck = async (): Promise<void> => {
    setIsChecking(true);
    setGeneralError(null);
    try {
      const res = await syncthingCheckSync();
      setReport(res);
      onChecked?.(res);
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : String(err ?? "Sync check failed"),
      );
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className={styles["sync-check-card"]}>
      <div className={styles["sync-check-card__header"]}>
        <div className={styles["sync-check-card__title"]}>
          <ShieldCheck size={18} />
          <Typography variant="h3" size="sm">
            Sync Health Verification
          </Typography>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => void handleRunCheck()}
          disabled={isChecking}
          aria-label="Check sync"
        >
          {isChecking ? (
            <>
              <CircleNotch size={14} className="spin" />
              Checking...
            </>
          ) : (
            <>
              <Pulse size={14} />
              Check sync
            </>
          )}
        </Button>
      </div>

      {Boolean(generalError) && (
        <p className={styles["sync-check-card__reason"]}>
          Error: {generalError}
        </p>
      )}

      {activeReport && (
        <div className={styles["sync-check-card__results"]}>
          <SyncthingCheckItemRow
            title="1. Syncthing API Reachability"
            passed={activeReport.reachability.passed}
            reason={activeReport.reachability.reason}
          />

          <SyncthingCheckItemRow
            title="2. Remote Device Connectivity"
            passed={activeReport.remoteConnected.passed}
            reason={activeReport.remoteConnected.reason}
          />

          <SyncthingCheckItemRow
            title="3. Vault Folder Sync State"
            passed={activeReport.folderState.passed}
            reason={activeReport.folderState.reason}
          >
            {activeReport.folderState.folderId && (
              <div className={styles["sync-check-card__meta-group"]}>
                <span className={styles["sync-check-card__pill"]}>
                  State: {activeReport.folderState.state}
                </span>
                <span className={styles["sync-check-card__pill"]}>
                  Out of sync: {activeReport.folderState.outOfSyncItems}
                </span>
                {Object.entries(activeReport.folderState.remoteCompletions).map(
                  ([devId, pct]) => (
                    <span
                      key={devId}
                      className={`${styles["sync-check-card__pill"]} ${
                        pct >= 100
                          ? styles["sync-check-card__pill--success"]
                          : ""
                      }`}
                    >
                      Remote {devId.slice(0, 7)}: {pct.toFixed(0)}%
                    </span>
                  ),
                )}
              </div>
            )}
          </SyncthingCheckItemRow>

          <SyncthingCheckItemRow
            title="4. Folder API Error Diagnostic"
            passed={activeReport.folderErrors.passed}
            reason={activeReport.folderErrors.reason}
          >
            {activeReport.folderErrors.errors.length > 0 && (
              <div className={styles["sync-check-card__error-list"]}>
                {activeReport.folderErrors.errors.map((err, i) => (
                  <div key={i}>• {err}</div>
                ))}
              </div>
            )}
          </SyncthingCheckItemRow>

          <SyncthingCheckItemRow
            title="5. Round-Trip Sync Self-Test"
            passed={activeReport.selfTest.passed}
            reason={activeReport.selfTest.reason}
            badge={
              activeReport.selfTest.roundTripMs !== null ? (
                <span
                  className={`${styles["sync-check-card__pill"]} ${styles["sync-check-card__pill--success"]}`}
                >
                  <Clock size={12} />
                  {activeReport.selfTest.roundTripMs}ms
                </span>
              ) : undefined
            }
          />
        </div>
      )}
    </div>
  );
}
