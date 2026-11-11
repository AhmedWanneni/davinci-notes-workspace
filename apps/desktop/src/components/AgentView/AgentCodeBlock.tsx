import { useState } from "react";
import { Copy, Check, DotsThree, FileText } from "@phosphor-icons/react";
import styles from "./AgentCodeBlock.module.scss";

export interface AgentCodeBlockProps {
  code: string;
  lang?: string;
  onSaveAsNote?: (code: string) => void;
}

export function AgentCodeBlock({
  code,
  lang,
  onSaveAsNote,
}: AgentCodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  const showLang =
    lang && !["markdown", "md", "text", "txt"].includes(lang.toLowerCase());

  return (
    <div
      className={styles["codeblock"]}
      onMouseLeave={() => setMenuOpen(false)}
    >
      <div className={styles["codeblock__actions"]}>
        {showLang && <span className={styles["codeblock__lang"]}>{lang}</span>}
        <button
          type="button"
          className={styles["codeblock__copy-btn"]}
          onClick={handleCopy}
          title={copied ? "Copied!" : "Copy code"}
          aria-label="Copy code"
        >
          {copied ? <Check size={16} weight="bold" /> : <Copy size={16} />}
        </button>

        {onSaveAsNote && (
          <div className={styles["codeblock__more-wrap"]}>
            <button
              type="button"
              className={styles["codeblock__more-btn"]}
              onClick={() => setMenuOpen((v) => !v)}
              title="More options"
              aria-label="More options"
            >
              <DotsThree size={16} weight="bold" />
            </button>
            {menuOpen && (
              <div className={styles["codeblock__menu"]} role="menu">
                <button
                  type="button"
                  className={styles["codeblock__menu-item"]}
                  onClick={() => {
                    onSaveAsNote(code);
                    setMenuOpen(false);
                  }}
                >
                  <FileText size={14} />
                  <span>Save to Note...</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <pre className={styles["codeblock__pre"]}>
        <code>{code}</code>
      </pre>
    </div>
  );
}
