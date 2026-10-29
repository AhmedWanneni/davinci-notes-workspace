import React from "react";
import { Badge, Button, Typography } from "@app/design-system";
import { ArrowClockwise, QrCode } from "@phosphor-icons/react";
import styles from "./SyncthingQrPairingSection.module.scss";

export interface SyncthingQrPairingSectionProps {
  qrDataUrl: string | null;
  pairingCode: string;
  secondsLeft: number;
  isExpired: boolean;
  isGenerating: boolean;
  onRotateCode: () => void;
}

function formatCountdown(totalSeconds: number): string {
  const clamped = Math.max(0, totalSeconds);
  const minutes = Math.floor(clamped / 60);
  const seconds = clamped % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

export function SyncthingQrPairingSection({
  qrDataUrl,
  pairingCode,
  secondsLeft,
  isExpired,
  isGenerating,
  onRotateCode,
}: SyncthingQrPairingSectionProps) {
  if (!qrDataUrl) {
    return null;
  }

  const formattedCode = pairingCode
    ? `${pairingCode.slice(0, 3)} ${pairingCode.slice(3)}`
    : "------";

  return (
    <div className={styles["qr-section"]} data-testid="syncthing-qr-section">
      <div className={styles["qr-header"]}>
        <div className={styles["qr-title"]}>
          <QrCode size={16} />
          <Typography variant="h4" size="sm">
            Scan to Connect Phone
          </Typography>
        </div>
        <Badge variant={isExpired ? "warning" : "neutral"}>
          {isExpired ? "Code Expired" : `Window: ${formatCountdown(secondsLeft)}`}
        </Badge>
      </div>

      <div className={styles["qr-waiting-bar"]}>
        <div className={styles["qr-status-text"]}>
          <span className={styles["qr-pulse-dot"]} />
          <span>Waiting for phone...</span>
        </div>

        <div className={styles["qr-code-pill"]} data-testid="pairing-code">
          Code: {formattedCode}
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onRotateCode}
          disabled={isGenerating}
          aria-label="Rotate pairing code"
        >
          <ArrowClockwise
            size={14}
            className={isGenerating ? styles["is-spinning"] : ""}
          />
          Rotate
        </Button>
      </div>

      <div className={styles["qr-quiet-zone"]}>
        <img
          src={qrDataUrl}
          alt={`Syncthing QR pairing code for ${pairingCode}`}
          className={styles["qr-image"]}
          data-testid="syncthing-qr-image"
        />
      </div>

      <p className={styles["qr-caption"]}>
        Scan with Sophia on your phone to automatically pair and synchronize your vault.
      </p>
    </div>
  );
}

export default SyncthingQrPairingSection;
