import {
  addOrUpdateLibraryItem as addOrUpdateLibraryItemHelper,
  deleteLibraryItem as deleteLibraryItemHelper,
  setProjectInstructions as setProjectInstructionsHelper,
  type AgentConversation,
  type AgentConversationsData,
  type AgentProject,
  type LibraryItem,
} from "@app/ai-agent";
import { persistToVault } from "../agentStorePersistence";
import {
  saveLibraryItemToVault,
  deleteLibraryItemFromVault,
} from "./libraryVaultStorage";

export interface AgentLibraryStoreContext {
  activeConversationId: string | null;
  projects: AgentProject[];
  conversations: AgentConversation[];
  libraryItems: LibraryItem[];
  activeProjectId: string | null;
}

export async function handleAddOrUpdateLibraryItem(
  ctx: AgentLibraryStoreContext,
  item: LibraryItem,
): Promise<LibraryItem[]> {
  let savedItem = item;
  try {
    savedItem = await saveLibraryItemToVault(item, ctx.projects);
  } catch (err) {
    console.warn(
      "[agentLibraryActions] Failed to write markdown to vault:",
      err,
    );
  }

  const data: AgentConversationsData = {
    version: 1,
    activeConversationId: ctx.activeConversationId,
    projects: ctx.projects,
    conversations: ctx.conversations,
    libraryItems: ctx.libraryItems,
  };
  const nextData = addOrUpdateLibraryItemHelper(data, savedItem);
  await persistToVault(nextData);
  return nextData.libraryItems ?? [];
}

export async function handleDeleteLibraryItem(
  ctx: AgentLibraryStoreContext,
  itemId: string,
): Promise<LibraryItem[]> {
  const target = ctx.libraryItems.find((i) => i.id === itemId);
  if (target) {
    try {
      await deleteLibraryItemFromVault(target, ctx.projects);
    } catch (err) {
      console.warn(
        "[agentLibraryActions] Failed to delete markdown file:",
        err,
      );
    }
  }

  const data: AgentConversationsData = {
    version: 1,
    activeConversationId: ctx.activeConversationId,
    projects: ctx.projects,
    conversations: ctx.conversations,
    libraryItems: ctx.libraryItems,
  };
  const nextData = deleteLibraryItemHelper(data, itemId);
  await persistToVault(nextData);
  return nextData.libraryItems ?? [];
}

export async function handleSetProjectInstructions(
  ctx: AgentLibraryStoreContext,
  projectId: string,
  instructions: string,
): Promise<AgentProject[]> {
  const data: AgentConversationsData = {
    version: 1,
    activeConversationId: ctx.activeConversationId,
    projects: ctx.projects,
    conversations: ctx.conversations,
    libraryItems: ctx.libraryItems,
  };
  const nextData = setProjectInstructionsHelper(data, projectId, instructions);
  await persistToVault(nextData);
  return nextData.projects;
}

export function formatSingleLibraryPrompt(item: LibraryItem): string {
  if (item.type === "rule") return `[Rule: ${item.title}]\n${item.content}`;
  if (item.type === "skill") return `[Skill: ${item.title}]\n${item.content}`;
  return item.content;
}

export function formatBatchLibraryPrompts(selected: LibraryItem[]): string {
  const rulesAndSkills = selected.filter((i) => i.type !== "prompt");
  const prompts = selected.filter((i) => i.type === "prompt");

  const parts: string[] = [];
  if (rulesAndSkills.length > 0) {
    const instructions = rulesAndSkills
      .map((i) => `### ${i.title} (${i.type})\n${i.content}`)
      .join("\n\n");
    parts.push(`## Instructions & Rules\n${instructions}`);
  }
  if (prompts.length > 0) {
    const promptTexts = prompts.map((i) => i.content).join("\n\n");
    parts.push(`## Prompt\n${promptTexts}`);
  }
  return parts.join("\n\n");
}
