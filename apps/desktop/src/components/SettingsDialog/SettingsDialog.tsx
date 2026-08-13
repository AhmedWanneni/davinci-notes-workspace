import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Divider,
} from "@app/design-system";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { openVaultFromPicker } from "../../vault";

interface SettingsDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  vaultPath: string | null;
  onVaultSwitched: (newPath: string) => void;
}

export function SettingsDialog({
  isOpen,
  onOpenChange,
  vaultPath,
  onVaultSwitched,
}: SettingsDialogProps) {
  const editorFont = useWorkspaceStore((state) => state.editorFont);
  const setEditorFont = useWorkspaceStore((state) => state.setEditorFont);

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
                  onChange={(e) => setEditorFont(e.target.value)}
                  className="settings-dialog__select"
                >
                  <option value="system">System UI</option>
                  <option value="monospace">Monospace</option>
                  <option value="inter">Inter</option>
                  <option value="roboto">Roboto</option>
                </select>
              </div>
            </div>
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
