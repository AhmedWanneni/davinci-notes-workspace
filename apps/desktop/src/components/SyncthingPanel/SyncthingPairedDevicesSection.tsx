import React, { useState } from "react";
import { Badge, Button, Typography } from "@app/design-system";
import { Check, Copy, Devices, Trash } from "@phosphor-icons/react";
import type { SyncthingConfiguredDevice } from "./syncthingCommands";
import {
  syncthingRemoveDevice,
  syncthingShareVaultFolder,
} from "./syncthingCommands";
import styles from "./SyncthingPairedDevicesSection.module.scss";

export interface SyncthingPairedDevicesSectionProps {
  devices: SyncthingConfiguredDevice[];
  onUpdated: () => Promise<void>;
}

export function SyncthingPairedDevicesSection({
  devices,
  onUpdated,
}: SyncthingPairedDevicesSectionProps): React.JSX.Element {
  const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleShareVault = async (deviceId: string) => {
    setBusyDeviceId(deviceId);
    try {
      await syncthingShareVaultFolder(deviceId);
      await onUpdated();
    } finally {
      setBusyDeviceId(null);
    }
  };

  const handleRemove = async (deviceId: string) => {
    setBusyDeviceId(deviceId);
    try {
      await syncthingRemoveDevice(deviceId);
      await onUpdated();
    } finally {
      setBusyDeviceId(null);
    }
  };

  return (
    <div
      className={styles["paired-devices-card"]}
      data-testid="syncthing-paired-devices"
    >
      <div className={styles["paired-devices-card__header"]}>
        <div className={styles["paired-devices-card__title"]}>
          <Devices size={16} />
          <Typography variant="h4" size="sm">
            Paired Devices
          </Typography>
        </div>
        <Badge variant={devices.length > 0 ? "accent" : "neutral"}>
          {devices.length} {devices.length === 1 ? "device" : "devices"}
        </Badge>
      </div>

      {devices.length === 0 ? (
        <p className={styles["paired-devices-card__empty-state"]}>
          No remote devices paired yet. Scan the QR code with your phone or add
          another computer below.
        </p>
      ) : (
        <ul className={styles["paired-devices-card__list"]}>
          {devices.map((device) => {
            const isBusy = busyDeviceId === device.deviceId;
            return (
              <li
                key={device.deviceId}
                className={styles["paired-devices-card__item"]}
              >
                <div className={styles["paired-devices-card__item-header"]}>
                  <div
                    className={styles["paired-devices-card__item-name-group"]}
                  >
                    <span className={styles["paired-devices-card__item-name"]}>
                      {device.name || "Remote Device"}
                    </span>
                    {device.connected ? (
                      <Badge variant="success">Connected</Badge>
                    ) : (
                      <Badge variant="warning">Disconnected</Badge>
                    )}
                    {device.isVaultShared && (
                      <Badge variant="neutral">Vault Shared</Badge>
                    )}
                  </div>

                  <div className={styles["paired-devices-card__item-meta"]}>
                    <button
                      type="button"
                      className={styles["paired-devices-card__copy-id-btn"]}
                      onClick={() => void handleCopyId(device.deviceId)}
                      title="Click to copy full device ID"
                    >
                      <span className={styles["paired-devices-card__item-id"]}>
                        {device.deviceId.slice(0, 7)}...
                        {device.deviceId.slice(-7)}
                      </span>
                      {copiedId === device.deviceId ? (
                        <Check size={12} />
                      ) : (
                        <Copy size={12} />
                      )}
                    </button>
                  </div>
                </div>

                <p className={styles["paired-devices-card__item-hint"]}>
                  {device.connected
                    ? `Connected via ${device.address || "network"}`
                    : "Waiting for mutual authorization or discovery. Ensure this Mac's ID is accepted on that device."}
                </p>

                <div className={styles["paired-devices-card__item-actions"]}>
                  {!device.isVaultShared && (
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void handleShareVault(device.deviceId)}
                    >
                      Share Vault
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => void handleRemove(device.deviceId)}
                    aria-label={`Unpair ${device.name || device.deviceId}`}
                  >
                    <Trash size={14} />
                    Unpair
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default SyncthingPairedDevicesSection;
