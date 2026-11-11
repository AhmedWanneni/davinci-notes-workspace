import React, { Component, type ReactNode } from "react";
import { useAgentStore } from "../useAgentStore";
import { DEFAULT_LIBRARY_ITEMS } from "./agentLibraryDefaults";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AgentLibraryErrorBoundaryClass extends Component<
  Props & { onReset: () => void; onBackToChat: () => void },
  State
> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error(
      "[AgentLibraryErrorBoundary] Caught render error:",
      error,
      info,
    );
  }

  public override render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            width: "100%",
            padding: "32px",
            boxSizing: "border-box",
            backgroundColor: "var(--color-bg-primary)",
            color: "var(--color-text-normal)",
            textAlign: "center",
            gap: "16px",
          }}
        >
          <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0 }}>
            Unable to load AI Prompt Library
          </h2>
          <p
            style={{
              fontSize: "13px",
              color: "var(--color-text-muted)",
              margin: 0,
              maxWidth: "440px",
            }}
          >
            {this.state.error?.message ||
              "An unexpected error occurred while rendering the library."}
          </p>
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid var(--color-border-subtle)",
                backgroundColor: "var(--color-bg-primary-alt)",
                color: "var(--color-text-normal)",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Reset to Defaults
            </button>
            <button
              type="button"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onBackToChat();
              }}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "1px solid var(--color-text-accent)",
                backgroundColor: "var(--color-text-accent)",
                color: "var(--color-bg-primary)",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: 600,
              }}
            >
              Return to Chat
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export function AgentLibraryErrorBoundary({ children }: Props) {
  const setActiveNavSection = useAgentStore((s) => s.setActiveNavSection);

  const handleReset = () => {
    useAgentStore.setState({ libraryItems: DEFAULT_LIBRARY_ITEMS });
  };

  const handleBackToChat = () => {
    setActiveNavSection("chat");
  };

  return (
    <AgentLibraryErrorBoundaryClass
      onReset={handleReset}
      onBackToChat={handleBackToChat}
    >
      {children}
    </AgentLibraryErrorBoundaryClass>
  );
}
