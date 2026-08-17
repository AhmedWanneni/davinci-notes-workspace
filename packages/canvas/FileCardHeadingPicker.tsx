import type { JSX } from "react";
import { TextH } from "@phosphor-icons/react";
import type { MarkdownHeading } from "./subpathUtils";
import styles from "./FileCardNode.module.scss";

export interface FileCardHeadingPickerProps {
  headings: readonly MarkdownHeading[];
  onSelect: (headingText?: string) => void;
}

export function FileCardHeadingPicker({
  headings,
  onSelect,
}: FileCardHeadingPickerProps): JSX.Element {
  return (
    <div className={`${styles["file-card__picker-popover"]} nodrag nopan`}>
      <div className={styles["file-card__picker-list"]}>
        <button
          type="button"
          className={styles["file-card__picker-item"]}
          onClick={() => onSelect(undefined)}
        >
          <span>Entire note</span>
        </button>
        {headings.map((h) => (
          <button
            key={`${h.lineIndex}-${h.text}`}
            type="button"
            className={styles["file-card__picker-item"]}
            onClick={() => onSelect(h.text)}
          >
            <TextH size={12} />
            <span>{h.text}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
