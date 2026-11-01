import { useState, useRef, useEffect } from "react";
import { CaretDown, CaretUp, Terminal } from "@phosphor-icons/react";
import styles from "./AgentExecutionLogs.module.scss";

export interface AgentExecutionLogsProps {
  logs: string[];
  isStreaming?: boolean;
  defaultOpen?: boolean;
}

export function AgentExecutionLogs({
  logs,
  isStreaming = false,
  defaultOpen = false,
}: AgentExecutionLogsProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen || isStreaming);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isStreaming) {
      setIsOpen(true);
    }
  }, [isStreaming]);

  useEffect(() => {
    if (isOpen && bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  if (!logs || logs.length === 0) {
    return null;
  }

  const latestLog = logs[logs.length - 1];

  return (
    <div
      className={styles["execution-logs"]}
      role="region"
      aria-label="Agent execution logs"
    >
      <button
        type="button"
        className={styles["execution-logs__header"]}
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
      >
        <div className={styles["execution-logs__status"]}>
          <Terminal size={14} />
          <span
            className={`${styles["execution-logs__dot"]} ${isStreaming ? styles["is-live"] : ""}`}
          />
          <span>
            {isStreaming
              ? `Activity: ${latestLog || "Thinking..."}`
              : `Activity (${logs.length} events)`}
          </span>
        </div>
        {isOpen ? (
          <CaretUp size={12} weight="bold" />
        ) : (
          <CaretDown size={12} weight="bold" />
        )}
      </button>

      {isOpen && (
        <div className={styles["execution-logs__body"]} ref={bodyRef}>
          {logs.map((log, index) => (
            <div key={index} className={styles["execution-logs__line"]}>
              {log}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
