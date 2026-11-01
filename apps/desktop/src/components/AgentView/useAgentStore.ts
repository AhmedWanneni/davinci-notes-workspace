import { create } from "zustand";
import {
  AGENT_CONVERSATIONS_PATH,
  parseConversationsData,
  deleteConversation as deleteConversationHelper,
  type AgentConversation,
  type AgentProject,
} from "@app/ai-agent";
import { readNote } from "../../vault/vaultCommands";
import { persistToVault } from "./agentStorePersistence";
import { saveActiveMessagesHelper } from "./agentConversationSaver";
import {
  handleCreateProject,
  handleRenameProject,
  handleDeleteProject,
  handleProjectSource,
  handleAssignProject,
} from "./agentProjectActions";
import type { ChatMessageItem } from "./agentTypes";

export interface AgentStoreState {
  conversations: AgentConversation[];
  projects: AgentProject[];
  activeConversationId: string | null;
  activeProjectId: string | null;
  projectTab: "chats" | "sources";
  activeNavSection: string;
  searchQuery: string;
  thinkMode: boolean;
  webSearchEnabled: boolean;
  powerTier: "light" | "medium" | "high";
  chatMode: "chat" | "cowork";
  isModelPickerOpen: boolean;
  isLoaded: boolean;
  selectedModel: string;
  selectedProvider: string;
  selectedCliAgent: string | null;
  cliAgentModels: Record<string, string>;
  projectInstructions: Record<string, string>;

  loadConversations: () => Promise<void>;
  selectConversation: (id: string | null) => void;
  createNewConversation: (
    title?: string,
    projectId?: string | null,
  ) => Promise<AgentConversation>;
  deleteConversation: (id: string) => Promise<void>;
  renameConversation: (id: string, title: string) => Promise<void>;
  selectProject: (projectId: string | null) => void;
  createProject: (name: string) => Promise<AgentProject>;
  renameProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  assignProject: (convId: string, projectId: string | null) => Promise<void>;
  addProjectSource: (projectId: string, path: string) => Promise<void>;
  removeProjectSource: (projectId: string, path: string) => Promise<void>;
  setProjectTab: (tab: "chats" | "sources") => void;
  setActiveNavSection: (section: string) => void;
  setSearchQuery: (query: string) => void;
  toggleThinkMode: () => void;
  toggleWebSearch: () => void;
  setPowerTier: (tier: "light" | "medium" | "high") => void;
  setChatMode: (mode: "chat" | "cowork") => void;
  setModelPickerOpen: (open: boolean) => void;
  setProjectInstructions: (projectId: string, instructions: string) => void;
  setSelectedModel: (model: string, provider: string) => void;
  setSelectedCliAgent: (agentId: string | null) => void;
  setCliAgentModel: (agentId: string, model: string) => void;
  saveActiveMessages: (messages: ChatMessageItem[]) => Promise<void>;
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  conversations: [],
  projects: [{ id: "proj_general", name: "General", createdAt: Date.now() }],
  activeConversationId: null,
  activeProjectId: null,
  projectTab: "chats",
  activeNavSection: "chat",
  searchQuery: "",
  thinkMode: false,
  webSearchEnabled: false,
  powerTier: "medium",
  chatMode: "chat",
  isModelPickerOpen: false,
  isLoaded: false,
  selectedModel: "gemini-2.0-flash",
  selectedProvider: "gemini",
  selectedCliAgent: null,
  cliAgentModels: {
    agy: "gemini-2.0-flash",
    claude: "claude-3-7-sonnet",
    codex: "gpt-4o",
    opencode: "deepseek-coder",
  },
  projectInstructions: {},

  setSelectedModel: (model, provider) =>
    set({
      selectedModel: model,
      selectedProvider: provider,
      selectedCliAgent: null,
    }),
  setSelectedCliAgent: (agentId) => set({ selectedCliAgent: agentId }),
  setCliAgentModel: (agentId, model) =>
    set((s) => ({ cliAgentModels: { ...s.cliAgentModels, [agentId]: model } })),
  toggleWebSearch: () =>
    set((s) => ({ webSearchEnabled: !s.webSearchEnabled })),
  setPowerTier: (tier) => set({ powerTier: tier }),
  setChatMode: (mode) => set({ chatMode: mode }),
  setModelPickerOpen: (open) => set({ isModelPickerOpen: open }),
  setProjectInstructions: (projectId, instructions) =>
    set((s) => ({
      projectInstructions: {
        ...s.projectInstructions,
        [projectId]: instructions,
      },
    })),

