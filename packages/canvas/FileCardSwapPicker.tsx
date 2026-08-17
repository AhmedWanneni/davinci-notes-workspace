import { useMemo, useState, type JSX } from "react";
import { FileText } from "@phosphor-icons/react";
import styles from "./FileCardNode.module.scss";

export interface FileCardSwapPickerProps {
  paths: readonly string[];
  onSelect: (path: string) => void;
}

export function FileCardSwapPicker({
  paths,
  onSelect,
}: FileCardSwapPickerProps): JSX.Element {
  const [searchFilter, setSearchFilter] = useState("");

  const filtered = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    return paths.filter((p) => p.toLowerCase().includes(q));
  }, [paths, searchFilter]);

  return (
    <div className={`${styles["file-card__picker-popover"]} nodrag nopan`}>
      <input
        type="text"
        className={styles["file-card__picker-input"]}
        placeholder="Search note to swap..."
        value={searchFilter}
        onChange={(e) => setSearchFilter(e.target.value)}
        autoFocus
      />
      <div className={styles["file-card__picker-list"]}>
        {filtered.map((p) => (
          <button
            key={p}
            type="button"
            className={styles["file-card__picker-item"]}
            onClick={() => onSelect(p)}
          >
            <FileText size={12} />
            <span>{p}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
