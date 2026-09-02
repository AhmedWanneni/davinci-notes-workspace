import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Checkbox,
  Divider,
} from "@app/design-system";
import { editorFonts, isEditorFont } from "@app/editor";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { openVaultFromPicker } from "../../vault";
import { AttachmentLocationSettings } from "../AttachmentLocationSettings";

import { SyncSettingsPanel, type SyncMode } from "../SyncSettingsPanel";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  vaultPath: string | null;
  onVaultSwitched: (newPath: string) => void;
  syncMode?: SyncMode;
  onSelectSyncMode?: (mode: SyncMode) => void;
  driveAccountEmail?: string | null;
  isDriveSignedIn?: boolean;
  isDriveSyncing?: boolean;
  onDriveSignIn?: () => void;
  onDriveDisconnect?: () => void;
  onDriveRefresh?: () => void;
  onDriveSyncNow?: () => void;
  onOpenConflictsPanel?: () => void;
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  vaultPath,
  onVaultSwitched,
  syncMode = "off",
  onSelectSyncMode,
  driveAccountEmail,
  isDriveSignedIn = false,
  isDriveSyncing = false,
  onDriveSignIn,
  onDriveDisconnect,
  onDriveRefresh,
  onDriveSyncNow,
  onOpenConflictsPanel,
}: SettingsDialogProps) {
  const editorFont = useWorkspaceStore((state) => state.editorFont);
  const setEditorFont = useWorkspaceStore((state) => state.setEditorFont);
  const strictLineBreaks = useWorkspaceStore((state) => state.strictLineBreaks);
  const setStrictLineBreaks = useWorkspaceStore(
    (state) => state.setStrictLineBreaks,
  );
  const useVimMode = useWorkspaceStore((state) => state.useVimMode);
  const setUseVimMode = useWorkspaceStore((state) => state.setUseVimMode);
  const attachmentSettings = useWorkspaceStore(
    (state) => state.attachmentSettings,
  );
  const setAttachmentSettings = useWorkspaceStore(
    (state) => state.setAttachmentSettings,
  );

  const handleSwitchVault = async () => {
    try {
      const newPath = await openVaultFromPicker();
      if (newPath) {
        onVaultSwitched(newPath);
      }
    } catch (err) {
      console.error("Failed to switch vault:", err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="settings-dialog" title="Settings">
        <div className="settings-dialog__container">
          <section className="settings-dialog__section">
            <div className="settings-dialog__row">
              <div className="settings-dialog__info">
                <Typography variant="h3" size="sm">
                  Editor Font
                </Typography>
                <Typography variant="text" size="xs" color="muted">
                  Choose the font used for the markdown editor.
                </Typography>
              </div>
              <div className="settings-dialog__control">
                <select
                  value={editorFont}
                  onChange={(e) => {
                    if (isEditorFont(e.target.value)) {
                      void setEditorFont(e.target.value);
                    }
                  }}
                  className="settings-dialog__select"
                >
                  {editorFonts.map((font) => (
                    <option key={font} value={font}>
                      {font === "system"
                        ? "System UI"
                        : font[0].toUpperCase() + font.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="settings-dialog__section">
            <div className="settings-dialog__row">
              <div className="settings-dialog__info">
                <Typography variant="h3" size="sm">
                  Strict Line Breaks
                </Typography>
                <Typography variant="text" size="xs" color="muted">
                  Merge soft paragraph lines; use two trailing spaces or
                  Shift+Enter for a hard break.
                </Typography>
              </div>
              <div className="settings-dialog__control">
                <Checkbox
                  checked={strictLineBreaks}
                  onCheckedChange={(checked) =>
                    void setStrictLineBreaks(checked === true)
                  }
                  aria-label="Strict Line Breaks"
                />
              </div>
            </div>
          </section>

          <section className="settings-dialog__section">
            <div className="settings-dialog__row">
              <div className="settings-dialog__info">
                <Typography variant="h3" size="sm">
                  Vim Keybindings
                </Typography>
                <Typography variant="text" size="xs" color="muted">
                  Enable modal Vim keybindings for navigation and editing.
                </Typography>
              </div>
              <div className="settings-dialog__control">
                <Checkbox
                  checked={useVimMode}
                  onCheckedChange={(checked) =>
                    void setUseVimMode(checked === true)
                  }
                  aria-label="Vim Keybindings"
                />
              </div>
            </div>
          </section>

          <AttachmentLocationSettings
            settings={attachmentSettings}
            onChange={setAttachmentSettings}
          />

          <Divider />

          <section className="settings-dialog__section">
            <SyncSettingsPanel
              mode={syncMode}
              onSelectMode={(mode) => onSelectSyncMode?.(mode)}
              driveAccountEmail={driveAccountEmail}
              isDriveSignedIn={isDriveSignedIn}
              isDriveSyncing={isDriveSyncing}
              onDriveSignIn={onDriveSignIn}
              onDriveSignOut={onDriveDisconnect}
              onDriveRefresh={onDriveRefresh}
              onDriveSyncNow={onDriveSyncNow}
              vaultPath={vaultPath}
              onOpenConflictsPanel={onOpenConflictsPanel}
            />
          </section>

          <Divider />

          <section className="settings-dialog__section">
            <div className="settings-dialog__row">
              <div className="settings-dialog__info">
                <Typography variant="h3" size="sm">
                  Vault Location
                </Typography>
                <Typography variant="text" size="xs" color="muted">
                  Current vault path: {vaultPath || "None"}
                </Typography>
              </div>
              <div className="settings-dialog__control">
                <Button variant="secondary" onClick={handleSwitchVault}>
                  Switch Vault
                </Button>
              </div>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