  loadConversations: async () => {
    try {
      const file = await readNote(AGENT_CONVERSATIONS_PATH);
      const parsed = parseConversationsData(file.content);
      set({
        conversations: parsed.conversations,
        projects: parsed.projects,
        activeConversationId: parsed.activeConversationId,
        isLoaded: true,
      });
    } catch {
      const empty = parseConversationsData(null);
      set({
        conversations: empty.conversations,
        projects: empty.projects,
        activeConversationId: null,
        isLoaded: true,
      });
    }
  },

  selectConversation: (id) => {
    const conv = get().conversations.find((c) => c.id === id);
    set({
      activeConversationId: id,
      activeProjectId: conv?.projectId ?? null,
      activeNavSection: "chat",
    });
  },

  createNewConversation: async (title = "New Chat", projectId) => {
    const { conversations, projects, activeProjectId } = get();
    const targetProjId = projectId !== undefined ? projectId : activeProjectId;
    const newConv: AgentConversation = {
      id: `conv_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      title,
      projectId: targetProjId ?? null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messages: [],
    };
    const nextData = addOrUpdateConversation(
      { version: 1, activeConversationId: newConv.id, projects, conversations },
      newConv,
    );
    set({
      conversations: nextData.conversations,
      activeConversationId: newConv.id,
      activeNavSection: "chat",
    });
    await persistToVault(nextData, true);
    return newConv;
  },

  deleteConversation: async (id) => {
    const { conversations, projects, activeConversationId } = get();
    const nextData = deleteConversationHelper(
      { version: 1, activeConversationId, projects, conversations },
      id,
    );
    set({
      conversations: nextData.conversations,
      activeConversationId: nextData.activeConversationId,
    });
    await persistToVault(nextData, true);
  },

  renameConversation: async (id, title) => {
    const { conversations, projects, activeConversationId } = get();
    const target = conversations.find((c) => c.id === id);
    if (!target) return;
    const updated = {
      ...target,
      title: title.trim() || "Untitled",
      updatedAt: Date.now(),
    };
    const nextData = addOrUpdateConversation(
      { version: 1, activeConversationId, projects, conversations },
      updated,
    );
    set({ conversations: nextData.conversations });
    await persistToVault(nextData);
  },

  selectProject: (projectId) => {
    set({
      activeProjectId: projectId,
      activeConversationId: null,
      activeNavSection: "project",
      projectTab: "chats",
    });
  },

  createProject: async (name) => {
    const { projects, activeProjectId } = await handleCreateProject(
      get(),
      name,
    );
    set({ projects, activeProjectId, activeNavSection: "project" });
    return projects[projects.length - 1];
  },

  renameProject: async (id, name) => {
    const projects = await handleRenameProject(get(), id, name);
    set({ projects });
  },

  deleteProject: async (id) => {
    const res = await handleDeleteProject(get(), id);
    set(res);
  },

  assignProject: async (convId, projectId) => {
    const conversations = await handleAssignProject(get(), convId, projectId);
    set({ conversations });
  },

  addProjectSource: async (projectId, path) => {
    const projects = await handleProjectSource(get(), projectId, path, "add");
    set({ projects });
  },

  removeProjectSource: async (projectId, path) => {
    const projects = await handleProjectSource(
      get(),
      projectId,
      path,
      "remove",
    );
    set({ projects });
  },

  setProjectTab: (tab) => set({ projectTab: tab }),
  setActiveNavSection: (section) => set({ activeNavSection: section }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleThinkMode: () => set((s) => ({ thinkMode: !s.thinkMode })),

  saveActiveMessages: async (messages) => {
    const { conversations, projects, activeConversationId, activeProjectId } =
      get();
    const result = await saveActiveMessagesHelper(
      messages,
      conversations,
      projects,
      activeConversationId,
      activeProjectId,
    );
    set(result);
  },
}));
