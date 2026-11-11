import {
  createProject as createProjectHelper,
  deleteProject as deleteProjectHelper,
  moveConversationToProject,
  renameProject as renameProjectHelper,
  addProjectSource as addProjectSourceHelper,
  removeProjectSource as removeProjectSourceHelper,
  type AgentConversation,
  type AgentProject,
} from "@app/ai-agent";
import { persistToVault } from "./agentStorePersistence";

export interface ProjectActionContext {
  conversations: AgentConversation[];
  projects: AgentProject[];
  activeConversationId: string | null;
  activeProjectId: string | null;
}

export async function handleCreateProject(
  ctx: ProjectActionContext,
  name: string,
): Promise<{ projects: AgentProject[]; activeProjectId: string }> {
  const { data, project } = createProjectHelper(
    {
      version: 1,
      activeConversationId: ctx.activeConversationId,
      projects: ctx.projects,
      conversations: ctx.conversations,
    },
    name,
  );
  await persistToVault(data, true);
  return { projects: data.projects, activeProjectId: project.id };
}

export async function handleRenameProject(
  ctx: ProjectActionContext,
  id: string,
  name: string,
): Promise<AgentProject[]> {
  const data = renameProjectHelper(
    {
      version: 1,
      activeConversationId: ctx.activeConversationId,
      projects: ctx.projects,
      conversations: ctx.conversations,
    },
    id,
    name,
  );
  await persistToVault(data, true);
  return data.projects;
}

export async function handleDeleteProject(
  ctx: ProjectActionContext,
  id: string,
): Promise<{
  projects: AgentProject[];
  conversations: AgentConversation[];
  activeProjectId: string | null;
}> {
  const data = deleteProjectHelper(
    {
      version: 1,
      activeConversationId: ctx.activeConversationId,
      projects: ctx.projects,
      conversations: ctx.conversations,
    },
    id,
  );
  await persistToVault(data, true);
  return {
    projects: data.projects,
    conversations: data.conversations,
    activeProjectId: ctx.activeProjectId === id ? null : ctx.activeProjectId,
  };
}

export async function handleProjectSource(
  ctx: ProjectActionContext,
  id: string,
  path: string,
  action: "add" | "remove",
): Promise<AgentProject[]> {
  const helper =
    action === "add" ? addProjectSourceHelper : removeProjectSourceHelper;
  const data = helper(
    {
      version: 1,
      activeConversationId: ctx.activeConversationId,
      projects: ctx.projects,
      conversations: ctx.conversations,
    },
    id,
    path,
  );
  await persistToVault(data, true);
  return data.projects;
}

export async function handleAssignProject(
  ctx: ProjectActionContext,
  convId: string,
  projectId: string | null,
): Promise<AgentConversation[]> {
  const data = moveConversationToProject(
    {
      version: 1,
      activeConversationId: ctx.activeConversationId,
      projects: ctx.projects,
      conversations: ctx.conversations,
    },
    convId,
    projectId,
  );
  await persistToVault(data, true);
  return data.conversations;
}
