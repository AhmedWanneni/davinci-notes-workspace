import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@app/design-system";
import { Check, Copy, FloppyDisk, Gear } from "@phosphor-icons/react";
import { syncthingSetLocalDeviceName } from "./syncthingCommands";
import styles from "./SyncthingLocalDeviceCard.module.scss";

interface SyncthingLocalDeviceCardProps {
  deviceId: string;
  deviceName: string;
  autoStart: boolean;
  setAutoStart: (enabled: boolean) => void;
  onUpdated: () => Promise<void>;
}

export function SyncthingLocalDeviceCard({
  deviceId,
  deviceName,
  autoStart,
  setAutoStart,
  onUpdated,
}: SyncthingLocalDeviceCardProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nameDraft, setNameDraft] = useState(deviceName);
  const [savingName, setSavingName] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const saveName = async () => {
    const name = nameDraft.trim();
    if (!name) return;
    setSavingName(true);
    setNameError(null);
    try {
      await syncthingSetLocalDeviceName(name);
      await onUpdated();
    } catch (error) {
      setNameError(error instanceof Error ? error.message : String(error));
    } finally {
      setSavingName(false);
    }
  };

  const copyDeviceId = async () => {
    await navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={styles["local-device"]} aria-label="This computer">
      <div className={styles["local-device__id-row"]}>
        <code>{deviceId}</code>
        <div className={styles["local-device__actions"]}>
          <Button variant="secondary" size="sm" onClick={() => void copyDeviceId()} aria-label="Copy Device ID">
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy ID"}
          </Button>
          <Dialog.Root open={settingsOpen} onOpenChange={setSettingsOpen}>
            <Button variant="ghost" size="sm" onClick={() => { setNameDraft(deviceName); setSettingsOpen(true); }} aria-label="Computer settings">
              <Gear size={16} />
            </Button>
            <Dialog.Portal>
              <Dialog.Overlay className={styles["local-device__dialog-overlay"]} />
              <Dialog.Content className={styles["local-device__dialog"]} aria-describedby={undefined}>
                <header className={styles["local-device__dialog-header"]}>
                  <div className={styles["local-device__traffic-lights"]}>
                    <button type="button" className={styles["local-device__traffic-close"]} aria-label="Close computer settings" onClick={() => setSettingsOpen(false)} />
                    <span className={styles["local-device__traffic-minimize"]} />
                    <span className={styles["local-device__traffic-maximize"]} />
                  </div>
                  <Dialog.Title className={styles["local-device__dialog-title"]}>Computer Settings</Dialog.Title>
                  <div className={styles["local-device__header-spacer"]} />
                </header>
                <div className={styles["local-device__dialog-body"]}>
                  <label className={styles["local-device__setting-label"]} htmlFor="syncthing-computer-name">Computer name</label>
                  <div className={styles["local-device__name-setting"]}>
                    <input id="syncthing-computer-name" aria-label="Computer name" value={nameDraft} onChange={(event) => setNameDraft(event.target.value)} disabled={savingName} />
                    <Button className={styles["local-device__save-button"]} variant="primary" size="sm" onClick={() => void saveName()} disabled={savingName || !nameDraft.trim()}>
                      <FloppyDisk size={15} />
                      Save
                    </Button>
                  </div>
                  {nameError && <span role="alert">{nameError}</span>}
                  <div className={styles["local-device__divider"]} />
                  <label className={styles["local-device__auto-start"]}>
                    <input type="checkbox" checked={autoStart} onChange={(event) => setAutoStart(event.target.checked)} />
                    <span>Start sync automatically</span>
                  </label>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </section>
  );
}
