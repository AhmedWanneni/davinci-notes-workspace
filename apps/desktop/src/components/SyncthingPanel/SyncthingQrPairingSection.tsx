import React from "react";
import { Button } from "@app/design-system";
import { ArrowClockwise } from "@phosphor-icons/react";
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
      <div className={styles["qr-code-pill"]} data-testid="pairing-code">
        {formattedCode}
      </div>
      <div className={styles["qr-quiet-zone"]}>
        <img
          src={qrDataUrl}
          alt={`Syncthing QR pairing code for ${pairingCode}`}
          className={styles["qr-image"]}
          data-testid="syncthing-qr-image"
        />
      </div>
      <div className={styles["qr-footer"]} data-testid="qr-footer">
        <span className={isExpired ? styles["qr-expired"] : styles["qr-countdown"]}>
          {isExpired ? "Code Expired" : formatCountdown(secondsLeft)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRotateCode}
          disabled={isGenerating}
          aria-label="Rotate pairing code"
        >
          <ArrowClockwise
            size={16}
            className={isGenerating ? styles["is-spinning"] : ""}
          />
        </Button>
      </div>
    </div>
  );
}

export default SyncthingQrPairingSection;
