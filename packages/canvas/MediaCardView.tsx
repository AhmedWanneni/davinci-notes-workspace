import { memo, useState, useCallback, type JSX } from "react";
import { WarningCircle } from "@phosphor-icons/react";
import { useCanvasEditor } from "./CanvasEditorContext";
import { useMediaUrl } from "./useMediaUrl";
import styles from "./FileCardNode.module.scss";

export interface MediaCardViewProps {
  filePath: string;
  mediaType: "image" | "video";
  alt?: string;
}

function MediaCardViewComponent({
  filePath,
  mediaType,
  alt,
}: MediaCardViewProps): JSX.Element {
  const { resolveMediaUrl } = useCanvasEditor();
  const { src, isLoading } = useMediaUrl(filePath, resolveMediaUrl);
  const [hasError, setHasError] = useState(false);

  const handleError = useCallback(() => {
    setHasError(true);
  }, []);

  if (!filePath) {
    return (
      <div className={styles["file-card__empty-state"]}>
        <span>No media file selected</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className={styles["media-error-state"]} data-testid="media-error">
        <WarningCircle size={24} className={styles["media-error-icon"]} />
        <span className={styles["media-error-title"]}>Failed to load media</span>
        <span className={styles["media-error-path"]} title={filePath}>
          {filePath}
        </span>
      </div>
    );
  }

  if (isLoading || !src) {
    return (
      <div className={styles["media-loading-state"]}>
        <span className={styles["media-loading-text"]}>Loading media...</span>
      </div>
    );
  }

  if (mediaType === "video") {
    return (
      <div className={styles["media-container"]}>
        <video
          src={src}
          controls
          preload="metadata"
          className={styles["media-video"]}
          onError={handleError}
          data-testid="media-video"
        >
          <track kind="captions" />
          Your browser does not support video playback.
        </video>
      </div>
    );
  }

  return (
    <div className={styles["media-container"]}>
      <img
        src={src}
        alt={alt || filePath}
        loading="lazy"
        decoding="async"
        className={styles["media-image"]}
        onError={handleError}
        data-testid="media-image"
      />
    </div>
  );
}

export const MediaCardView = memo(MediaCardViewComponent);
