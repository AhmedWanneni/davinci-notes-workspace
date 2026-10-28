import React from "react";
import { CloudArrowDown, FolderOpen, PlusCircle, WarningCircle } from "@phosphor-icons/react";
import { Button, Typography } from "@app/design-system";
import { EmptyState } from "../EmptyState";
import { RecentVaultsCard } from "./RecentVaultsCard";
import type { RecentVaultEntry } from "../../vault/recentVaultsRegistry";

export interface VaultWelcomeViewProps {
  isLoadingVault: boolean;
  vaultError: string | null;
  log?: string[];
  recentVaults?: RecentVaultEntry[];
  onClearError: () => void;
  onOpenPicker: () => void;
  onCreateNewVault?: () => void;
  onOpenVaultFromDrive?: () => void;
  onOpenFixture: () => void;
  onOpenLargeFixture?: () => void;
  onSelectRecentVault?: (path: string) => void;
  onRemoveRecentVault?: (path: string) => void;
}

export function VaultWelcomeView({
  isLoadingVault,
  vaultError,
  recentVaults = [],
  onClearError,
  onOpenPicker,
  onCreateNewVault = onOpenPicker,
  onOpenVaultFromDrive,
  onOpenFixture,
  onSelectRecentVault = onOpenPicker,
  onRemoveRecentVault = () => {},
}: VaultWelcomeViewProps) {
  if (isLoadingVault) {
    return (
      <main className="vault-welcome">
        <section className="vault-welcome__content">
          <EmptyState
            size="lg"
            icon={<FolderOpen weight="regular" />}
            title="Opening Vault..."
            description="Reading markdown notes and indexing connections..."
          />
        </section>
      </main>
    );
  }

  return (
    <main className="vault-welcome">
      <section className="vault-welcome__content">
        <div className="vault-welcome__header">
          <Typography variant="h1" size="2xl">
            DaVinci Notes
          </Typography>
          <Typography variant="text" size="sm" color="muted">
            Local-first, fast, connected knowledge base.
          </Typography>
        </div>

        {vaultError && (
          <div className="vault-welcome__error" role="alert">
            <Typography variant="h3" size="sm" color="error">
              <WarningCircle weight="bold" /> Failed to open vault
            </Typography>
            <Typography variant="text" size="xs" color="muted">
              {vaultError}
            </Typography>
            <div className="vault-welcome__error-actions">
              <Button variant="primary" size="sm" onClick={onClearError}>
                Try Again
              </Button>
              <Button variant="secondary" size="sm" onClick={onOpenPicker}>
                Choose Another Folder
              </Button>
            </div>
          </div>
        )}

        <div className="vault-welcome__cards">
          <div className="vault-welcome__card" data-testid="card-open-existing">
            <div className="vault-welcome__card-icon">
              <FolderOpen size={22} weight="duotone" />
            </div>
            <div className="vault-welcome__card-body">
              <Typography variant="h3" size="sm">
                Open Existing Vault
              </Typography>
              <span className="vault-welcome__card-desc">
                Open an existing folder of markdown notes on your computer.
              </span>
            </div>
            <div className="vault-welcome__card-action">
              <Button variant="primary" onClick={onOpenPicker}>
                Open Folder
              </Button>
            </div>
          </div>

          <div className="vault-welcome__card" data-testid="card-create-vault">
            <div className="vault-welcome__card-icon">
              <PlusCircle size={22} weight="duotone" />
            </div>
            <div className="vault-welcome__card-body">
              <Typography variant="h3" size="sm">
                Create New Vault
              </Typography>
              <span className="vault-welcome__card-desc">
                Start fresh with an empty folder and a welcome starter note.
              </span>
            </div>
            <div className="vault-welcome__card-action">
              <Button variant="secondary" onClick={onCreateNewVault}>
                Create Vault
              </Button>
            </div>
          </div>

          {onOpenVaultFromDrive && (
            <div className="vault-welcome__card" data-testid="card-open-drive">
              <div className="vault-welcome__card-icon">
                <CloudArrowDown size={22} weight="duotone" />
              </div>
              <div className="vault-welcome__card-body">
                <Typography variant="h3" size="sm">
                  Open from Google Drive
                </Typography>
                <span className="vault-welcome__card-desc">
                  Connect to Google Drive and sync an existing cloud vault.
                </span>
              </div>
              <div className="vault-welcome__card-action">
                <Button variant="secondary" onClick={onOpenVaultFromDrive}>
                  Open from Drive
                </Button>
              </div>
            </div>
          )}
        </div>

        {recentVaults.length > 0 && (
          <RecentVaultsCard
            entries={recentVaults}
            onSelectVault={onSelectRecentVault}
            onRemoveVault={onRemoveRecentVault}
          />
        )}

        <div className="vault-welcome__footer">
          <button
            type="button"
            className="vault-welcome__demo-btn"
            onClick={onOpenFixture}
            data-testid="btn-open-demo"
          >
            Explore Sample Vault
          </button>
        </div>
      </section>
    </main>
  );
}
