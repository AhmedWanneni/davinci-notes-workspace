import type {
  AIProvider,
  AgentToolCall,
  AgentToolDefinition,
  AgentToolResult,
  ChatMessage,
} from "@app/ai-api";
import { VAULT_MUTATION_TOOLS } from "@app/ai-agent";
import { extractConversationalToolCalls } from "@app/ai-runtime";
import {
  executeAgentStepTool,
  type ExecuteAgentStepContext,
} from "./executeAgentStepTool.js";
import { ensureParentFolderToolCalls, parseVaultActionTags } from "./agentCliVaultSync.js";
import { recordAgentUsage } from "./agentUsageTracker.js";
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
  onStepLog?: (log: string) => void;
}

function formatStepStartLog(tc: AgentToolCall): string {
  const pathArg = String(tc.arguments?.path || tc.arguments?.toPath || "");
  if (tc.name === "create_note") return `Creating note "${pathArg || "note"}" in vault...`;
  if (tc.name === "edit_note" || tc.name === "append_to_note")
    return `Updating note "${pathArg || "note"}" in vault...`;
  if (tc.name === "create_folder") return `Creating folder "${pathArg || "folder"}" in vault...`;
  if (tc.name === "read_note") return `Reading note "${pathArg || "note"}" from vault...`;
  if (tc.name === "search_vault") return `Searching vault for "${tc.arguments?.query || ""}"...`;
  if (tc.name === "save_memory") return `Saving memory: "${tc.arguments?.content || ""}"...`;
  return `Executing ${tc.name}...`;
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
    maxSteps = 8,
    onAssistantMessage,
    onAssistantChunk,
    onStepLog,
  } = opts;

  let finalResponseReceived = false;
  let hasExecutedMutation = false;
  const collectedToolCalls: AgentToolCall[] = [];
  const collectedToolResults: AgentToolResult[] = [];

  const emitFinalMessage = (text: string) => {
    const inTokens = Math.ceil(
      workingHistory.reduce((acc, m) => acc + (m.content || "").length, 0) /
        3.8,
    );
    const outTokens = Math.ceil((text || "").length / 3.8);
    recordAgentUsage({
      id: provider.id || "cloud_model",
      name: provider.name || provider.id || "Sophia Assistant",
      type: "cloud_model",
      inputTokens: inTokens,
      outputTokens: outTokens,
    });
    const enriched = ensureParentFolderToolCalls(
      collectedToolCalls,
      collectedToolResults,
    );
    onAssistantMessage({
      id: `msg_a_${Date.now()}`,
      role: "assistant",
      content: text,
      toolCalls: enriched.toolCalls.length > 0 ? enriched.toolCalls : undefined,
      toolResults:
        enriched.toolResults.length > 0 ? enriched.toolResults : undefined,
      timestamp: Date.now(),
    });
  };

  for (let step = 0; step < maxSteps; step++) {
    if (abortSignal?.aborted) break;
    onStepLog?.(
      step === 0
        ? "Analyzing prompt..."
        : `Step ${step + 1}: processing tool results...`,
    );

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
        const res = await provider.complete({ messages: workingHistory, tools: activeTools });
        content = res.content || "";
        effectiveToolCalls = res.toolCalls;
      }
    } else {
      const res = await provider.complete({ messages: workingHistory, tools: activeTools });
      content = res.content || "";
      effectiveToolCalls = res.toolCalls;
    }

    if ((!effectiveToolCalls || effectiveToolCalls.length === 0) && !hasExecutedMutation && content) {
      const { calls: tagCalls, cleanedText } = parseVaultActionTags(content);
      if (tagCalls.length > 0) {
        effectiveToolCalls = tagCalls;
        content = cleanedText;
      } else {
        const fallbackCalls = extractConversationalToolCalls(content, promptText);
        if (fallbackCalls.length > 0) effectiveToolCalls = fallbackCalls;
      }
    }

    if (effectiveToolCalls && effectiveToolCalls.length > 0) {
      workingHistory.push({ role: "assistant", content: content || "", toolCalls: effectiveToolCalls });

      for (const tc of effectiveToolCalls) {
        const pathArg = String(tc.arguments?.path || tc.arguments?.toPath || "");
        onStepLog?.(formatStepStartLog(tc));
        const toolResult = await executeAgentStepTool(tc, { ...stepContext, workingHistory });
        const isApplied = toolResult && typeof toolResult === "object" && (toolResult as { status?: string }).status === "applied";

        if (isApplied) onStepLog?.(`✓ Applied ${tc.name} on "${pathArg}"`);
        else if (tc.name === "save_memory") onStepLog?.(`✓ Memory saved`);

        if (VAULT_MUTATION_TOOLS.some((t) => t.name === tc.name) || tc.name.startsWith("create_")) {
          hasExecutedMutation = true;
        }

        const serializedResult = typeof toolResult === "string" ? toolResult : JSON.stringify(toolResult);
        const isErr = Boolean(
          toolResult &&
            typeof toolResult === "object" &&
            ((toolResult as { error?: unknown }).error || (toolResult as { status?: string }).status === "rejected"),
        );

        collectedToolCalls.push(tc);
        collectedToolResults.push({ toolCallId: tc.id, name: tc.name, content: serializedResult, isError: isErr || undefined });
        workingHistory.push({ role: "tool", name: tc.name, toolCallId: tc.id, content: serializedResult });
      }
    } else {
      emitFinalMessage(content || (hasExecutedMutation ? "The requested changes have been applied to your vault." : "Done."));
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
          ? "The requested changes have been applied to your vault."
          : "";
    if (text) emitFinalMessage(text);
  }
}
