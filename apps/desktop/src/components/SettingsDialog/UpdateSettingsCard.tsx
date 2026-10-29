import { useState } from "react";
import {
  ArrowsClockwise,
  CheckCircle,
  DownloadSimple,
  WarningCircle,
} from "@phosphor-icons/react";
import { Button, Typography } from "@app/design-system";
import { SettingsCard } from "./SettingsCard";
import {
  checkAppUpdate,
  downloadAndInstall,
  restartApp,
  type UpdateInfo,
} from "../../services/updaterService";
import styles from "./UpdateSettingsCard.module.scss";

export function UpdateSettingsCard() {
  const [status, setStatus] = useState<
    "idle" | "checking" | "available" | "downloading" | "ready" | "up-to-date" | "error"
  >("idle");
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCheckUpdates = async () => {
    setStatus("checking");
    setErrorMessage(null);

    const result = await checkAppUpdate();
    if (result.status === "available") {
      setUpdateInfo(result.info);
      setStatus("available");
    } else if (result.status === "up-to-date") {
      setStatus("up-to-date");
    } else if (result.status === "unavailable") {
      setStatus("up-to-date");
    } else {
      setErrorMessage(result.message);
      setStatus("error");
    }
  };

  const handleDownload = async () => {
    setStatus("downloading");
    setDownloadProgress(0);

    const result = await downloadAndInstall((downloaded, total) => {
      if (total && total > 0) {
        setDownloadProgress(Math.min(100, Math.round((downloaded / total) * 100)));
      } else {
        setDownloadProgress(50);
      }
    });

    if (result.success) {
      setDownloadProgress(100);
      setStatus("ready");
    } else {
      setErrorMessage(result.error || "Failed to download update.");
      setStatus("error");
    }
  };

  const handleRestart = async () => {
    await restartApp();
  };

  return (
    <SettingsCard
      title="Application Updates"
      description="Check for new releases, review release notes, and install updates."
    >
      <div className={styles["update-card-content"]}>
        <div className={styles["version-row"]}>
          <div className={styles["version-info"]}>
            <Typography variant="body" weight="medium">
              Version 0.1.0
            </Typography>
            <span className={styles["status-badge"]}>
              {status === "checking" && "Checking for updates..."}
              {status === "up-to-date" && "You are running the latest version."}
              {status === "available" && `Version v${updateInfo?.version} is available!`}
              {status === "downloading" && `Downloading update (${downloadProgress}%)...`}
              {status === "ready" && "Update downloaded and verified."}
              {status === "idle" && "Click below to check GitHub Releases."}
            </span>
          </div>

          <div>
            {status === "ready" ? (
              <Button variant="primary" size="sm" onClick={handleRestart}>
                <ArrowsClockwise size={14} /> Restart to Apply
              </Button>
            ) : status === "available" ? (
              <Button variant="primary" size="sm" onClick={handleDownload}>
                <DownloadSimple size={14} /> Download & Install
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCheckUpdates}
                disabled={status === "checking" || status === "downloading"}
              >
                <ArrowsClockwise
                  size={14}
                  className={status === "checking" ? "is-spinning" : undefined}
                />
                Check for Updates
              </Button>
            )}
          </div>
        </div>

        {status === "downloading" && (
          <div className={styles["progress-container"]}>
            <div className={styles["progress-track"]}>
              <div
                className={styles["progress-bar"]}
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        )}

        {status === "available" && updateInfo?.body && (
          <div className={styles["release-notes-box"]}>
            <Typography variant="caption" weight="medium">
              Release Notes (v{updateInfo.version}):
            </Typography>
            <div>{updateInfo.body}</div>
          </div>
        )}

        {status === "error" && errorMessage && (
          <div className={styles["error-banner"]}>
            <WarningCircle size={16} />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>
    </SettingsCard>
  );
}
