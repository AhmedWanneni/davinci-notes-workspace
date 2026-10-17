import { Button, Typography } from "@app/design-system";
import type { TemplateLibraryController } from "../../templates/useTemplateLibrary";
import { TemplateEditor } from "../TemplateEditor";
import { TemplateTransferControls } from "../TemplateTransferControls";
import styles from "./TemplatesPanel.module.scss";

export interface TemplatesPanelProps {
  controller: TemplateLibraryController;
}

/**
 * Template management on the extension's options page (plan §4).
 *
 * The list is what is stored, in the order it is stored, because that order is
 * what decides which template applies to a page. Editing happens in a draft, so
 * a half-typed template is never used for a clip.
 */
export function TemplatesPanel({ controller }: TemplatesPanelProps) {
  const { loading, templates, selectedId, draft, saving } = controller;

  return (
    <section className={styles["templates-panel"]}>
      <header className={styles["templates-panel__header"]}>
        <Typography variant="h2" size="lg">
          Templates
        </Typography>
        <Typography variant="text" size="sm" color="muted">
          A template decides where a clip goes and what the note looks like.
          When more than one applies automatically, the first one in this list
          wins.
        </Typography>
      </header>

      {loading ? (
        <Typography variant="text" size="sm" color="muted" role="status">
          Reading the saved templates…
        </Typography>
      ) : (
        <div className={styles["templates-panel__body"]}>
          <nav
            className={styles["templates-panel__list"]}
            aria-label="Templates"
          >
            {templates.map((template) => (
              <button
                key={template.id}
                type="button"
                aria-current={template.id === selectedId}
                className={
                  template.id === selectedId
                    ? `${styles["templates-panel__item"]} ${styles["templates-panel__item--current"]}`
                    : styles["templates-panel__item"]
                }
                onClick={() => controller.select(template.id)}
              >
                <Typography variant="text" size="sm">
                  {template.name}
                </Typography>
              </button>
            ))}
          </nav>

          <div className={styles["templates-panel__editor"]}>
            <div className={styles["templates-panel__toolbar"]}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={saving}
                onClick={controller.create}
              >
                New template
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={draft === undefined || saving}
                onClick={controller.duplicate}
              >
                Duplicate
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={selectedId === undefined || saving}
                onClick={controller.remove}
              >
                Delete
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={saving}
                onClick={controller.restoreStarters}
              >
                Restore starter templates
              </Button>
              <TemplateTransferControls
                templates={templates}
                disabled={saving}
                onImport={controller.importTemplates}
              />
            </div>

            {draft === undefined ? (
              <Typography variant="text" size="sm" color="muted">
                Select a template to edit it.
              </Typography>
            ) : (
              <TemplateEditor
                draft={draft}
                errors={controller.errors}
                dirty={controller.dirty}
                saving={saving}
                onChange={controller.patch}
                onPropertyChange={controller.setProperty}
                onAddProperty={controller.addProperty}
                onRemoveProperty={controller.removeProperty}
                onSave={controller.save}
                onDiscard={controller.discard}
              />
            )}
          </div>
        </div>
      )}

      {controller.failure === undefined ? null : (
        <Typography variant="text" size="sm" color="error" role="alert">
          {controller.failure}
        </Typography>
      )}

      {controller.notice === undefined ? null : (
        <Typography
          variant="text"
          size="xs"
          color="muted"
          role="status"
          className={styles["templates-panel__notice"]}
        >
          {controller.notice}
        </Typography>
      )}
    </section>
  );
}
