import type { AgentToolCall, ChatMessage } from "@app/ai-api";
import { isConversationalMeta } from "@app/ai-runtime";
import {
  VAULT_INSPECTION_TOOLS,
  VAULT_MUTATION_TOOLS,
  WEB_SEARCH_TOOL,
  executeInspectionTool,
  executeWebSearchTool,
  planMutation,
  validateAgentAction,
  AGENT_MEMORY_PATH,
  parseMemoryData,
  serializeMemoryData,
  addMemoryEntry,
  type AgentMemoryEntry,
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
  workingHistory?: ChatMessage[];
}

export function formatFallbackContentFromHistory(
  path: string,
  history?: ChatMessage[],
): string {
  if (!history || history.length === 0) return "";
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (msg.role === "tool" && msg.content && typeof msg.content === "string") {
      try {
        const parsed = JSON.parse(msg.content);
        const list = Array.isArray(parsed)
          ? parsed
          : Array.isArray(parsed?.results)
            ? parsed.results
            : null;
        if (list && list.length > 0) {
          const title = path.split("/").pop()?.replace(/\.md$/i, "") || "Notes";
          const lines = [`# ${title}\n`];
          for (const item of list) {
            if (item.title) {
              lines.push(`## ${item.title}`);
              const desc =
                item.snippet ||
                item.content?.replace(/<[^>]+>/g, "").trim() ||
                "";
              if (desc) lines.push(desc);
              if (item.url) lines.push(`\n[Source](${item.url})`);
              lines.push("");
            } else if (item.path && item.snippet) {
              lines.push(`- [[${item.path}]]: ${item.snippet}`);
            }
          }
          return lines.join("\n").trim();
        }
      } catch {
        const title = path.split("/").pop()?.replace(/\.md$/i, "") || "Notes";
        return `# ${title}\n\n${msg.content}`.trim();
      }
    }
  }
  return "";
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
  const validation = validateAgentAction(tc.name, tc.arguments);
  if (!validation.success) {
    return {
      status: "rejected",
      error: `Rejected action: ${validation.error}`,
    };
  }

  const { isDestructive } = validation.data;

  if (tc.name === "save_memory") {
    const rawContent = String(tc.arguments.content ?? "").trim();
    const cat =
      (tc.arguments.category as AgentMemoryEntry["category"]) ?? "general";
    if (rawContent) {
      try {
        const rawJson = await ctx.mutationBackend.readNote(AGENT_MEMORY_PATH);
        const data = parseMemoryData(rawJson);
        const { data: nextData } = addMemoryEntry(data, rawContent, cat);
        await ctx.mutationBackend.writeNote(
          AGENT_MEMORY_PATH,
          serializeMemoryData(nextData),
        );
        return {
          status: "saved",
          fact: rawContent,
          message: `Saved to memory: "${rawContent}"`,
        };
      } catch (err) {
        return {
          error: `Failed to save memory: ${err instanceof Error ? err.message : String(err)}`,
        };
      }
    }
  }

  const isMutation =
    VAULT_MUTATION_TOOLS.some((t) => t.name === tc.name) ||
    tc.name.startsWith("create_");

  if (tc.name === "web_search" && ctx.webSearchEnabled) {
    return executeWebSearchTool(tc.arguments, ctx.webSearchBackend);
  }

  if (isMutation) {
    if (tc.name === "create_note") {
      let pathArg = String(tc.arguments.path ?? "").trim();
      if (!pathArg.includes("/") && ctx.workingHistory) {
        for (let i = ctx.workingHistory.length - 1; i >= 0; i--) {
          const msg = ctx.workingHistory[i];
          if (msg.role === "assistant" && msg.toolCalls) {
            const folderCall = msg.toolCalls.find((c) => c.name === "create_folder");
            const folderPath = String(folderCall?.arguments?.path ?? "").trim();
            if (folderPath) {
              pathArg = `${folderPath}/${pathArg}`;
              tc.arguments.path = pathArg;
              break;
            }
          }
        }
      }

      const contentArg = String(tc.arguments.content ?? "").trim();
      const isMeta = isConversationalMeta(contentArg);
      if ((!contentArg || isMeta) && ctx.workingHistory) {
        const fallback = formatFallbackContentFromHistory(
          pathArg,
          ctx.workingHistory,
        );
        tc.arguments.content = fallback || "";
      }
    }

    const plan = await planMutation(tc.name, tc.arguments, ctx.mutationBackend);
    const stagedItem: StagedChangeItem = {
      id: `staged_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      toolName: tc.name,
      plan,
      status: "pending",
    };

    // Destructive actions ALWAYS require user confirmation in the UI even if autoApply is enabled
    if (isDestructive) {
      ctx.setStagedChanges((prev) => [...prev, stagedItem]);
      return {
        status: "confirmation_required",
        action: tc.name,
        path: plan.changeRecord.path,
        message: `Action "${tc.name}" on "${plan.changeRecord.path}" is destructive and requires user confirmation. Staged for review.`,
      };
    }

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
