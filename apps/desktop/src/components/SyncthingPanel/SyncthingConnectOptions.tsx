import { useState, type ReactNode } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Button } from "@app/design-system";
import { ArrowRight, DeviceMobile, Desktop, X } from "@phosphor-icons/react";
import styles from "./SyncthingConnectOptions.module.scss";

type ConnectionType = "mobile" | "desktop";

interface SyncthingConnectOptionsProps {
  mobileContent: ReactNode;
  desktopContent: ReactNode;
}

export function SyncthingConnectOptions({
  mobileContent,
  desktopContent,
}: SyncthingConnectOptionsProps) {
  const [connectionType, setConnectionType] = useState<ConnectionType | null>(null);
  const content = connectionType === "mobile" ? mobileContent : desktopContent;
  const title = connectionType === "mobile" ? "Connect mobile" : "Connect desktop";

  return (
    <>
      <div className={styles["connect-options"]}>
        <div className={styles["connect-options__row"]}>
          <DeviceMobile size={20} aria-hidden="true" />
          <span>Connect mobile</span>
          <Button variant="primary" size="sm" onClick={() => setConnectionType("mobile")}>
            Connect <ArrowRight size={15} />
          </Button>
        </div>
        <div className={styles["connect-options__row"]}>
          <Desktop size={20} aria-hidden="true" />
          <span>Connect desktop</span>
          <Button variant="primary" size="sm" onClick={() => setConnectionType("desktop")}>
            Connect <ArrowRight size={15} />
          </Button>
        </div>
      </div>

      <Dialog.Root open={connectionType !== null} onOpenChange={(open) => !open && setConnectionType(null)}>
        <Dialog.Portal>
          <Dialog.Overlay className={styles["connect-dialog-overlay"]} />
          <Dialog.Content
            className={`${styles["connect-dialog"]} ${connectionType === "mobile" ? styles["connect-dialog--mobile"] : ""}`}
            aria-describedby={undefined}
          >
            <header className={styles["connect-dialog__header"]}>
              <Dialog.Title className={styles["connect-dialog__title"]}>{title}</Dialog.Title>
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" aria-label="Close connection dialog"><X size={16} /></Button>
              </Dialog.Close>
            </header>
            <div className={styles["connect-dialog__content"]}>{content}</div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
