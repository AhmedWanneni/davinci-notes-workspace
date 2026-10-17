import React, { useState } from "react";
import { Badge, Button, Typography } from "@app/design-system";
import {
  ArrowClockwise,
  Check,
  Copy,
  Desktop,
  QrCode,
} from "@phosphor-icons/react";
import { useSyncthingStatus, type SyncthingState } from "./useSyncthingStatus";
import { SyncthingAddDeviceSection } from "./SyncthingAddDeviceSection";
import { SyncthingPendingSection } from "./SyncthingPendingSection";
import { SyncthingSyncCheckSection } from "./SyncthingSyncCheckSection";
import { SyncthingVaultShareSection } from "./SyncthingVaultShareSection";
import styles from "./SyncthingPanel.module.scss";

export interface SyncthingPanelProps {
  /** Optional custom status hook override for testing or storybook */
  customStatus?: ReturnType<typeof useSyncthingStatus>;
}

function getStatusBadge(status: SyncthingState) {
  switch (status) {
    case "running":
      return <Badge variant="success">Running</Badge>;
    case "not-running":
      return <Badge variant="warning">Not running</Badge>;
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
) {
  switch (status) {
    case "running":
      return `Syncthing is active on ${guiAddress || "127.0.0.1:8384"}${version ? ` (${version})` : ""}.`;
    case "not-running":
      return "Start Syncthing from your terminal or application launcher to enable sync.";
    case "not-installed":
      return "Install Syncthing from syncthing.net or via your package manager.";
    case "bad-key":
      return "Check your API key in Syncthing GUI (Settings → General → API Key).";
    case "loading":
    default:
      return "Querying local Syncthing daemon...";
  }
}

export function SyncthingPanel({ customStatus }: SyncthingPanelProps) {
  const hookStatus = useSyncthingStatus(!customStatus);
  const {
    status,
    version,
    guiAddress,
    deviceId,
    deviceName,
    qrDataUrl,
    pendingDevices,
    pendingFolders,
    isLoading,
    refresh,
  } = customStatus || hookStatus;

  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!deviceId) return;
    try {
      await navigator.clipboard.writeText(deviceId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={styles["syncthing-panel"]} data-testid="syncthing-panel">
      {/* 1. Status Banner */}
      <div className={styles["syncthing-panel__status-banner"]}>
        <div className={styles["syncthing-panel__status-info"]}>
          <div className={styles["syncthing-panel__badge-row"]}>
            <Typography variant="h3" size="sm">
              Syncthing Daemon
            </Typography>
            {getStatusBadge(status)}
          </div>
          <p className={styles["syncthing-panel__hint"]}>
            {getStatusHint(status, version, guiAddress)}
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => void refresh()}
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

      {/* 2. Device Information Card (Monospace Block + Copy) */}
      {Boolean(deviceId) && (
        <div className={styles["syncthing-panel__card"]}>
          <div className={styles["syncthing-panel__card-header"]}>
            <div className={styles["syncthing-panel__device-title"]}>
              <Desktop size={16} />
              <Typography variant="h4" size="sm">
                {deviceName || "Local Device"}
              </Typography>
            </div>

            <div className={styles["syncthing-panel__copy-wrap"]}>
              {copied && (
                <span
                  className={styles["syncthing-panel__toast"]}
                  role="status"
                >
                  <Check size={14} /> Copied!
                </span>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                aria-label="Copy Device ID"
              >
                <Copy size={14} />
                Copy ID
              </Button>
            </div>
          </div>

          <div className={styles["syncthing-panel__device-block"]}>
            <pre className={styles["syncthing-panel__device-id"]}>
              <code>{deviceId}</code>
            </pre>
          </div>
        </div>
      )}

      {/* 3. QR Code Section (Large QR + White Quiet Zone) */}
      {Boolean(qrDataUrl) && (
        <div className={styles["syncthing-panel__qr-section"]}>
          <div className={styles["syncthing-panel__card-header"]}>
            <div className={styles["syncthing-panel__device-title"]}>
              <QrCode size={16} />
              <Typography variant="h4" size="sm">
                Scan to Connect Device
              </Typography>
            </div>
          </div>

          <div className={styles["syncthing-panel__qr-quiet-zone"]}>
            <img
              src={qrDataUrl!}
              alt={`Syncthing QR code for ${deviceId}`}
              className={styles["syncthing-panel__qr-image"]}
              data-testid="syncthing-qr-image"
            />
          </div>

          <p className={styles["syncthing-panel__qr-caption"]}>
            Scan from your phone camera or the Syncthing mobile app to pair with
            this device.
          </p>
        </div>
      )}

      {/* 4. Incoming Pending Requests (Devices + Folders) */}
      {status === "running" && (
        <SyncthingPendingSection
          pendingDevices={pendingDevices}
          pendingFolders={pendingFolders}
          onUpdated={refresh}
        />
      )}

      {/* 5. Add Remote Device */}
      {status === "running" && <SyncthingAddDeviceSection onAdded={refresh} />}

      {/* 6. Share Current Vault with Remote Device */}
      {status === "running" && (
        <SyncthingVaultShareSection onShared={refresh} />
      )}

      {/* 7. Check Sync Health Verification */}
      {status === "running" && <SyncthingSyncCheckSection />}
    </div>
  );
}

export default SyncthingPanel;
