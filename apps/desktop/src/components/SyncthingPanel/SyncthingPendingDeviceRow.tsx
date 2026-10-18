import React, { useState } from "react";
import { Badge, Button } from "@app/design-system";
import { Check, ShieldCheck, WarningCircle, X } from "@phosphor-icons/react";
import type { SyncthingPendingDevice } from "./syncthingCommands";
import styles from "./SyncthingPendingSection.module.scss";

export interface SyncthingPendingDeviceRowProps {
  device: SyncthingPendingDevice;
  activePairingCode?: string | null;
  isPairingExpired?: boolean;
  disabled: boolean;
  onAccept: (deviceId: string) => Promise<void>;
  onDismiss: (deviceId: string) => Promise<void>;
}

export function SyncthingPendingDeviceRow({
  device,
  activePairingCode,
  isPairingExpired,
  disabled,
  onAccept,
  onDismiss,
}: SyncthingPendingDeviceRowProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const hasCode = Boolean(
    activePairingCode &&
      !isPairingExpired &&
      device.name &&
      device.name.includes(activePairingCode),
  );

  const handleAcceptClick = () => {
    if (hasCode) {
      // Verified code: highlighted one-tap Accept
      void onAccept(device.deviceId);
    } else {
      // Unverified or expired: require explicit confirm
      setShowConfirm(true);
    }
  };

  const handleExplicitConfirm = () => {
    setShowConfirm(false);
    void onAccept(device.deviceId);
  };

  return (
    <div
      className={`${styles["pending-card__item"]} ${hasCode ? styles["is-verified"] : ""}`}
      data-testid={`pending-device-${device.deviceId}`}
    >
      <div className={styles["pending-card__item-info"]}>
        <div className={styles["pending-card__item-title-row"]}>
          <span className={styles["pending-card__item-title"]}>
            {device.name || "Remote Device"}
          </span>
          {hasCode ? (
            <Badge variant="success" className={styles["is-verified-badge"]}>
              <ShieldCheck size={12} /> Code verified ({activePairingCode})
            </Badge>
          ) : isPairingExpired ? (
            <Badge variant="warning">Pairing window expired</Badge>
          ) : (
            <Badge variant="warning">Unverified code</Badge>
          )}
        </div>

        <code className={styles["pending-card__item-id"]}>
          {device.deviceId}
        </code>

        {!hasCode && (
          <div className={styles["pending-card__item-warning"]}>
            <WarningCircle size={14} />
            <span>
              {isPairingExpired
                ? "Pairing window expired. Verify device ID before accepting."
                : "Device name does not contain the active pairing code."}
            </span>
          </div>
        )}
      </div>

      <div className={styles["pending-card__actions"]}>
        {showConfirm ? (
          <div className={styles["pending-card__confirm-group"]}>
            <span className={styles["pending-card__confirm-prompt"]}>
              Accept unverified device?
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={handleExplicitConfirm}
              disabled={disabled}
              aria-label={`Confirm accept ${device.name || device.deviceId}`}
            >
              <Check size={14} /> Confirm
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowConfirm(false)}
              disabled={disabled}
            >
              Cancel
            </Button>
          </div>
        ) : (
          <>
            <Button
              variant="primary"
              size="sm"
              onClick={handleAcceptClick}
              disabled={disabled}
              className={hasCode ? styles["is-highlighted-btn"] : ""}
              aria-label={`Accept device ${device.name || device.deviceId}`}
            >
              <Check size={14} />
              {hasCode ? "Accept & Share" : "Accept"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void onDismiss(device.deviceId)}
              disabled={disabled}
              aria-label={`Ignore device ${device.name || device.deviceId}`}
            >
              <X size={14} />
              Ignore
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
