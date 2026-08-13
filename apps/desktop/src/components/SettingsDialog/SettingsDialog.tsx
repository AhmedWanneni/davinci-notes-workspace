import {
  Dialog,
  DialogContent,
  Typography,
  Button,
  Divider,
} from "@app/design-system";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { openVaultFromPicker } from "../../vault";
import styles from "./SettingsDialog.module.scss";

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
  const { editorFont, setEditorFont } = useWorkspaceStore();

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
      <DialogContent className="dialog-content" title="Settings">
        <div className={styles.container}>
          <section className={styles.section}>
            <div className="setting-row">
              <div className={"setting-info"}>
                <Typography variant="h3" size="sm">
                  Editor Font
                </Typography>
                <Typography variant="text" size="xs" color="muted">
                  Choose the font used for the markdown editor.
                </Typography>
              </div>
              <div className={"setting-control"}>
                <select
                  value={editorFont}
                  onChange={(e) => setEditorFont(e.target.value)}
                  className={styles.select}
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

          <section className={styles.section}>
            <div className="setting-row">
              <div className={"setting-info"}>
                <Typography variant="h3" size="sm">
                  Vault Location
                </Typography>
                <Typography variant="text" size="xs" color="muted">
                  Current vault path: {vaultPath || "None"}
                </Typography>
              </div>
              <div className={"setting-control"}>
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
