import { useState, useRef, useEffect, useId } from "react";
import {
  Copy,
  Check,
  DotsThree,
  FileText,
  Code,
  Browsers,
} from "@phosphor-icons/react";
import { registerWidgetMount } from "@app/editor";
import styles from "./AgentWidgetBlock.module.scss";

export interface AgentWidgetBlockProps {
  source: string;
  onSaveAsNote?: (source: string) => void;
}

export function AgentWidgetBlock({
  source,
  onSaveAsNote,
}: AgentWidgetBlockProps) {
  const [mode, setMode] = useState<"widget" | "source">("widget");
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const rawId = useId();
  const widgetId = `chat-w-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;

  useEffect(() => {
    if (mode !== "widget" || !containerRef.current) return;
    const cleanup = registerWidgetMount(containerRef.current, widgetId, source);
    return cleanup;
  }, [mode, source, widgetId]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <div
      className={styles["widget-block"]}
      onMouseLeave={() => setMenuOpen(false)}
    >
      <div className={styles["widget-block__header"]}>
        <div className={styles["widget-block__tabs"]}>
          <button
            type="button"
            className={`${styles["widget-block__tab"]} ${mode === "widget" ? styles["is-active"] : ""}`}
            onClick={() => setMode("widget")}
          >
            <Browsers size={13} />
            <span>Widget</span>
          </button>
          <button
            type="button"
            className={`${styles["widget-block__tab"]} ${mode === "source" ? styles["is-active"] : ""}`}
            onClick={() => setMode("source")}
          >
            <Code size={13} />
            <span>Source</span>
          </button>
        </div>

        <div className={styles["widget-block__actions"]}>
          <button
            type="button"
            className={styles["widget-block__action-btn"]}
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy widget code"}
            aria-label="Copy widget code"
          >
            {copied ? <Check size={13} weight="bold" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy code"}</span>
          </button>

          {onSaveAsNote && (
            <div className={styles["widget-block__more-wrap"]}>
              <button
                type="button"
                className={styles["widget-block__more-btn"]}
                onClick={() => setMenuOpen((v) => !v)}
                title="More options"
                aria-label="More options"
              >
                <DotsThree size={16} weight="bold" />
              </button>
              {menuOpen && (
                <div className={styles["widget-block__menu"]} role="menu">
                  <button
                    type="button"
                    className={styles["widget-block__menu-item"]}
                    onClick={() => {
                      onSaveAsNote(source);
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
      </div>

      <div className={styles["widget-block__body"]}>
        {mode === "widget" ? (
          <div
            ref={containerRef}
            className={styles["widget-block__iframe-wrap"]}
          />
        ) : (
          <pre className={styles["widget-block__source"]}>
            <code>{source}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
