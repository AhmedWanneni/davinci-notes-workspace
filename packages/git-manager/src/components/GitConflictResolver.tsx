import React, { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowsMerge,
  Check,
  X,
  Warning,
} from "@phosphor-icons/react";
import { Button } from "@app/design-system";
import { useGitConflictStore } from "../store/useGitConflictStore";
import { useGitManagerStore } from "../store/useGitManagerStore";
import styles from "./GitConflictResolver.module.scss";

export const GitConflictResolver: React.FC = () => {
  const {
    activeConflict,
    activeResult,
    isResolving,
    conflictError,
    setResult,
    acceptOurs,
    acceptTheirs,
    acceptBoth,
    resolveConflict,
    abortCurrentMerge,
    closeConflict,
  } = useGitConflictStore();

  const refreshStatus = useGitManagerStore((s) => s.refreshStatus);
  const [showAbortConfirm, setShowAbortConfirm] = useState(false);

  if (!activeConflict) return null;

  const handleResolve = async () => {
    await resolveConflict();
    await refreshStatus();
  };

  const handleAbort = async () => {
    await abortCurrentMerge();
    setShowAbortConfirm(false);
    await refreshStatus();
  };

  return (
    <div className={styles["conflict-resolver"]} data-testid="git-conflict-resolver">
      <header className={styles["resolver-header"]}>
        <div className={styles["file-info"]}>
          <Warning size={16} className={styles["warning-icon"]} />
          <span className={styles["file-path"]}>{activeConflict.path}</span>
          {activeConflict.isBinary && (
            <span className={styles["binary-badge"]}>Binary</span>
          )}
        </div>

        <div className={styles["action-group"]}>
          <Button
            variant="ghost"
            size="sm"
            onClick={acceptOurs}
            disabled={isResolving || !activeConflict.oursExists}
            title="Accept Ours"
          >
            <ArrowLeft size={14} />
            <span>Ours</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={acceptBoth}
            disabled={isResolving || activeConflict.isBinary}
            title="Accept Both (Combination)"
          >
            <ArrowsMerge size={14} />
            <span>Both</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={acceptTheirs}
            disabled={isResolving || !activeConflict.theirsExists}
            title="Accept Theirs"
          >
            <span>Theirs</span>
            <ArrowRight size={14} />
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => void handleResolve()}
            disabled={isResolving}
          >
            <Check size={14} />
            <span>Mark Resolved</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={closeConflict}
            aria-label="Close resolver"
          >
            <X size={14} />
          </Button>
        </div>
      </header>

      {conflictError && (
        <div className={styles["error-banner"]}>
          <span>{conflictError}</span>
        </div>
      )}

      <div className={styles["three-pane-container"]}>
        {/* Left: Ours */}
        <div className={styles["pane"]}>
          <div className={styles["pane-header"]}>Ours (Current Branch)</div>
          <div className={styles["pane-content"]}>
            {activeConflict.oursExists ? (
              <pre className={styles["code-preview"]}>{activeConflict.ours}</pre>
            ) : (
              <div className={styles["deleted-notice"]}>File deleted in current branch</div>
            )}
          </div>
        </div>

        {/* Center: Result */}
        <div className={`${styles["pane"]} ${styles["pane-result"]}`}>
          <div className={styles["pane-header"]}>Result (Resolved Output)</div>
          <div className={styles["pane-content"]}>
            {activeConflict.isBinary ? (
              <div className={styles["binary-notice"]}>
                Binary file conflict. Use "Ours" or "Theirs" to choose the desired version.
              </div>
            ) : (
              <textarea
                className={styles["result-editor"]}
                value={activeResult}
                onChange={(e) => setResult(e.target.value)}
                placeholder="Edit final resolved content here..."
                aria-label="Resolved file content"
              />
            )}
          </div>
        </div>

        {/* Right: Theirs */}
        <div className={styles["pane"]}>
          <div className={styles["pane-header"]}>Theirs (Incoming Changes)</div>
          <div className={styles["pane-content"]}>
            {activeConflict.theirsExists ? (
              <pre className={styles["code-preview"]}>{activeConflict.theirs}</pre>
            ) : (
              <div className={styles["deleted-notice"]}>File deleted in incoming branch</div>
            )}
          </div>
        </div>
      </div>

      <footer className={styles["resolver-footer"]}>
        <div className={styles["footer-left"]}>
          {showAbortConfirm ? (
            <div className={styles["abort-confirm"]}>
              <span>Abort merge and revert all unresolved changes?</span>
              <Button
                variant="danger"
                size="sm"
                onClick={() => void handleAbort()}
                disabled={isResolving}
              >
                Confirm Abort
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAbortConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAbortConfirm(true)}
              disabled={isResolving}
            >
              Abort Merge
            </Button>
          )}
        </div>
      </footer>
    </div>
  );
};
