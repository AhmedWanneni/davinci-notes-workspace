import { useState, useEffect } from "react";
import {
  Robot,
  Cpu,
  ArrowsClockwise,
} from "@phosphor-icons/react";
import { WindowDialog } from "../WindowDialog";
import {
  loadAgentUsageReport,
  clearAgentUsageReport,
  type AgentUsageReport,
} from "./agentUsageTracker";
import styles from "./AgentUsageDialog.module.scss";

export interface AgentUsageDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}k`;
  return count.toLocaleString();
}

export function AgentUsageDialog({ isOpen, onClose }: AgentUsageDialogProps) {
  const [report, setReport] = useState<AgentUsageReport>(loadAgentUsageReport);

  useEffect(() => {
    if (!isOpen) return;
    setReport(loadAgentUsageReport());
    const handleUpdate = () => setReport(loadAgentUsageReport());
    window.addEventListener("davinci-agent-usage-updated", handleUpdate);
    return () =>
      window.removeEventListener("davinci-agent-usage-updated", handleUpdate);
  }, [isOpen]);

  const modelsList = Object.values(report.models);
  const cliAgents = modelsList.filter((m) => m.type === "cli_agent");
  const cloudModels = modelsList.filter((m) => m.type !== "cli_agent");

  return (
    <WindowDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Model & Agent Usage"
      size="lg"
      ariaLabel="Model and Agent Usage Dialog"
    >
      <div className={styles["usage-dialog"]}>
        <div className={styles["summary-grid"]}>
          <div className={styles["summary-card"]}>
            <span className={styles["summary-label"]}>Total Requests</span>
            <span className={styles["summary-value"]}>
              {report.lifetimeTotalRequests.toLocaleString()}
            </span>
          </div>
          <div className={styles["summary-card"]}>
            <span className={styles["summary-label"]}>Total Tokens</span>
            <span className={styles["summary-value"]}>
              {formatTokens(report.lifetimeTotalTokens)}
            </span>
          </div>
          <div className={styles["summary-card"]}>
            <span className={styles["summary-label"]}>CLI Agents</span>
            <span className={styles["summary-value"]}>{cliAgents.length}</span>
          </div>
          <div className={styles["summary-card"]}>
            <span className={styles["summary-label"]}>Active Models</span>
            <span className={styles["summary-value"]}>{cloudModels.length}</span>
          </div>
        </div>

        <div className={styles["section"]}>
          <div className={styles["section-header"]}>Autonomous CLI Agents</div>
          <div className={styles["row-list"]}>
            {cliAgents.map((agent) => (
              <div key={agent.id} className={styles["usage-row"]}>
                <div className={styles["row-left"]}>
                  <div className={styles["row-icon"]}>
                    <Robot size={18} weight="duotone" />
                  </div>
                  <div className={styles["row-info"]}>
                    <span className={styles["row-title"]}>{agent.name}</span>
                    <span className={styles["row-sub"]}>
                      Context: {formatTokens(agent.contextWindow)} tokens · {agent.totalRequests} runs
                    </span>
                  </div>
                </div>
                <div className={styles["row-right"]}>
                  <span className={styles["row-tokens"]}>
                    {formatTokens(agent.totalTokens)} tokens
                  </span>
                  <span className={styles["row-meta"]}>
                    in: {formatTokens(agent.inputTokens)} · out: {formatTokens(agent.outputTokens)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles["divider"]} />

        <div className={styles["section"]}>
          <div className={styles["section-header"]}>Cloud & Local Models</div>
          <div className={styles["row-list"]}>
            {cloudModels.map((model) => (
              <div key={model.id} className={styles["usage-row"]}>
                <div className={styles["row-left"]}>
                  <div className={styles["row-icon"]}>
                    <Cpu size={18} weight="duotone" />
                  </div>
                  <div className={styles["row-info"]}>
                    <span className={styles["row-title"]}>{model.name}</span>
                    <span className={styles["row-sub"]}>
                      Context: {formatTokens(model.contextWindow)} tokens · {model.totalRequests} calls
                    </span>
                  </div>
                </div>
                <div className={styles["row-right"]}>
                  <span className={styles["row-tokens"]}>
                    {formatTokens(model.totalTokens)} tokens
                  </span>
                  <span className={styles["row-meta"]}>
                    in: {formatTokens(model.inputTokens)} · out: {formatTokens(model.outputTokens)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles["footer"]}>
          <span className={styles["footer-tip"]}>
            Tokens are tracked locally. No data leaves your machine.
          </span>
          <button
            type="button"
            className={styles["reset-btn"]}
            onClick={clearAgentUsageReport}
            title="Reset token and request counters"
          >
            <ArrowsClockwise size={12} />
            <span>Reset stats</span>
          </button>
        </div>
      </div>
    </WindowDialog>
  );
}
