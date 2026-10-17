import { Button, Typography } from "@app/design-system";
import type { ClipMode, ClipPayload, ClipTemplate } from "@app/clipper-core";
import type { ClipDraft } from "../../clip/clipDraft";
import { ClipEditor } from "../ClipEditor";
import { ClipModeSelector } from "../ClipModeSelector";
import { ClipPreview } from "../ClipPreview";
import { TemplatePicker } from "../TemplatePicker";
import styles from "./ClipPopup.module.scss";

export type ClipStatus = "loading" | "ready" | "error";

/**
 * Everything the popup renders, in one object.
 *
 * The type lives here because this component owns the contract; the session hook
 * implements it. That keeps the popup presentational and testable from a literal.
 */
export interface ClipPopupController {
  status: ClipStatus;
  /** The page could not be read, or the note could not be saved. */
  error?: string;
  /** Non-fatal: the page was read but its article could not be extracted. */
  warning?: string;
  mode: ClipMode;
  templates: readonly ClipTemplate[];
  templateId: string;
  matchedTemplateId?: string;
  disabledModes: readonly ClipMode[];
  /** The sanitised clip, exactly as it will be written to the file. */
  payload?: ClipPayload;
  draft: ClipDraft;
  /** The extension holds a pairing for the app, so `send` can do anything. */
  paired: boolean;
  /** A clip is being sent to the app. */
  sending: boolean;
  /** The note is being written to a downloaded file. */
  downloading: boolean;
  /** The app reported the last clip written. */
  sent: boolean;
  /** Vault-relative path of the last clip the app wrote, when it reported one. */
  sentPath?: string;
  queuedCount?: number;
  syncingQueue?: boolean;
  syncQueue?(): void;
  canHighlightSelection?: boolean;
  highlightsCount?: number;
  highlightSelection?(): void;
  setMode(mode: ClipMode): void;
  setTemplateId(id: string): void;
  setNoteName(noteName: string): void;
  setFolder(folder: string): void;
  setProperty(name: string, value: string): void;
  send(): void;
  download(): void;
  openOptions(): void;
}

export interface ClipPopupProps {
  controller: ClipPopupController;
}

function describeSource(payload: ClipPayload): string {
  const { site, domain, author, wordCount } = payload.source;
  return [
    site || domain,
    author,
    wordCount === undefined ? undefined : `${wordCount.toLocaleString()} words`,
  ]
    .filter((part): part is string => Boolean(part))
    .join(" · ");
}

export function ClipPopup({ controller }: ClipPopupProps) {
  const { status, error, warning, payload, draft } = controller;

  return (
    <main className={styles["clip-popup"]}>
      <header className={styles["clip-popup__header"]}>
        <Typography variant="h1" size="base">
          Save to DaVinci Notes
        </Typography>
        {payload ? (
          <Typography variant="text" size="xs" color="muted">
            {describeSource(payload)}
          </Typography>
        ) : null}
      </header>

      {status === "loading" && error === undefined ? (
        <Typography variant="text" size="sm" color="muted" role="status">
          Reading the page…
        </Typography>
      ) : null}

      {/* An error is not always fatal: a failed save keeps the form below so the
          clip can be tried again. Only a page that could not be read is terminal. */}
      {error !== undefined || status === "error" ? (
        <div className={styles["clip-popup__message"]} role="alert">
          <Typography variant="text" size="sm" color="error">
            {error ?? "This page could not be read."}
          </Typography>
          {status === "error" ? (
            <Typography variant="text" size="xs" color="muted">
              Browser settings pages, the Web Store and some local files cannot
              be clipped. Open a normal web page and try again.
            </Typography>
          ) : null}
        </div>
      ) : null}

      {status === "ready" && payload ? (
        <>
          <div className={styles["clip-popup__mode-row"]}>
            <ClipModeSelector
              mode={controller.mode}
              onChange={controller.setMode}
              disabledModes={controller.disabledModes}
            />
            {controller.canHighlightSelection &&
            controller.highlightSelection ? (
              <div className={styles["clip-popup__highlight-action"]}>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={controller.highlightSelection}
                >
                  Highlight selection
                </Button>
              </div>
            ) : null}
          </div>
          <TemplatePicker
            templates={controller.templates}
            selectedId={controller.templateId}
            onSelect={controller.setTemplateId}
            matchedId={controller.matchedTemplateId}
          />

          {warning ? (
            <Typography
              variant="text"
              size="xs"
              role="status"
              className={styles["clip-popup__warning"]}
            >
              {warning}
            </Typography>
          ) : null}

          <ClipEditor
            noteName={draft.noteName}
            folder={draft.folder}
            properties={draft.properties}
            onNoteNameChange={controller.setNoteName}
            onFolderChange={controller.setFolder}
            onPropertyChange={controller.setProperty}
          />

          <ClipPreview tags={payload.tags} body={payload.body} />

          {controller.queuedCount && controller.queuedCount > 0 ? (
            <div className={styles["clip-popup__queue-notice"]}>
              <Typography variant="text" size="xs" color="muted">
                {controller.queuedCount}{" "}
                {controller.queuedCount === 1 ? "clip" : "clips"} queued
                offline.
              </Typography>
              {controller.syncQueue ? (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={controller.syncQueue}
                  disabled={controller.syncingQueue || !controller.paired}
                >
                  {controller.syncingQueue ? "Syncing…" : "Sync now"}
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className={styles["clip-popup__actions"]}>
            <Button
              variant="primary"
              size="sm"
              onClick={controller.send}
              disabled={!controller.paired || controller.sending}
            >
              {controller.sending ? "Sending…" : "Add to DaVinci Notes"}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={controller.download}
              disabled={controller.downloading}
            >
              {controller.downloading ? "Saving…" : "Download .md"}
            </Button>
          </div>

          {controller.sent ? (
            <Typography variant="text" size="xs" color="muted" role="status">
              {controller.sentPath === undefined
                ? "Saved to your vault."
                : `Saved to ${controller.sentPath}.`}
            </Typography>
          ) : controller.paired ? (
            <Typography variant="text" size="xs" color="muted">
              The clip is written by DaVinci Notes on this computer. Nothing is
              sent anywhere else.
            </Typography>
          ) : (
            <div className={styles["clip-popup__pairing"]}>
              <Typography variant="text" size="xs" color="muted">
                This extension is not paired with DaVinci Notes. Pair it to save
                straight to your vault, or download the note as a file.
              </Typography>
              <Button
                variant="secondary"
                size="sm"
                onClick={controller.openOptions}
              >
                Pairing options
              </Button>
            </div>
          )}
        </>
      ) : null}
    </main>
  );
}
