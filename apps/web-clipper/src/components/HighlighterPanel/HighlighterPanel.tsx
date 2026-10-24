import { Toggle, Typography } from "@app/design-system";
import type { HighlightingSettingsController } from "../../highlighter/useHighlightingSettings";
import styles from "./HighlighterPanel.module.scss";

export interface HighlighterPanelProps {
  controller: HighlightingSettingsController;
}

export function HighlighterPanel({ controller }: HighlighterPanelProps) {
  return (
    <section className={styles["highlighter-panel"]}>
      <Typography variant="h2" size="lg">
        Highlights
      </Typography>
      <Typography variant="text" size="sm" color="muted">
        Enable page access to restore saved highlights when you revisit a page.
        Use the page selection menu to add one.
      </Typography>
      {controller.loading ? (
        <Typography variant="text" size="sm" role="status">
          Reading highlight access…
        </Typography>
      ) : (
        <Toggle
          checked={controller.enabled}
          disabled={controller.changing}
          onCheckedChange={controller.setEnabled}
          aria-label="Restore highlights on pages"
        />
      )}
      {controller.error === undefined ? null : (
        <Typography variant="text" size="sm" color="error" role="alert">
          {controller.error}
        </Typography>
      )}
    </section>
  );
}
