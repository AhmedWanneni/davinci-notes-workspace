import React, { useEffect } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowsClockwise,
  CloudCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { useGitSyncStore } from "../store/useGitSyncStore";
import { useGitManagerStore } from "../store/useGitManagerStore";
import styles from "./GitSyncToolbar.module.scss";

export const GitSyncToolbar: React.FC = () => {
  const {
    tracking,
    isSyncing,
    syncError,
    syncMessage,
    refreshTracking,
    fetch,
    pull,
    push,
    clearSyncMessage,
  } = useGitSyncStore();

  const refreshStatus = useGitManagerStore((s) => s.refreshStatus);
  const repoInfo = useGitManagerStore((s) => s.repoInfo);

  useEffect(() => {
    if (repoInfo?.isRepo) {
      void refreshTracking();
    }
  }, [repoInfo?.isRepo, refreshTracking]);

  const handleFetch = async () => {
    await fetch();
    await refreshStatus();
  };

  const handlePull = async () => {
    await pull();
    await refreshStatus();
  };

  const handlePush = async () => {
    await push();
    await refreshStatus();
  };

  const hasUpstream = !!tracking?.upstream;
  const ahead = tracking?.ahead ?? 0;
  const behind = tracking?.behind ?? 0;

  return (
    <div className={styles["sync-toolbar"]} role="region" aria-label="Remote synchronization">
      <div className={styles["status-row"]}>
        <div className={styles["tracking-indicator"]}>
          {hasUpstream ? (
            <span className={styles["upstream-badge"]} title={`Tracking ${tracking?.upstream}`}>
              <span className={styles["branch-label"]}>{tracking?.upstream}</span>
              {(ahead > 0 || behind > 0) && (
                <span className={styles["counts"]}>
                  {behind > 0 && (
                    <span className={styles["count-behind"]} title={`${behind} commits to pull`}>
                      <ArrowDown size={12} weight="bold" />
                      {behind}
                    </span>
                  )}
                  {ahead > 0 && (
                    <span className={styles["count-ahead"]} title={`${ahead} commits to push`}>
                      <ArrowUp size={12} weight="bold" />
                      {ahead}
                    </span>
                  )}
                </span>
              )}
            </span>
          ) : (
            <span className={styles["no-upstream"]}>No remote tracking</span>
          )}
        </div>

        <div className={styles["action-buttons"]}>
          <button
            type="button"
            className={styles["action-btn"]}
            onClick={() => void handleFetch()}
            disabled={isSyncing}
            title="Fetch remote changes"
            aria-label="Fetch remote changes"
          >
            <ArrowsClockwise
              size={14}
              className={isSyncing ? styles["spin"] : undefined}
            />
          </button>

          {hasUpstream && behind > 0 && (
            <button
              type="button"
              className={styles["pull-btn"]}
              onClick={() => void handlePull()}
              disabled={isSyncing}
              title={`Pull ${behind} commit${behind > 1 ? "s" : ""}`}
            >
              <ArrowDown size={14} />
              <span>Pull</span>
            </button>
          )}

          {hasUpstream && ahead > 0 && (
            <button
              type="button"
              className={styles["push-btn"]}
              onClick={() => void handlePush()}
              disabled={isSyncing}
              title={`Push ${ahead} commit${ahead > 1 ? "s" : ""}`}
            >
              <ArrowUp size={14} />
              <span>Push</span>
            </button>
          )}

          {hasUpstream && ahead === 0 && behind === 0 && (
            <button
              type="button"
              className={styles["action-btn"]}
              onClick={() => void handlePush()}
              disabled={isSyncing}
              title="Push commits to remote"
              aria-label="Push commits"
            >
              <ArrowUp size={14} />
            </button>
          )}
        </div>
      </div>

      {syncError && (
        <div className={styles["sync-error"]}>
          <WarningCircle size={14} weight="fill" />
          <span className={styles["error-text"]}>{syncError}</span>
          <button
            type="button"
            className={styles["dismiss-btn"]}
            onClick={clearSyncMessage}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {syncMessage && !syncError && (
        <div className={styles["sync-success"]}>
          <CloudCheck size={14} weight="fill" />
          <span className={styles["success-text"]}>{syncMessage}</span>
          <button
            type="button"
            className={styles["dismiss-btn"]}
            onClick={clearSyncMessage}
            aria-label="Dismiss message"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
};
