import { useRef } from "react";
import { Button } from "@app/design-system";
import type { ClipTemplate } from "@app/clipper-core";
import { serializeTemplateExport } from "../../templates/templateTransfer";
import styles from "./TemplateTransferControls.module.scss";

export interface TemplateTransferControlsProps {
  templates: readonly ClipTemplate[];
  disabled: boolean;
  onImport(text: string): void;
}

function downloadTemplates(templates: readonly ClipTemplate[]) {
  const url = URL.createObjectURL(
    new Blob([serializeTemplateExport(templates)], {
      type: "application/json",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "davinci-notes-clipper-templates.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/** Bounded JSON transfer, kept separate from the editor's storage state. */
export function TemplateTransferControls({
  templates,
  disabled,
  onImport,
}: TemplateTransferControlsProps) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div className={styles["template-transfer"]}>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => downloadTemplates(templates)}
      >
        Export templates
      </Button>
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={disabled}
        onClick={() => input.current?.click()}
      >
        Import templates
      </Button>
      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file !== undefined) void file.text().then(onImport);
        }}
      />
    </div>
  );
}
