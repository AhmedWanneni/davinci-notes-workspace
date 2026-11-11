import React from "react";
import { Check, X } from "@phosphor-icons/react";
import { WindowDialog } from "../WindowDialog";
import styles from "./ListeningView.module.scss";

export interface AIListeningPrivacyModalProps {
  isOpen: boolean;
  provider: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AIListeningPrivacyModal({
  isOpen,
  provider,
  onConfirm,
  onCancel,
}: AIListeningPrivacyModalProps) {
  if (!isOpen) return null;

  const isGemini = provider.toLowerCase().includes("gemini");
  const isLocal = provider.toLowerCase().includes("ollama");

  return (
    <WindowDialog
      isOpen={isOpen}
      onClose={onCancel}
      title="AI Listening Privacy Notice"
      subtitle={<span>Active Provider: <strong>{provider}</strong></span>}
      size="md"
      footer={
        <div className={styles["privacy-modal-actions"]} style={{ width: "100%", margin: 0, padding: 0 }}>
          <button
            type="button"
            className={`${styles["btn"]} ${styles["btn--secondary"]}`}
            onClick={onCancel}
            data-testid="privacy-cancel-btn"
          >
            <X size={14} />
            <span>Cancel</span>
          </button>
          <button
            type="button"
            className={`${styles["btn"]} ${styles["btn--primary"]}`}
            onClick={onConfirm}
            data-testid="privacy-confirm-btn"
          >
            <Check size={14} weight="bold" />
            <span>Enable AI Listening</span>
          </button>
        </div>
      }
    >
      <div className={styles["privacy-modal-body"]} style={{ padding: "16px 20px" }}>
        {isGemini ? (
          <div className={styles["privacy-warning-box"]}>
            <p className={styles["privacy-strong-text"]}>
              <strong>Attention:</strong> Google Gemini free tier may process meeting transcripts
              and allow human review to train and improve Google products.
            </p>
            <p className={styles["privacy-detail-text"]}>
              Do not stream sensitive, proprietary, or personal data. You can switch to Ollama for
              100% offline local AI or configure a private BYOK key in Record Settings.
            </p>
          </div>
        ) : isLocal ? (
          <p className={styles["privacy-detail-text"]}>
            Ollama runs locally on your machine. No meeting data leaves your device.
          </p>
        ) : (
          <p className={styles["privacy-detail-text"]}>
            Live transcript segments and questions will be securely sent to {provider} to generate
            summaries. Review your provider&apos;s data retention policy.
          </p>
        )}
      </div>
    </WindowDialog>
  );
}
export default AIListeningPrivacyModal;
