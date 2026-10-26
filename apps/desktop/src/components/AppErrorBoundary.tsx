import React, { Component, type ErrorInfo, type ReactNode } from "react";
import styles from "./AppErrorBoundary.module.scss";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AppErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[AppErrorBoundary] Uncaught application error:", error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      return (
        <div className={styles["error-boundary"]}>
          <div className={styles["error-boundary__card"]}>
            <h2 className={styles["error-boundary__title"]}>
              Something went wrong loading DaVinci Notes
            </h2>
            <p className={styles["error-boundary__message"]}>
              {this.state.error?.message || "An unexpected error occurred while rendering the workspace."}
            </p>
            <button
              type="button"
              onClick={this.handleReload}
              className={styles["error-boundary__reload-btn"]}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
