import React from "react";
import type { SyncthingState } from "@app/syncthing-api";
import { Sheet } from "../../components/primitives";
import { useScanToSync } from "./useScanToSync";
import { ScanToSyncScannerView } from "./ScanToSyncScannerView";
import { ScanToSyncConfirmSheet } from "./ScanToSyncConfirmSheet";
import { ScanToSyncProgressView } from "./ScanToSyncProgressView";

export interface ScanToSyncModalProps {
  visible: boolean;
  status: SyncthingState | "loading" | "checking";
  hasSavedKey: boolean;
  defaultVaultPath: string;
  onSaveKey?: (key: string) => Promise<void>;
  onRefresh: () => Promise<void>;
  onClose: () => void;
}

export const ScanToSyncModal: React.FC<ScanToSyncModalProps> = ({
  visible,
  status,
  hasSavedKey,
  defaultVaultPath,
  onRefresh,
  onClose,
}) => {
  const {
    step,
    stage,
    payload,
    progressPercent,
    errorMessage,
    isBusy,
    setStep,
    handleScanSuccess,
    handleConfirm,
    resetFlow,
  } = useScanToSync(visible, status, hasSavedKey, defaultVaultPath);

  const handleClose = () => {
    resetFlow();
    onClose();
  };

  const handleDone = async () => {
    await onRefresh();
    handleClose();
  };

  const modalTitle =
    step === "scanner"
      ? "Scan to Sync"
      : step === "confirm"
        ? "Confirm Pairing"
        : stage === "completed"
          ? "Sync Complete"
          : "Syncing Notes";

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title={modalTitle}
      className="p-0"
    >
      {step === "scanner" ? (
        <ScanToSyncScannerView
          onSuccess={handleScanSuccess}
          onCancel={handleClose}
        />
      ) : step === "confirm" && payload ? (
        <ScanToSyncConfirmSheet
          payload={payload}
          defaultTargetPath={defaultVaultPath}
          isBusy={isBusy}
          onConfirm={handleConfirm}
          onBack={() => setStep("scanner")}
          onCancel={handleClose}
        />
      ) : step === "progress" ? (
        <ScanToSyncProgressView
          stage={stage}
          progressPercent={progressPercent}
          pairingCode={payload?.code || ""}
          desktopName={payload?.name || "Desktop"}
          errorMessage={errorMessage}
          onRetry={() => handleConfirm(defaultVaultPath)}
          onDone={handleDone}
          onCancel={handleClose}
        />
      ) : null}
    </Sheet>
  );
};

ScanToSyncModal.displayName = "ScanToSyncModal";
export default ScanToSyncModal;
