import { memo, useMemo, type JSX, type MouseEvent } from "react";
import {
  ArrowSquareOut,
  ArrowsLeftRight,
  FilePdf,
  FileText,
  Image,
  SquaresFour,
  TextH,
  Video,
} from "@phosphor-icons/react";
import type { FileCardType } from "./mediaCardUtils";
import styles from "./FileCardNode.module.scss";


export interface FileCardHeaderProps {
  file: string;
  subpath?: string;
  fileType: FileCardType;
  hasHeadings: boolean;
  onToggleHeadingPicker: () => void;
  onToggleSwapPicker: () => void;
  onOpenFile?: (path: string) => void;
}

function FileCardHeaderComponent({
  file,
  subpath,
  fileType,
  hasHeadings,
  onToggleHeadingPicker,
  onToggleSwapPicker,
  onOpenFile,
}: FileCardHeaderProps): JSX.Element {
  const displayTitle = useMemo(() => {
    if (!file) return "No file";
    return file.replace(/\.(md|canvas|pdf)$/i, "").split("/").pop() ?? file;
  }, [file]);

  const renderIcon = () => {
    switch (fileType) {
      case "image":
        return <Image size={14} data-testid="icon-image" />;
      case "video":
        return <Video size={14} data-testid="icon-video" />;
      case "pdf":
        return <FilePdf size={14} data-testid="icon-pdf" />;
      case "canvas":
        return <SquaresFour size={14} data-testid="icon-canvas" />;
      case "markdown":
      default:
        return <FileText size={14} data-testid="icon-file" />;
    }
  };


  const handleOpenClick = (e: MouseEvent) => {
    e.stopPropagation();
    if (file && onOpenFile) onOpenFile(file);
  };

  return (
    <div className={styles["file-card__header"]}>
      <div className={styles["file-card__header-info"]}>
        <span className={styles["file-card__icon"]}>{renderIcon()}</span>
        <span className={styles["file-card__title"]} title={file}>
          {displayTitle}
        </span>
        {subpath && (
          <span className={styles["file-card__subpath-badge"]} title={subpath}>
            {subpath}
          </span>
        )}
      </div>
      <div className={styles["file-card__actions"]}>
        {fileType === "markdown" && hasHeadings && (
          <button
            type="button"
            className={styles["file-card__action-btn"]}
            title="Narrow to heading"
            aria-label="Narrow to heading"
            onClick={(e) => {
              e.stopPropagation();
              onToggleHeadingPicker();
            }}
          >
            <TextH size={12} weight="bold" />
          </button>
        )}
        <button
          type="button"
          className={styles["file-card__action-btn"]}
          title="Swap file"
          aria-label="Swap file"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSwapPicker();
          }}
        >
          <ArrowsLeftRight size={12} />
        </button>
        {onOpenFile && file && (
          <button
            type="button"
            className={styles["file-card__action-btn"]}
            title="Open file"
            aria-label="Open file"
            onClick={handleOpenClick}
          >
            <ArrowSquareOut size={12} />
          </button>
        )}
      </div>
    </div>
  );
}

export const FileCardHeader = memo(FileCardHeaderComponent);
