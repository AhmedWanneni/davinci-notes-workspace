import React, { useState } from "react";
import { Button, Input, Typography } from "@app/design-system";
import { Check, Info, PlusCircle, WarningCircle } from "@phosphor-icons/react";
import {
  syncthingAddDevice,
  syncthingShareVaultFolder,
} from "./syncthingCommands";
import styles from "./SyncthingAddDeviceSection.module.scss";

interface Props {
  onAdded: () => Promise<void>;
  localDeviceId?: string;
}

export function isValidDeviceIdFormat(id: string): boolean {
  const clean = id.trim().toUpperCase().replace(/[\s-]/g, "");
  return clean.length === 56 && /^[A-Z0-9]{56}$/.test(clean);
}

export function formatDeviceIdGroups(raw: string): string {
  const clean = raw.trim().toUpperCase().replace(/[\s-]/g, "");
  if (clean.length === 0) return raw;
  const groups: string[] = [];
  for (let i = 0; i < clean.length && i < 56; i += 7) {
    groups.push(clean.slice(i, i + 7));
  }
  return groups.join("-");
}

export function SyncthingAddDeviceSection({ onAdded, localDeviceId }: Props) {
  const [deviceIdInput, setDeviceIdInput] = useState("");
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [autoShareVault, setAutoShareVault] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cleanId = deviceIdInput.trim().toUpperCase().replace(/[\s-]/g, "");
  const formatValid = cleanId.length === 0 || isValidDeviceIdFormat(cleanId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const formatted = formatDeviceIdGroups(deviceIdInput);
    if (!isValidDeviceIdFormat(formatted)) {
      setError(
        "Device ID must contain 8 groups of 7 characters (56 alphanumeric chars).",
      );
      return;
    }

    setSubmitting(true);
    try {
      await syncthingAddDevice(formatted, deviceNameInput);
      if (autoShareVault) {
        await syncthingShareVaultFolder(formatted).catch(() => {});
      }
      setDeviceIdInput("");
      setDeviceNameInput("");
      setSuccess(
        "Device added! Remember to also add or accept this Mac's ID on that device.",
      );
      await onAdded();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className={styles["add-device-card"]}
      data-testid="syncthing-add-device"
    >
      <div className={styles["add-device-card__header"]}>
        <div className={styles["add-device-card__title"]}>
          <PlusCircle size={16} />
          <Typography variant="h4" size="sm">
            Add Another Computer / Device
          </Typography>
        </div>
      </div>

      <div className={styles["add-device-card__notice"]}>
        <Info size={16} />
        <div>
          <strong>Syncthing requires two-way authorization.</strong>
          <p>
            After adding this device, you must also paste or accept this Mac's
            Device ID on that device to connect.
          </p>
          {Boolean(localDeviceId) && (
            <code>
              {localDeviceId?.slice(0, 7)}...{localDeviceId?.slice(-7)}
            </code>
          )}
        </div>
      </div>

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className={styles["add-device-card__form"]}
      >
        <div className={styles["add-device-card__field"]}>
          <label
            className={styles["add-device-card__label"]}
            htmlFor="syncthing-device-id"
          >
            Remote Device ID
          </label>
          <Input
            id="syncthing-device-id"
            value={deviceIdInput}
            onChange={(e) => {
              setDeviceIdInput(e.target.value);
              setError(null);
              setSuccess(null);
            }}
            placeholder="XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX"
            className={styles["add-device-card__input-mono"]}
            autoComplete="off"
            spellCheck={false}
          />
          {!formatValid && (
            <p className={styles["add-device-card__field-error"]}>
              Must be 8 groups of 7 characters (56 characters total).
            </p>
          )}
        </div>

        <div className={styles["add-device-card__field"]}>
          <label
            className={styles["add-device-card__label"]}
            htmlFor="syncthing-device-name"
          >
            Device Name (optional)
          </label>
          <Input
            id="syncthing-device-name"
            value={deviceNameInput}
            onChange={(e) => setDeviceNameInput(e.target.value)}
            placeholder="e.g. Work Laptop, Linux Server"
            autoComplete="off"
          />
        </div>

        <div className={styles["add-device-card__checkbox-row"]}>
          <input
            type="checkbox"
            id="auto-share-vault"
            checked={autoShareVault}
            onChange={(e) => setAutoShareVault(e.target.checked)}
          />
          <label
            htmlFor="auto-share-vault"
            className={styles["add-device-card__checkbox-label"]}
          >
            Automatically share active vault with this device
          </label>
        </div>

        {error && (
          <div className={styles["add-device-card__error-alert"]} role="alert">
            <WarningCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div
            className={styles["add-device-card__success-alert"]}
            role="status"
          >
            <Check size={14} />
            <span>{success}</span>
          </div>
        )}

        <div className={styles["add-device-card__actions"]}>
          <Button
            variant="secondary"
            size="sm"
            type="submit"
            disabled={submitting || cleanId.length === 0}
            aria-label="Add Device"
          >
            {submitting ? "Adding..." : "Add Device"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default SyncthingAddDeviceSection;
