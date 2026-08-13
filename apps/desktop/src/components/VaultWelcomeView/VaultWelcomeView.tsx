import React from "react";
import { FolderOpen, WarningCircle } from "@phosphor-icons/react";
import { Button, Typography } from "@app/design-system";
import { EmptyState } from "../EmptyState";
import styles from "../../App.module.scss";

export interface VaultWelcomeViewProps {
  isLoadingVault: boolean;
  vaultError: string | null;
  log: string[];
  onClearError: () => void;
  onOpenFixture: () => void;
  onOpenLargeFixture: () => void;
  onOpenPicker: () => void;
}

export function VaultWelcomeView({
  isLoadingVault,
  vaultError,
  log,
  onClearError,
  onOpenFixture,
  onOpenLargeFixture,
  onOpenPicker,
}: VaultWelcomeViewProps) {
  let emptyStateContent: React.ReactNode;

  if (isLoadingVault) {
    emptyStateContent = (
      <EmptyState
        size="lg"
        icon={<FolderOpen weight="regular" />}
        title="Indexing Vault..."
        description="Parsing markdown files and building the link graph. This may take a moment for large vaults."
      />
    );
  } else if (vaultError) {
    emptyStateContent = (
      <EmptyState
        size="lg"
        icon={<WarningCircle weight="regular" />}
        title="Failed to open vault"
        description={vaultError}
        action={
          <Button variant="primary" onClick={onClearError}>
            Try Again
          </Button>
        }
      />
    );
  } else {
    emptyStateContent = (
      <EmptyState
        size="lg"
        icon={<FolderOpen weight="regular" />}
        title="No Vault Open"
        description="Select a folder or a fixture vault to open the editor."
        action={
          <div className={styles.actions}>
            <Button variant="primary" onClick={onOpenFixture}>
              Open fixture
            </Button>
            <Button variant="secondary" onClick={onOpenLargeFixture}>
              Index large fixture (350 notes)
            </Button>
            <Button variant="secondary" onClick={onOpenPicker}>
              Pick folder &amp; index
            </Button>
          </div>
        }
      />
    );
  }

  return (
    <main className={styles.shell}>
      <section className={styles.content}>
        <Typography variant="h1" size="2xl">
          DaVinci Notes
        </Typography>
        {emptyStateContent}
        {log.length > 0 && (
          <pre className={styles["debug-log"]}>{log.join("\n")}</pre>
        )}
      </section>
    </main>
  );
}
