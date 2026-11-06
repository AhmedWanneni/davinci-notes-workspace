import { useState, useRef, useEffect } from "react";
import {
  Copy,
  Check,
  SpeakerHigh,
  ThumbsUp,
  ThumbsDown,
  ArrowsClockwise,
  UploadSimple,
  DotsThree,
  FolderSimple,
} from "@phosphor-icons/react";

export interface AgentMessageActionsProps {
  content: string;
  onRegenerate?: () => void;
  onOpenSaveModal: () => void;
}

export function AgentMessageActions({
  content,
  onRegenerate,
  onOpenSaveModal,
}: AgentMessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard write failures
    }
  };

  const handleSpeak = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(content);
      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="agent-message__actions">
      <button
        type="button"
        className="agent-message__action-btn"
        onClick={() => void handleCopy()}
        aria-label="Copy message"
        title={copied ? "Copied!" : "Copy"}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <button
        type="button"
        className="agent-message__action-btn"
        onClick={handleSpeak}
        aria-label="Read aloud"
        title="Read aloud"
      >
        <SpeakerHigh size={14} />
      </button>
      <button
        type="button"
        className="agent-message__action-btn"
        aria-label="Share message"
        title="Share"
      >
        <UploadSimple size={14} />
      </button>
      <button
        type="button"
        className={`agent-message__action-btn ${feedback === "up" ? "is-active" : ""}`}
        onClick={() => setFeedback((f) => (f === "up" ? null : "up"))}
        aria-label="Good response"
        title="Good response"
      >
        <ThumbsUp size={14} weight={feedback === "up" ? "fill" : "regular"} />
      </button>
      <button
        type="button"
        className={`agent-message__action-btn ${feedback === "down" ? "is-active" : ""}`}
        onClick={() => setFeedback((f) => (f === "down" ? null : "down"))}
        aria-label="Bad response"
        title="Bad response"
      >
        <ThumbsDown
          size={14}
          weight={feedback === "down" ? "fill" : "regular"}
        />
      </button>
      {onRegenerate && (
        <button
          type="button"
          className="agent-message__action-btn"
          onClick={onRegenerate}
          aria-label="Regenerate"
          title="Regenerate response"
        >
          <ArrowsClockwise size={14} />
        </button>
      )}
      <div className="agent-message__more-wrap" ref={menuRef}>
        <button
          type="button"
          className="agent-message__action-btn"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="More options"
          title="More options"
        >
          <DotsThree size={16} weight="bold" />
        </button>
        {menuOpen && (
          <div className="agent-message__dropdown-menu" role="menu">
            <button
              type="button"
              className="agent-message__dropdown-item"
              onClick={() => {
                onOpenSaveModal();
                setMenuOpen(false);
              }}
            >
              <FolderSimple size={14} />
              <span>Save to Note...</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
