import React from "react";
import { formatFileSize } from "./imagePreviewUtils";
import styles from "./ImagePreview.module.scss";

export interface ImagePreviewInfoBarProps {
  fileName: string;
  naturalWidth?: number;
  naturalHeight?: number;
  fileSizeBytes?: number;
}

export function ImagePreviewInfoBar({
  fileName,
  naturalWidth,
  naturalHeight,
  fileSizeBytes,
}: ImagePreviewInfoBarProps) {
  const hasDimensions =
    naturalWidth !== undefined && naturalHeight !== undefined;
  const formattedSize = formatFileSize(fileSizeBytes);

  return (
    <footer className={styles["info-bar"]}>
      <span title={fileName}>{fileName}</span>
      <div className={styles["info-meta"]}>
        {hasDimensions && (
          <span>
            {naturalWidth} × {naturalHeight} px
          </span>
        )}
        {formattedSize && <span>{formattedSize}</span>}
      </div>
    </footer>
  );
}
