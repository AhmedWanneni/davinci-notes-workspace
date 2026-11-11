import { WarningCircle, CheckCircle } from "@phosphor-icons/react";
import { useAgentStore } from "./useAgentStore";
import {
  calculateContextBudget,
  type ContextBudgetInfo,
} from "./agentTokenEstimator";
import type { ChatMessageItem } from "./agentTypes";
import styles from "./AgentTokenBudgetIndicator.module.scss";

export interface AgentTokenBudgetIndicatorProps {
  promptText?: string;
  messages?: ChatMessageItem[];
}

function formatTokens(count: number): string {
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${Math.round(count / 1_000)}k`;
  return `${count}`;
}

export function AgentTokenBudgetIndicator({
  promptText = "",
  messages,
}: AgentTokenBudgetIndicatorProps) {
  const selectedCliAgent = useAgentStore((s) => s.selectedCliAgent);
  const selectedModel = useAgentStore((s) => s.selectedModel);
  const conversations = useAgentStore((s) => s.conversations);
  const activeConversationId = useAgentStore((s) => s.activeConversationId);

  const activeMessages =
    messages ??
    (activeConversationId
      ? (conversations.find((c) => c.id === activeConversationId)?.messages ??
        [])
      : []);

  const budget: ContextBudgetInfo = calculateContextBudget(
    activeMessages,
    promptText,
    selectedCliAgent,
    selectedModel,
  );

  const isAlert = budget.status === "warning" || budget.status === "critical";

  return (
    <div
      className={`${styles["token-budget"]} ${styles[`token-budget--${budget.status}`]}`}
      title={
        isAlert
          ? `${budget.warningLabel}. Estimated context: ~${formatTokens(budget.usedTokens)} / ${formatTokens(budget.maxTokens)} tokens. Tip: Use /compact or start a new chat.`
          : `Estimated context: ~${formatTokens(budget.usedTokens)} / ${formatTokens(budget.maxTokens)} tokens (${budget.percentage}% used)`
      }
      role="status"
      aria-label={`Context token usage: ${budget.percentage}%`}
      data-testid="agent-token-budget-indicator"
      data-status={budget.status}
    >
      <span className={styles["icon"]}>
        {isAlert ? (
          <WarningCircle size={12} weight="fill" />
        ) : (
          <CheckCircle size={11} weight="regular" />
        )}
      </span>
      <span className={styles["label"]}>
        {budget.status === "critical"
          ? `${budget.percentage}% context · Almost out of tokens`
          : budget.status === "warning"
            ? `${budget.percentage}% context · High tokens`
            : `${formatTokens(budget.usedTokens)} / ${formatTokens(budget.maxTokens)}`}
      </span>
    </div>
  );
}
