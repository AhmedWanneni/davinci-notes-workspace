import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { AttachmentLocationSettings } from "../AttachmentLocationSettings";
import { SettingsCard } from "./SettingsCard";
import styles from "./SettingsDialog.module.scss";

export function FilesLinksSettingsTab() {
  const attachmentSettings = useWorkspaceStore(
    (state) => state.attachmentSettings,
  );
  const setAttachmentSettings = useWorkspaceStore(
    (state) => state.setAttachmentSettings,
  );

  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard title="Attachments">
        <AttachmentLocationSettings
          settings={attachmentSettings}
          onChange={setAttachmentSettings}
        />
      </SettingsCard>
    </div>
  );
}
