import type {
  AIProvider,
  AgentToolCall,
  AgentToolDefinition,
  ChatMessage,
} from "@app/ai-api";
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
  onAssistantChunk?: (chunk: string) => void;
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
    onAssistantChunk,
  } = opts;

  let finalResponseReceived = false;
  let hasExecutedMutation = false;

  for (let step = 0; step < maxSteps; step++) {
    if (abortSignal?.aborted) break;

    let content = "";
    let effectiveToolCalls: AgentToolCall[] | undefined;

    if (typeof provider.completeStream === "function") {
      try {
        const stream = provider.completeStream({
          messages: workingHistory,
          tools: activeTools,
        });
        const toolCallBuilders: Record<
          number,
          { id?: string; name?: string; args: string }
        > = {};

        for await (const chunk of stream) {
          if (abortSignal?.aborted) break;
          if (chunk.delta.content) {
            content += chunk.delta.content;
            onAssistantChunk?.(chunk.delta.content);
            await new Promise((r) => setTimeout(r, 0));
          }
          if (chunk.delta.toolCalls) {
            for (const tc of chunk.delta.toolCalls) {
              const b = toolCallBuilders[tc.index] ?? {
                id: tc.id,
                name: tc.name,
                args: "",
              };
              if (tc.id) b.id = tc.id;
              if (tc.name) b.name = tc.name;
              if (tc.argumentsDelta) b.args += tc.argumentsDelta;
              toolCallBuilders[tc.index] = b;
            }
          }
        }

        const streamedCalls = Object.values(toolCallBuilders)
          .map((b, idx) => {
            let parsedArgs: Record<string, unknown> = {};
            try {
              parsedArgs = JSON.parse(b.args);
            } catch {
              // ignore partial args
            }
            return {
              id: b.id || `call_${Date.now()}_${idx}`,
              name: b.name || "",
              arguments: parsedArgs,
            };
          })
          .filter((tc) => Boolean(tc.name));

        if (streamedCalls.length > 0) effectiveToolCalls = streamedCalls;
      } catch {
        const res = await provider.complete({
          messages: workingHistory,
          tools: activeTools,
        });
        content = res.content || "";
        effectiveToolCalls = res.toolCalls;
      }
    } else {
      const res = await provider.complete({
        messages: workingHistory,
        tools: activeTools,
      });
      content = res.content || "";
      effectiveToolCalls = res.toolCalls;
    }

    if (
      (!effectiveToolCalls || effectiveToolCalls.length === 0) &&
      !hasExecutedMutation &&
      content
    ) {
      const fallbackCalls = extractConversationalToolCalls(
        content,
        promptText,
      );
      if (fallbackCalls.length > 0) {
        effectiveToolCalls = fallbackCalls;
      }
    }

    if (effectiveToolCalls && effectiveToolCalls.length > 0) {
      workingHistory.push({
        role: "assistant",
        content: content || "",
        toolCalls: effectiveToolCalls,
      });

      for (const tc of effectiveToolCalls) {
        const toolResult = await executeAgentStepTool(tc, {
          ...stepContext,
          workingHistory,
        });

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
        content ||
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
