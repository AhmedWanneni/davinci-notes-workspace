export type WebVaultEngineMode = "fsa" | "opfs";

export interface VaultChooserModalProps {
  readonly supportsFileSystemAccess: boolean;
  readonly onSelectEngine: (mode: WebVaultEngineMode) => void;
}

export function VaultChooserModal({
  supportsFileSystemAccess,
  onSelectEngine,
}: VaultChooserModalProps) {
  return (
    <section
      className="web-vault-chooser-modal"
      aria-labelledby="web-vault-chooser-heading"
    >
      <header className="web-vault-chooser-header">
        <h2 id="web-vault-chooser-heading">Choose Vault Storage</h2>
        <p>
          Plain <code>.md</code> files remain the source of truth across both
          storage engines.
        </p>
      </header>

      <div className="web-vault-chooser-options">
        <article className="web-vault-chooser-card">
          <h3>Browser Vault (OPFS + Cloud Sync)</h3>
          <p>
            Works in Chrome, Edge, Firefox, and Safari. Stores plain{" "}
            <code>.md</code> files in Origin Private File System with Drive sync
            and archive export.
          </p>
          <button
            type="button"
            className="web-vault-chooser-button"
            onClick={() => onSelectEngine("opfs")}
          >
            Create or Open Browser Vault
          </button>
        </article>

        <article className="web-vault-chooser-card">
          <h3>Local Disk Folder (Chromium)</h3>
          <p>
            Reads and writes directly to a folder on your computer using the
            File System Access API.
          </p>
          <button
            type="button"
            className="web-vault-chooser-button"
            disabled={!supportsFileSystemAccess}
            onClick={() => onSelectEngine("fsa")}
          >
            {supportsFileSystemAccess
              ? "Open Local Disk Folder"
              : "Local Folder Unsupported in This Browser"}
          </button>
        </article>
      </div>
    </section>
  );
}
