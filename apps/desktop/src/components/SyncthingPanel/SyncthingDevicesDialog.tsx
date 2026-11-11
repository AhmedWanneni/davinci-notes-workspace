import { useMemo, useState } from "react";
import { Badge, Button } from "@app/design-system";
import { CaretRight, Check, Copy, FolderSimple, MagnifyingGlass, Trash } from "@phosphor-icons/react";
import { WindowDialog } from "../WindowDialog";
import type {
  SyncthingConfiguredDevice,
  SyncthingPendingDevice,
  SyncthingPendingFolder,
  SyncthingSharedVault,
} from "./syncthingCommands";
import { syncthingRemoveDevice, syncthingShareVaultFolder } from "./syncthingCommands";
import { SyncthingPendingSection } from "./SyncthingPendingSection";
import styles from "./SyncthingDevicesDialog.module.scss";
import listStyles from "./SyncthingPairedDevicesSection.module.scss";

interface SyncthingDevicesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  devices: SyncthingConfiguredDevice[];
  pendingDevices: SyncthingPendingDevice[];
  pendingFolders: SyncthingPendingFolder[];
  sharedVaults: SyncthingSharedVault[];
  activePairingCode?: string | null;
  isPairingExpired?: boolean;
  onUpdated: () => Promise<void>;
}

export function SyncthingDevicesDialog({
  open,
  onOpenChange,
  devices,
  pendingDevices,
  pendingFolders,
  sharedVaults,
  activePairingCode,
  isPairingExpired,
  onUpdated,
}: SyncthingDevicesDialogProps) {
  const [search, setSearch] = useState("");
  const [busyDeviceId, setBusyDeviceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedVaults, setExpandedVaults] = useState<Set<string>>(() => new Set());
  const filteredDevices = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return devices;
    return devices.filter((device) =>
      [device.name, device.deviceId, device.address,
        ...sharedVaults
          .filter((vault) => vault.sharedWithDeviceIds.some((id) => id.toUpperCase() === device.deviceId.toUpperCase()))
          .map((vault) => vault.label || vault.folderId)]
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [devices, search, sharedVaults]);

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

  const handleDeviceAction = async (deviceId: string, action: "share" | "remove") => {
    setBusyDeviceId(deviceId);
    try {
      if (action === "share") await syncthingShareVaultFolder(deviceId);
      else await syncthingRemoveDevice(deviceId);
      await onUpdated();
    } finally {
      setBusyDeviceId(null);
    }
  };

  return (
    <WindowDialog
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Devices"
      size="lg"
      ariaLabel="Devices"
    >
      <div className={styles["devices-dialog__body"]}>
            <label className={styles["devices-dialog__search"]}>
              <MagnifyingGlass size={16} aria-hidden="true" />
              <input
                type="search"
                aria-label="Search devices"
                placeholder="Search devices"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            {(pendingDevices.length > 0 || pendingFolders.length > 0) && (
              <SyncthingPendingSection
                pendingDevices={pendingDevices}
                pendingFolders={pendingFolders}
                activePairingCode={activePairingCode}
                isPairingExpired={isPairingExpired}
                onUpdated={onUpdated}
              />
            )}
            {filteredDevices.length > 0 ? (
              <ul className={listStyles["paired-devices-card__list"]}>
                {filteredDevices.map((device) => {
                  const isBusy = busyDeviceId === device.deviceId;
                  const isVaultListOpen = expandedVaults.has(device.deviceId);
                  const deviceVaults = sharedVaults.filter((vault) =>
                    vault.sharedWithDeviceIds.some((id) => id.toUpperCase() === device.deviceId.toUpperCase()),
                  );
                  return (
                    <li key={device.deviceId} className={listStyles["paired-devices-card__item"]}>
                      <div className={listStyles["paired-devices-card__item-header"]}>
                        <div className={listStyles["paired-devices-card__item-name-group"]}>
                          <span className={listStyles["paired-devices-card__item-name"]}>{device.name || "Remote Device"}</span>
                          {device.connected ? <Badge variant="success">Connected</Badge> : device.lastSeen ? <Badge variant="warning">Disconnected</Badge> : <Badge variant="neutral">Waiting</Badge>}
                        </div>
                        <div className={listStyles["paired-devices-card__item-tools"]}>
                          <Button className={listStyles["paired-devices-card__remove"]} variant="ghost" size="sm" disabled={isBusy} onClick={() => void handleDeviceAction(device.deviceId, "remove")} aria-label={`Unpair ${device.name || device.deviceId}`}><Trash size={16} /></Button>
                          <button type="button" className={listStyles["paired-devices-card__copy-id-btn"]} onClick={() => void handleCopyId(device.deviceId)} title="Click to copy full device ID">
                            <span className={listStyles["paired-devices-card__item-id"]}>{device.deviceId.slice(0, 7)}...{device.deviceId.slice(-7)}</span>
                            {copiedId === device.deviceId ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                          {device.isVaultShared && (
                            <button
                              type="button"
                              className={listStyles["paired-devices-card__vault-toggle"]}
                              aria-label={`${isVaultListOpen ? "Hide" : "Show"} shared vaults for ${device.name || device.deviceId}`}
                              aria-expanded={isVaultListOpen}
                              onClick={() => setExpandedVaults((expanded) => {
                                const next = new Set(expanded);
                                if (next.has(device.deviceId)) next.delete(device.deviceId);
                                else next.add(device.deviceId);
                                return next;
                              })}
                            >
                              <CaretRight size={17} />
                            </button>
                          )}
                        </div>
                      </div>
                      {device.isVaultShared && isVaultListOpen && (
                        <ul className={listStyles["paired-devices-card__shared-vault-list"]}>
                            {deviceVaults.length > 0
                              ? deviceVaults.map((vault) => <li key={vault.folderId}><FolderSimple size={16} />{vault.label || vault.folderId}</li>)
                              : <li><FolderSimple size={16} />Shared vault</li>}
                        </ul>
                      )}
                      {!device.isVaultShared && <div className={listStyles["paired-devices-card__item-actions"]}>
                        <Button variant="secondary" size="sm" disabled={isBusy} onClick={() => void handleDeviceAction(device.deviceId, "share")}>Share Vault</Button>
                      </div>}
                    </li>
                  );
                })}
              </ul>
            ) : devices.length > 0 ? (
              <p className={styles["devices-dialog__empty"]}>No devices match “{search}”.</p>
            ) : pendingDevices.length === 0 && pendingFolders.length === 0 ? (
              <p className={styles["devices-dialog__empty"]}>No devices paired yet.</p>
            ) : null}
          </div>
    </WindowDialog>
  );
}
