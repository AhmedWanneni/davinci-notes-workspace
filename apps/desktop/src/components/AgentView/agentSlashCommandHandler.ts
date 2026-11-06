import { BUILTIN_SLASH_COMMANDS } from "./slashCommandCatalog";
import type { AIProviderId } from "../../ai/AISubsystem";

export interface SlashContext {
  providerId?: AIProviderId;
  model?: string;
  selectedCliAgent?: string | null;
  projectName?: string;
  projectId?: string;
  webSearchEnabled?: boolean;
}

export interface SlashResolution {
  handled: boolean;
  action?: "clear" | "models";
  directResponse?: string;
  processedPrompt?: string;
  forceWebSearch?: boolean;
  systemAugmentation?: string;
}

export function resolveSlashCommand(
  rawPrompt: string,
  ctx: SlashContext,
): SlashResolution {
  const trimmed = rawPrompt.trim();
  if (!trimmed.startsWith("/")) {
    return { handled: false, processedPrompt: rawPrompt };
  }

  const spaceIdx = trimmed.indexOf(" ");
  const command = (
    spaceIdx === -1 ? trimmed : trimmed.slice(0, spaceIdx)
  ).toLowerCase();
  const rest = spaceIdx === -1 ? "" : trimmed.slice(spaceIdx + 1).trim();

  if (command === "/clear") {
    return { handled: true, action: "clear" };
  }

  if (command === "/models" || command === "/model") {
    return { handled: true, action: "models" };
  }

  if (command === "/help") {
    const list = BUILTIN_SLASH_COMMANDS.map(
      (c) => `- **\`${c.syntax}\`**: ${c.description}`,
    ).join("\n");
    const helpMsg = `### AI Agent Commands & Options\n\n${list}\n\n*Tip: You can also target CLI agents (codex, agy, claude, opencode) or enable live web search from the prompt toolbar.*`;
    return { handled: true, directResponse: helpMsg };
  }

  if (command === "/usage") {
    const agentLabel = ctx.selectedCliAgent
      ? `CLI Agent: **${ctx.selectedCliAgent}**`
      : `Cloud/Local Provider: **${ctx.providerId || "Default"}**`;
    const modelLabel = ctx.model || "Default Model";
    const projectLabel = ctx.projectName
      ? `Project: **${ctx.projectName}** (ID: \`${ctx.projectId}\`)`
      : "Global Session (No active project)";
    const webLabel = ctx.webSearchEnabled ? "Enabled" : "Disabled";

    const usageMsg = `### Current Agent Usage & Status\n\n- ${agentLabel}\n- Active Model: \`${modelLabel}\`\n- ${projectLabel}\n- Web Search: \`${webLabel}\`\n- Operational Status: **Connected & Ready**`;
    return { handled: true, directResponse: usageMsg };
  }

  if (command === "/plan") {
    const task = rest || "the requested task";
    const systemAug =
      "## Execution Mode: PLANNING\n" +
      "The user requested a strict, structured implementation plan. Formulate a comprehensive plan with:\n" +
      "1. Objectives & Scope\n" +
      "2. Step-by-Step Execution Phases\n" +
      "3. Files, tools, or dependencies impacted\n" +
      "4. Verification and Acceptance Checklist\n" +
      "Do not execute changes yet. Present the plan cleanly in markdown.";
    return {
      handled: false,
      processedPrompt: `[PLANNING MODE] ${task}`,
      systemAugmentation: systemAug,
    };
  }

  if (command === "/grill-me") {
    const topic = rest || "the current task and design decisions";
    const systemAug =
      "## Execution Mode: INTERVIEW (GRILL-ME)\n" +
      "The user requested an interactive design interview. Interview the user thoroughly to reach shared alignment:\n" +
      "- Ask 1 or at most 2 clarifying questions at a time.\n" +
      "- For each question, provide 2 to 4 recommended numbered choices.\n" +
      "- Keep formatting clean and flat (Less Boxes Always principle: no heavy cards or box grids).\n" +
      "- Wait for user feedback before proceeding to execution.";
    return {
      handled: false,
      processedPrompt: `[INTERVIEW MODE] ${topic}`,
      systemAugmentation: systemAug,
    };
  }

  if (command === "/web") {
    return {
      handled: false,
      processedPrompt: rest,
      forceWebSearch: true,
    };
  }

  return { handled: false, processedPrompt: rawPrompt };
}
