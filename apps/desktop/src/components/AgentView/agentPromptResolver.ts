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
  executeRewriteStep,
  shouldClarifyRequest,
  type AgentIntent,
  type StructuredUserRequest,
  type VaultMutationBackend,
} from "@app/ai-agent";
import { buildAgentSystemPrompt } from "./agentSystemPrompt.js";
import { prepareActiveTools } from "./executeAgentStepTool.js";
import { resolveProjectSisterConversationsContext } from "./agentProjectContextResolver.js";
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
  systemAugmentation?: string;
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

  // Always anchor the agent system prompt to the user's active opened vault
  let systemPrompt = buildAgentSystemPrompt({
    vaultName: vName,
    vaultPath: vaultPath ?? undefined,
    allNotePaths,
    allFolderPaths,
  });

  // Always equip the agent with full vault inspection and mutation tools
  const activeTools = prepareActiveTools(options?.webSearchEnabled);

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

    const scopedGuidance = getScopedSystemPrompt(
      resolvedIntent,
      vName,
      allNotePaths.slice(0, 50),
    );
    systemPrompt += `\n\n## Targeted Intent Guidance\n${scopedGuidance}`;

    if (options?.webSearchEnabled) {
      systemPrompt +=
        "\n\nWeb search is enabled for this request. Use web_search to find relevant public web information before answering. Cite search result URLs in your answer.";
    }
  }

  try {
    const memoryPath = options?.projectId
      ? `.sophia/agent-memory-${options.projectId}.json`
      : AGENT_MEMORY_PATH;
    const rawMem = await mutationBackend.readNote(memoryPath);
    const memText = formatMemoryPrompt(parseMemoryData(rawMem));
    if (memText) systemPrompt = `${systemPrompt}\n\n${memText}`;
  } catch {
    // memory not initialized yet
  }

  if (options?.projectInstructions?.trim()) {
    systemPrompt = `${systemPrompt}\n\n## Project Instructions (${options.projectName || "Project"})\n${options.projectInstructions.trim()}`;
  }

  // Inject shared context from sister conversations in the same project
  const sisterContext = resolveProjectSisterConversationsContext({
    projectId: options?.projectId,
    currentConversationId: options?.activeConversationId,
    conversations: options?.conversations,
    projectName: options?.projectName,
  });
  if (sisterContext.trim()) {
    systemPrompt = `${systemPrompt}\n\n${sisterContext.trim()}`;
  }

  if (options?.projectSources && options.projectSources.length > 0) {
    const loadedSources: string[] = [];
    for (const sourcePath of options.projectSources) {
      try {
        const raw = await mutationBackend.readNote(sourcePath);
        if (raw) {
          loadedSources.push(`### File: ${sourcePath}\n${raw.slice(0, 3000)}`);
        }
      } catch {
        loadedSources.push(
          `### File: ${sourcePath}\n(Referenced project context note)`,
        );
      }
    }
    if (loadedSources.length > 0) {
      systemPrompt = `${systemPrompt}\n\n## Project Context Sources (${options.projectName || "Project"})\n${loadedSources.join("\n\n")}`;
    }
  }

  if (params.systemAugmentation?.trim()) {
    systemPrompt = `${systemPrompt}\n\n${params.systemAugmentation.trim()}`;
  }

  return { systemPrompt, activeTools };
}

export async function resolveRewriteClarification(
  provider: AIProvider,
  promptText: string,
): Promise<{
  structuredRequest: StructuredUserRequest;
  clarificationQuestion?: string;
}> {
  const structuredRequest = await executeRewriteStep(promptText, async (p) => {
    const res = await provider.complete({
      messages: [{ role: "user", content: p }],
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
