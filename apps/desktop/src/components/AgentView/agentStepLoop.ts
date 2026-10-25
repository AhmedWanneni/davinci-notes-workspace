import type { AIProvider, AgentToolDefinition, ChatMessage } from "@app/ai-api";
import { VAULT_MUTATION_TOOLS } from "@app/ai-agent";
import { extractConversationalToolCalls } from "@app/ai-runtime";
import {
  executeAgentStepTool,
  type ExecuteAgentStepContext,
} from "./executeAgentStepTool.js";
import type { ChatMessageItem } from "./agentTypes.js";

export interface AgentStepLoopOptions {
  provider: AIProvider;
  workingHistory: ChatMessage[];
  activeTools: AgentToolDefinition[];
  stepContext: ExecuteAgentStepContext;
  promptText: string;
  abortSignal?: AbortSignal | null;
  maxSteps?: number;
  onAssistantMessage: (msg: ChatMessageItem) => void;
}

export async function runAgentStepLoop(
  opts: AgentStepLoopOptions,
): Promise<void> {
  const {
    provider,
    workingHistory,
    activeTools,
    stepContext,
    promptText,
    abortSignal,
    maxSteps = 5,
    onAssistantMessage,
  } = opts;

  let finalResponseReceived = false;
  let hasExecutedMutation = false;

  for (let step = 0; step < maxSteps; step++) {
    if (abortSignal?.aborted) break;

    const res = await provider.complete({
      messages: workingHistory,
      tools: activeTools,
    });

    let effectiveToolCalls = res.toolCalls;
    if (
      (!effectiveToolCalls || effectiveToolCalls.length === 0) &&
      !hasExecutedMutation &&
      res.content
    ) {
      const fallbackCalls = extractConversationalToolCalls(
        res.content,
        promptText,
      );
      if (fallbackCalls.length > 0) {
        effectiveToolCalls = fallbackCalls;
      }
    }

    if (effectiveToolCalls && effectiveToolCalls.length > 0) {
      workingHistory.push({
        role: "assistant",
        content: res.content || "",
        toolCalls: effectiveToolCalls,
      });

      for (const tc of effectiveToolCalls) {
        const toolResult = await executeAgentStepTool(tc, stepContext);

        if (
          VAULT_MUTATION_TOOLS.some((t) => t.name === tc.name) ||
          tc.name.startsWith("create_")
        ) {
          hasExecutedMutation = true;
        }

        workingHistory.push({
          role: "tool",
          name: tc.name,
          toolCallId: tc.id,
          content:
            typeof toolResult === "string"
              ? toolResult
              : JSON.stringify(toolResult),
        });
      }
    } else {
      const replyContent =
        res.content ||
        (hasExecutedMutation
          ? "The requested note has been created in your vault."
          : "Done.");
      onAssistantMessage({
        id: `msg_a_${Date.now()}`,
        role: "assistant",
        content: replyContent,
        timestamp: Date.now(),
      });
      finalResponseReceived = true;
      break;
    }
  }

  if (!finalResponseReceived && workingHistory.length > 0) {
    const lastMsg = workingHistory[workingHistory.length - 1];
    const text =
      lastMsg.role === "assistant" && lastMsg.content
        ? lastMsg.content
        : hasExecutedMutation
          ? "The requested note has been created in your vault."
          : "";
    if (text) {
      onAssistantMessage({
        id: `msg_a_${Date.now()}`,
        role: "assistant",
        content: text,
        timestamp: Date.now(),
      });
    }
  }
}
