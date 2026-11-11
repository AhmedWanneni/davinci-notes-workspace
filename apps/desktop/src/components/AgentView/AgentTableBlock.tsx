import { useState } from "react";
import { Copy, Check } from "@phosphor-icons/react";
import styles from "./AgentTableBlock.module.scss";

export interface AgentTableBlockProps {
  markdownTable: string;
}

export function AgentTableBlock({ markdownTable }: AgentTableBlockProps) {
  const [copied, setCopied] = useState(false);

  const lines = markdownTable
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return <pre>{markdownTable}</pre>;

  const parseCells = (row: string) => {
    return row
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((c) => c.trim());
  };

  const headerCells = parseCells(lines[0]);
  // line 1 is usually separator like |---|---|
  const dataLines = lines.slice(2);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdownTable);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore error
    }
  };

  return (
    <div className={styles["table-wrap"]}>
      <div className={styles["table-toolbar"]}>
        <button
          type="button"
          className={styles["table-copy-btn"]}
          onClick={handleCopy}
          title="Copy markdown table"
          aria-label="Copy markdown table"
        >
          {copied ? <Check size={12} weight="bold" /> : <Copy size={12} />}
          <span>{copied ? "Copied" : "Copy table"}</span>
        </button>
      </div>
      <table className={styles["table"]}>
        <thead>
          <tr>
            {headerCells.map((h, idx) => (
              <th key={idx}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataLines.map((row, rIdx) => {
            const cells = parseCells(row);
            return (
              <tr key={rIdx}>
                {cells.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
