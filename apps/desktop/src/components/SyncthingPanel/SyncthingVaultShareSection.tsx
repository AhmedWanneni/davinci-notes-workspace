import React, { useState } from "react";
import { Button, Input, Typography } from "@app/design-system";
import {
  Check,
  ShareNetwork,
  ShieldCheck,
  WarningCircle,
} from "@phosphor-icons/react";
import { syncthingShareVaultFolder } from "./syncthingCommands";
import styles from "./SyncthingVaultShareSection.module.scss";

interface Props {
  onShared: () => Promise<void>;
}

export function SyncthingVaultShareSection({ onShared }: Props) {
  const [targetDeviceId, setTargetDeviceId] = useState("");
  const [sharing, setSharing] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cleanId = targetDeviceId.trim().toUpperCase().replace(/[\s-]/g, "");

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cleanId) return;

    setError(null);
    setShareSuccess(null);
    setSharing(true);

    try {
      const folderId = await syncthingShareVaultFolder(cleanId);
      setShareSuccess(`Vault successfully shared (Folder ID: ${folderId}).`);
      setTargetDeviceId("");
      await onShared();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className={styles["vault-share-card"]}>
      <div className={styles["vault-share-card__header"]}>
        <div className={styles["vault-share-card__title"]}>
          <ShareNetwork size={16} />
          <Typography variant="h4" size="sm">
            Share Active Vault
          </Typography>
        </div>
      </div>

      <div className={styles["vault-share-card__safety-note"]}>
        <ShieldCheck size={16} />
        <div>
          <strong>Automatic Per-Device Exclusion</strong>
          <p>
            Per-device state (<code>vault-index.db*</code>, workspace cache, and{" "}
            <code>.trash</code>) is safely excluded via <code>.stignore</code>.
            Existing user rules are preserved.
          </p>
        </div>
      </div>

      <form
        onSubmit={(e) => void handleShare(e)}
        className={styles["vault-share-card__form"]}
      >
        <div className={styles["vault-share-card__field"]}>
          <label
            className={styles["vault-share-card__label"]}
            htmlFor="share-target-device"
          >
            Remote Device ID to share with:
          </label>
          <Input
            id="share-target-device"
            value={targetDeviceId}
            onChange={(e) => {
              setTargetDeviceId(e.target.value);
              setError(null);
            }}
            placeholder="XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX"
            className={styles["vault-share-card__input-mono"]}
          />
        </div>

        {error && (
          <div className={styles["vault-share-card__error-alert"]} role="alert">
            <WarningCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        {shareSuccess && (
          <div
            className={styles["vault-share-card__success-alert"]}
            role="status"
          >
            <Check size={14} />
            <span>{shareSuccess}</span>
          </div>
        )}

        <div className={styles["vault-share-card__actions"]}>
          <Button
            variant="secondary"
            size="sm"
            type="submit"
            disabled={sharing || cleanId.length === 0}
            aria-label="Share vault with device"
          >
            {sharing ? "Sharing Vault..." : "Share this vault"}
          </Button>
        </div>
      </form>
    </div>
  );
}
