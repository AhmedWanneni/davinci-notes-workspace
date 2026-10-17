import React, { useState } from "react";
import { Button, Input, Typography } from "@app/design-system";
import { PlusCircle, WarningCircle } from "@phosphor-icons/react";
import { syncthingAddDevice } from "./syncthingCommands";
import styles from "./SyncthingAddDeviceSection.module.scss";

interface Props {
  onAdded: () => Promise<void>;
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

export function SyncthingAddDeviceSection({ onAdded }: Props) {
  const [deviceIdInput, setDeviceIdInput] = useState("");
  const [deviceNameInput, setDeviceNameInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const cleanId = deviceIdInput.trim().toUpperCase().replace(/[\s-]/g, "");
  const formatValid = cleanId.length === 0 || isValidDeviceIdFormat(cleanId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

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
      setDeviceIdInput("");
      setDeviceNameInput("");
      await onAdded();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles["add-device-card"]}>
      <div className={styles["add-device-card__header"]}>
        <div className={styles["add-device-card__title"]}>
          <PlusCircle size={16} />
          <Typography variant="h4" size="sm">
            Add Remote Device
          </Typography>
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
            Device ID
          </label>
          <Input
            id="syncthing-device-id"
            value={deviceIdInput}
            onChange={(e) => {
              setDeviceIdInput(e.target.value);
              setError(null);
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
            placeholder="e.g. Pixel 8, Work Laptop"
            autoComplete="off"
          />
        </div>

        {error && (
          <div className={styles["add-device-card__error-alert"]} role="alert">
            <WarningCircle size={14} />
            <span>{error}</span>
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
