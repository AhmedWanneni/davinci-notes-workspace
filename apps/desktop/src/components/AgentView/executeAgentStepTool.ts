import type { AgentToolCall } from "@app/ai-api";
import {
  VAULT_INSPECTION_TOOLS,
  VAULT_MUTATION_TOOLS,
  WEB_SEARCH_TOOL,
  executeInspectionTool,
  executeWebSearchTool,
  planMutation,
  type VaultInspectionBackend,
  type VaultMutationBackend,
  type WebSearchBackend,
} from "@app/ai-agent";
import type { StagedChangeItem } from "./agentTypes";

export interface ExecuteAgentStepContext {
  webSearchEnabled?: boolean;
  autoApply: boolean;
  webSearchBackend: WebSearchBackend;
  mutationBackend: VaultMutationBackend;
  inspectionBackend: VaultInspectionBackend;
  allNotePaths: string[];
  handleApplyChange: (item: StagedChangeItem) => Promise<void>;
  setStagedChanges: React.Dispatch<React.SetStateAction<StagedChangeItem[]>>;
}

export function prepareActiveTools(webSearchEnabled?: boolean) {
  return webSearchEnabled
    ? [...VAULT_INSPECTION_TOOLS, ...VAULT_MUTATION_TOOLS, WEB_SEARCH_TOOL]
    : [...VAULT_INSPECTION_TOOLS, ...VAULT_MUTATION_TOOLS];
}

export async function executeAgentStepTool(
  tc: AgentToolCall,
  ctx: ExecuteAgentStepContext,
): Promise<unknown> {
  const isMutation =
    VAULT_MUTATION_TOOLS.some((t) => t.name === tc.name) ||
    tc.name.startsWith("create_");

  if (tc.name === "web_search" && ctx.webSearchEnabled) {
    return executeWebSearchTool(tc.arguments, ctx.webSearchBackend);
  }

  if (isMutation) {
    const plan = await planMutation(tc.name, tc.arguments, ctx.mutationBackend);
    const stagedItem: StagedChangeItem = {
      id: `staged_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      toolName: tc.name,
      plan,
      status: "pending",
    };
    if (ctx.autoApply) {
      await ctx.handleApplyChange(stagedItem);
      return {
        status: "applied",
        action: tc.name,
        path: plan.changeRecord.path,
      };
    }
    ctx.setStagedChanges((prev) => [...prev, stagedItem]);
    return {
      status: "staged_for_approval",
      action: tc.name,
      path: plan.changeRecord.path,
    };
  }

  const pathArg = String(tc.arguments.path ?? "").trim();
  if ((pathArg === "Your_Note_Path" || !pathArg) && tc.name === "read_note") {
    return {
      error: "Please specify a real note path from the vault.",
      availableNotes: ctx.allNotePaths.slice(0, 10),
    };
  }

  return executeInspectionTool(tc.name, tc.arguments, ctx.inspectionBackend);
}
