import { useState, useEffect, useRef } from "react";
import {
  Copy,
  Check,
  DotsThree,
  FileText,
  Code,
  TreeStructure,
} from "@phosphor-icons/react";
import { renderMermaidSvg } from "@app/editor";
import styles from "./AgentMermaidBlock.module.scss";

export interface AgentMermaidBlockProps {
  source: string;
  onSaveAsNote?: (source: string) => void;
}

export function AgentMermaidBlock({
  source,
  onSaveAsNote,
}: AgentMermaidBlockProps) {
  const [svgHtml, setSvgHtml] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"diagram" | "source">("diagram");
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const diagramRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const renderDiagram = async () => {
      try {
        setError(null);
        const id = `agent-mm-${Math.random().toString(36).slice(2, 9)}`;
        const svg = await renderMermaidSvg(id, source);
        if (!cancelled) setSvgHtml(svg);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    };
    void renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [source]);

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
      className={styles["mermaid-block"]}
      onMouseLeave={() => setMenuOpen(false)}
    >
      <div className={styles["mermaid-block__header"]}>
        <div className={styles["mermaid-block__tabs"]}>
          <button
            type="button"
            className={`${styles["mermaid-block__tab"]} ${mode === "diagram" ? styles["is-active"] : ""}`}
            onClick={() => setMode("diagram")}
          >
            <TreeStructure size={13} />
            <span>Diagram</span>
          </button>
          <button
            type="button"
            className={`${styles["mermaid-block__tab"]} ${mode === "source" ? styles["is-active"] : ""}`}
            onClick={() => setMode("source")}
          >
            <Code size={13} />
            <span>Source</span>
          </button>
        </div>

        <div className={styles["mermaid-block__actions"]}>
          <button
            type="button"
            className={styles["mermaid-block__action-btn"]}
            onClick={handleCopy}
            title={copied ? "Copied!" : "Copy diagram code"}
            aria-label="Copy code"
          >
            {copied ? <Check size={13} weight="bold" /> : <Copy size={13} />}
            <span>{copied ? "Copied" : "Copy code"}</span>
          </button>

          {onSaveAsNote && (
            <div className={styles["mermaid-block__more-wrap"]}>
              <button
                type="button"
                className={styles["mermaid-block__more-btn"]}
                onClick={() => setMenuOpen((v) => !v)}
                title="More options"
                aria-label="More options"
              >
                <DotsThree size={16} weight="bold" />
              </button>
              {menuOpen && (
                <div className={styles["mermaid-block__menu"]} role="menu">
                  <button
                    type="button"
                    className={styles["mermaid-block__menu-item"]}
                    onClick={() => {
                      onSaveAsNote(`\`\`\`mermaid\n${source}\n\`\`\``);
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

      {mode === "diagram" ? (
        <div className={styles["mermaid-block__preview"]} ref={diagramRef}>
          {error ? (
            <div className={styles["mermaid-block__error"]}>
              Diagram parse error: {error}
            </div>
          ) : svgHtml ? (
            <div
              className={styles["mermaid-block__svg-wrap"]}
              dangerouslySetInnerHTML={{ __html: svgHtml }}
            />
          ) : (
            <div className={styles["mermaid-block__loading"]}>
              Rendering diagram...
            </div>
          )}
        </div>
      ) : (
        <pre className={styles["mermaid-block__pre"]}>
          <code>{source}</code>
        </pre>
      )}
    </div>
  );
}
