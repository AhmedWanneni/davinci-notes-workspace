import { useState, useCallback } from "react";
import { Copy, Check } from "@phosphor-icons/react";

export interface AgentCodeBlockProps {
  code: string;
  language?: string;
  isStreaming?: boolean;
}

export function AgentCodeBlock({
  code,
  language = "code",
  isStreaming = false,
}: AgentCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures in restricted environments
    }
  }, [code]);

  return (
    <div className="agent-code-block" data-streaming={isStreaming || undefined}>
      <div className="agent-code-block__header">
        <span className="agent-code-block__lang">{language || "text"}</span>
        <button
          type="button"
          className="agent-code-block__copy-btn"
          onClick={handleCopy}
          aria-label={copied ? "Copied code" : "Copy code"}
          title={copied ? "Copied!" : "Copy code"}
        >
          {copied ? (
            <>
              <Check size={13} weight="bold" />
              <span>Copied</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="agent-code-block__pre">
        <code className="agent-code-block__code">{code}</code>
      </pre>
    </div>
  );
}
