import { useEffect, useState } from "react";
import { Input, RadioGroup, RadioGroupItem, Typography, Button } from "@app/design-system";
import type { AttachmentLocationMode, AttachmentSettings } from "@app/attachments";
import { pickVaultFolder } from "../../vault/pickVaultFolder";
import styles from "./AttachmentLocationSettings.module.scss";

interface AttachmentLocationSettingsProps {
  settings: AttachmentSettings;
  onChange: (settings: AttachmentSettings) => void | Promise<void>;
}

const modes: Array<[AttachmentLocationMode, string]> = [
  ["vault-root", "Vault folder"],
  ["specified-folder", "In the folder specified below"],
  ["note-folder", "Same folder as current file"],
  ["note-subfolder", "In subfolder under current folder"],
];

export function AttachmentLocationSettings({ settings, onChange }: AttachmentLocationSettingsProps) {
  const [subfolder, setSubfolder] = useState(settings.noteSubfolder);
  const [subfolderError, setSubfolderError] = useState(false);

  useEffect(() => setSubfolder(settings.noteSubfolder), [settings.noteSubfolder]);

  const updateMode = (locationMode: AttachmentLocationMode) =>
    void onChange({ ...settings, locationMode });

  const updateSubfolder = (value: string) => {
    setSubfolder(value);
    const valid = value.trim().length > 0 && !/[\\/]/u.test(value.trim());
    setSubfolderError(!valid);
    if (valid) void onChange({ ...settings, noteSubfolder: value.trim() });
  };

  const chooseFolder = async () => {
    const folder = await pickVaultFolder();
    if (folder) void onChange({ ...settings, specifiedFolder: folder });
  };

  return (
    <section className={styles.section} aria-labelledby="attachment-location-title">
      <div className={styles.header}>
        <Typography variant="h3" size="sm" id="attachment-location-title">
          Default location for new attachments
        </Typography>
        <Typography variant="text" size="xs" color="muted">
          Choose where pasted and dropped files are saved.
        </Typography>
      </div>
      <RadioGroup
        aria-label="Default attachment location"
        value={settings.locationMode}
        onValueChange={(value) => updateMode(value as AttachmentLocationMode)}
        className={styles.options}
      >
        {modes.map(([value, label]) => (
          <label className={styles.option} key={value}>
            <RadioGroupItem value={value} id={`attachment-${value}`} />
            <span>{label}</span>
          </label>
        ))}
      </RadioGroup>
      {settings.locationMode === "specified-folder" && (
        <div className={styles.conditional}>
          <Input value={settings.specifiedFolder} readOnly aria-label="Specified attachment folder" />
          <Button variant="secondary" onClick={() => void chooseFolder()}>Choose folder</Button>
          <Typography variant="text" size="xs" color="muted">
            The folder is created when the first attachment is saved.
          </Typography>
        </div>
      )}
      {settings.locationMode === "note-subfolder" && (
        <div className={styles.conditional}>
          <Input
            value={subfolder}
            onChange={(event) => updateSubfolder(event.target.value)}
            variant={subfolderError ? "error" : "default"}
            aria-label="Attachment subfolder"
          />
          {subfolderError && (
            <Typography variant="text" size="xs" color="muted">
              Enter one non-empty folder name without slashes.
            </Typography>
          )}
        </div>
      )}
    </section>
  );
}
