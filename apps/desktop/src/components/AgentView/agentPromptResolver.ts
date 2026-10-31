import type { AIProvider, AgentToolDefinition } from "@app/ai-api";
import {
  routeIntent,
  getScopedSystemPrompt,
  getScopedTools,
  isAgentIntent,
  AGENT_MEMORY_PATH,
  parseMemoryData,
  formatMemoryPrompt,
  WEB_SEARCH_TOOL,
  type AgentIntent,
  type StructuredUserRequest,
  type VaultMutationBackend,
  executeRewriteStep,
  shouldClarifyRequest,
} from "@app/ai-agent";
import { buildAgentSystemPrompt } from "./agentSystemPrompt.js";
import { prepareActiveTools } from "./executeAgentStepTool.js";
import type { UseAgentExecutionOptions } from "./useAgentExecution.js";

export interface ResolvePromptAndToolsParams {
  options?: UseAgentExecutionOptions;
  structuredRequest: StructuredUserRequest | null;
  provider: AIProvider;
  promptText: string;
  vaultPath: string | null;
  allNotePaths: string[];
  allFolderPaths: string[];
  mutationBackend: VaultMutationBackend;
}

export async function resolveExecutionPromptAndTools(
  params: ResolvePromptAndToolsParams,
): Promise<{ systemPrompt: string; activeTools: AgentToolDefinition[] }> {
  const {
    options,
    structuredRequest,
    provider,
    promptText,
    vaultPath,
    allNotePaths,
    allFolderPaths,
    mutationBackend,
  } = params;

  const vName =
    options?.vaultName ??
    (vaultPath ? vaultPath.split(/[/\\]/).pop() || "Vault" : "Vault");

  let systemPrompt: string;
  let activeTools = prepareActiveTools(options?.webSearchEnabled);

  if (options?.rewriteEnabled) {
    const rawIntent = structuredRequest?.intent || "";
    const resolvedIntent: AgentIntent = isAgentIntent(rawIntent)
      ? rawIntent
      : await routeIntent(promptText, async (p) => {
          const r = await provider.complete({
            messages: [{ role: "user", content: p }],
          });
          return r.content || "";
        });

    systemPrompt = getScopedSystemPrompt(
      resolvedIntent,
      vName,
      allNotePaths.slice(0, 50),
    );
    const scopedTools = getScopedTools(resolvedIntent);
    activeTools =
      options?.webSearchEnabled && resolvedIntent !== "chat"
        ? [...scopedTools, WEB_SEARCH_TOOL]
        : scopedTools;
  } else {
    systemPrompt = buildAgentSystemPrompt({
      vaultName: vName,
      allNotePaths,
      allFolderPaths,
    });
  }

  try {
    const rawMem = await mutationBackend.readNote(AGENT_MEMORY_PATH);
    const memText = formatMemoryPrompt(parseMemoryData(rawMem));
    if (memText) systemPrompt = `${systemPrompt}\n\n${memText}`;
  } catch {
    // memory not initialized yet
  }

  return { systemPrompt, activeTools };
}

export async function executeRewriteAndClarify(
  promptText: string,
  provider: AIProvider,
): Promise<{
  structuredRequest: StructuredUserRequest;
  clarificationQuestion?: string;
}> {
  const structuredRequest = await executeRewriteStep(promptText, async (prompt) => {
    const res = await provider.complete({
      messages: [{ role: "user", content: prompt }],
    });
    return res.content || "";
  });
  const clarification = shouldClarifyRequest(structuredRequest);
  return {
    structuredRequest,
    clarificationQuestion: clarification.needsClarification
      ? clarification.question
      : undefined,
  };
}
