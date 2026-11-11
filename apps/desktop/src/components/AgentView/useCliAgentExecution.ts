import { useState, useCallback, useRef } from "react";
import {
  startCliAgentSession,
  cancelCliAgentSession,
  subscribeCliAgentStream,
} from "./cliAgentBridge";
import type { CliAgentId, CliAgentStreamEvent } from "./cliAgentTypes";

export interface CliSessionState {
  sessionId: string;
  agentId: CliAgentId;
  agentName: string;
  status: "running" | "done" | "error";
  logs: string[];
}

export interface CliRunCallbacks {
  onChunk?: (chunk: string) => void;
  onLog?: (line: string) => void;
  onComplete?: (finalOutput: string) => void;
}

export function useCliAgentExecution() {
  const [cliSession, setCliSession] = useState<CliSessionState | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);

  const cancelActiveCliSession = useCallback(async () => {
    const currentId = activeSessionIdRef.current;
    if (currentId) {
      await cancelCliAgentSession(currentId);
      setCliSession((prev) =>
        prev && prev.sessionId === currentId
          ? {
              ...prev,
              status: "error",
              logs: [...prev.logs, "Session aborted by user."],
            }
          : prev,
      );
      activeSessionIdRef.current = null;
    }
  }, []);

  const runCliPrompt = useCallback(
    async (
      agentId: CliAgentId,
      agentName: string,
      promptText: string,
      vaultPath: string,
      callbacksOrComplete?: CliRunCallbacks | ((finalOutput: string) => void),
    ) => {
      const callbacks: CliRunCallbacks =
        typeof callbacksOrComplete === "function"
          ? { onComplete: callbacksOrComplete }
          : (callbacksOrComplete ?? {});

      const sessionId = `cli_${Date.now()}`;
      activeSessionIdRef.current = sessionId;

      setCliSession({
        sessionId,
        agentId,
        agentName,
        status: "running",
        logs: [`Starting ${agentName} in vault...`],
      });

      let accumulatedText = "";

      const unlisten = await subscribeCliAgentStream(
        sessionId,
        (event: CliAgentStreamEvent) => {
          if (event.kind === "text") {
            const chunk = (accumulatedText ? "\n" : "") + event.content;
            accumulatedText += chunk;
            callbacks.onChunk?.(event.content + "\n");
          } else if (event.kind === "thought" || event.kind === "action") {
            callbacks.onLog?.(event.content);
          } else if (event.kind === "error") {
            callbacks.onLog?.(`[error] ${event.content}`);
          }

          setCliSession((prev) => {
            if (!prev || prev.sessionId !== sessionId) return prev;
            const nextLogs = [...prev.logs, event.content];
            if (event.kind === "done") {
              return { ...prev, status: "done", logs: nextLogs };
            }
            if (event.kind === "error") {
              return { ...prev, status: "error", logs: nextLogs };
            }
            return { ...prev, logs: nextLogs };
          });

          if (event.kind === "done" || event.kind === "error") {
            activeSessionIdRef.current = null;
            callbacks.onComplete?.(accumulatedText || event.content);
          }
        },
      );

      try {
        await startCliAgentSession(sessionId, agentId, promptText, vaultPath);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setCliSession((prev) =>
          prev && prev.sessionId === sessionId
            ? {
                ...prev,
                status: "error",
                logs: [...prev.logs, `Error: ${errorMsg}`],
              }
            : prev,
        );
        activeSessionIdRef.current = null;
        unlisten();
        throw err;
      }
    },
    [],
  );

  return {
    cliSession,
    runCliPrompt,
    cancelActiveCliSession,
  };
}
