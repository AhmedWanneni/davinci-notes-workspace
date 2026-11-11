import { useEffect, useState } from "react";
import { Button, Typography } from "@app/design-system";
import { ArrowRight, Devices } from "@phosphor-icons/react";
import type {
  SyncthingConfiguredDevice,
  SyncthingPendingDevice,
  SyncthingPendingFolder,
  SyncthingSharedVault,
} from "./syncthingCommands";
import { SyncthingDevicesDialog } from "./SyncthingDevicesDialog";
import styles from "./SyncthingPairedDevicesSection.module.scss";

export interface SyncthingPairedDevicesSectionProps {
  devices: SyncthingConfiguredDevice[];
  pendingDevices?: SyncthingPendingDevice[];
  pendingFolders?: SyncthingPendingFolder[];
  sharedVaults?: SyncthingSharedVault[];
  activePairingCode?: string | null;
  isPairingExpired?: boolean;
  onUpdated: () => Promise<void>;
}

export function SyncthingPairedDevicesSection({
  devices,
  pendingDevices = [],
  pendingFolders = [],
  sharedVaults = [],
  activePairingCode,
  isPairingExpired,
  onUpdated,
}: SyncthingPairedDevicesSectionProps): React.JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const approvalCount = pendingDevices.length + pendingFolders.length;

  useEffect(() => {
    if (approvalCount > 0) setIsOpen(true);
  }, [approvalCount]);

  return (
    <section className={styles["paired-devices-card"]} data-testid="syncthing-paired-devices">
      <div className={styles["paired-devices-card__header"]}>
        <div className={styles["paired-devices-card__title"]}>
          <Devices size={18} />
          <Typography variant="text" size="sm">Devices</Typography>
          {approvalCount > 0 && (
            <span className={styles["paired-devices-card__approval-count"]} aria-label={`${approvalCount} approvals needed`}>
              {approvalCount}
            </span>
          )}
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsOpen(true)}>
          Show <ArrowRight size={15} />
        </Button>
      </div>
      <SyncthingDevicesDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        devices={devices}
        pendingDevices={pendingDevices}
        pendingFolders={pendingFolders}
        sharedVaults={sharedVaults}
        activePairingCode={activePairingCode}
        isPairingExpired={isPairingExpired}
        onUpdated={onUpdated}
      />
    </section>
  );
}

export default SyncthingPairedDevicesSection;
