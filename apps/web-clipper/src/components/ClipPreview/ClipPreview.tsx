import { Typography } from "@app/design-system";
import styles from "./ClipPreview.module.scss";

/**
 * How much of the body is rendered.
 *
 * A clip can be megabytes (measured: a 1.5 MB page produces a 1.46 MB body), and
 * putting that in the DOM would stall the popup for no reader benefit. The file
 * that gets saved is never truncated — only this preview is.
 */
export const DEFAULT_PREVIEW_LENGTH = 4000;

export interface ClipPreviewProps {
  tags: readonly string[];
  body: string;
  visibleBodyLength?: number;
}

/**
 * The note body as Markdown text.
 *
 * Deliberately not rendered as formatted Markdown: page markup reaches the popup
 * as untrusted text (plan §Phase 2, adversarial check 1), and there is nothing
 * here that can turn it into DOM.
 */
export function ClipPreview({
  tags,
  body,
  visibleBodyLength = DEFAULT_PREVIEW_LENGTH,
}: ClipPreviewProps) {
  const visible = body.slice(0, visibleBodyLength);
  const hidden = body.length - visible.length;

  return (
    <div className={styles["clip-preview"]}>
      {tags.length > 0 ? (
        <Typography variant="text" size="xs" color="muted">
          Tags: {tags.join(", ")}
        </Typography>
      ) : null}

      {body.length > 0 ? (
        <pre className={styles["clip-preview__body"]}>{visible}</pre>
      ) : (
        <Typography variant="text" size="sm" color="muted">
          Nothing to clip here.
        </Typography>
      )}

      {hidden > 0 ? (
        <Typography variant="text" size="xs" color="muted">
          {hidden.toLocaleString()} more characters in the saved file.
        </Typography>
      ) : null}
    </div>
  );
}
