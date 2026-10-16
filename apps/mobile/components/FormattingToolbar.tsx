import React from "react";
import type { ToolbarActionType } from "../src/bridgeProtocol";

export interface FormattingToolbarProps {
  onAction: (action: ToolbarActionType) => void;
  disabled?: boolean;
}

interface ToolbarButtonSpec {
  action: ToolbarActionType;
  label: string;
  ariaLabel: string;
}

const TOOLBAR_BUTTONS: ToolbarButtonSpec[] = [
  { action: "wikilink", label: "[[ ]]", ariaLabel: "Insert wikilink" },
  { action: "link", label: "Link", ariaLabel: "Insert markdown link" },
  { action: "tag", label: "#Tag", ariaLabel: "Insert tag" },
  { action: "checkbox", label: "☑ Task", ariaLabel: "Insert task checkbox" },
  { action: "indent", label: "⇥ Indent", ariaLabel: "Indent list item" },
  { action: "outdent", label: "⇤ Outdent", ariaLabel: "Outdent list item" },
  { action: "undo", label: "↶ Undo", ariaLabel: "Undo last change" },
  { action: "redo", label: "↷ Redo", ariaLabel: "Redo change" },
];

export function FormattingToolbar({
  onAction,
  disabled = false,
}: FormattingToolbarProps): React.ReactElement {
  return (
    <div
      className="mobile-formatting-toolbar"
      style={{
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        overflowX: "auto",
        backgroundColor: "var(--color-bg-secondary, #f6f6f6)",
        borderTop: "1px solid var(--color-border-subtle, #e4e4e4)",
        padding: "6px 8px",
        gap: "6px",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {TOOLBAR_BUTTONS.map((btn) => (
        <button
          key={btn.action}
          type="button"
          disabled={disabled}
          onClick={(e) => {
            // Prevent button from stealing focus from CodeMirror webview
            e.preventDefault();
            onAction(btn.action);
          }}
          aria-label={btn.ariaLabel}
          style={{
            padding: "8px 12px",
            minHeight: "40px",
            minWidth: "44px",
            fontSize: "14px",
            fontWeight: 500,
            borderRadius: "4px",
            border: "1px solid var(--color-border-normal, #d4d4d4)",
            backgroundColor: "var(--color-bg-primary, #ffffff)",
            color: "var(--color-text-normal, #222222)",
            cursor: disabled ? "not-allowed" : "pointer",
            flexShrink: 0,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            touchAction: "manipulation",
          }}
        >
          {btn.label}
        </button>
      ))}
    </div>
  );
}
