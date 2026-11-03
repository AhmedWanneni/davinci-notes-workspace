import { create } from "zustand";
import {
  addOrUpdateConversation,
  deleteConversation as deleteConversationHelper,
  type AgentConversation,
  type AgentProject,
  type LibraryItem,
} from "@app/ai-agent";
import { persistToVault } from "./agentStorePersistence";
import { saveActiveMessagesHelper } from "./agentConversationSaver";
import {
  handleCreateProject,
  handleRenameProject,
  handleDeleteProject,
  handleProjectSource,
  handleAssignProject,
} from "./agentProjectActions";
import {
  DEFAULT_LIBRARY_ITEMS,
  handleAddOrUpdateLibraryItem,
  handleDeleteLibraryItem,
  handleSetProjectInstructions,
} from "./Library";
import { loadAgentData } from "./agentStoreLoader";
import type { ChatMessageItem } from "./agentTypes";

export interface AgentStoreState {
  conversations: AgentConversation[];
  projects: AgentProject[];
  libraryItems: LibraryItem[];
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
  pendingPromptText: string | null;

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
  setPendingPromptText: (text: string | null) => void;
  insertIntoActivePrompt: (text: string) => void;
  addOrUpdateLibraryItem: (item: LibraryItem) => Promise<void>;
  deleteLibraryItem: (id: string) => Promise<void>;
}

export const useAgentStore = create<AgentStoreState>((set, get) => ({
  conversations: [],
  projects: [{ id: "proj_general", name: "General", createdAt: Date.now() }],
  libraryItems: DEFAULT_LIBRARY_ITEMS,
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
  pendingPromptText: null,

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
  setPendingPromptText: (text) => set({ pendingPromptText: text }),
  insertIntoActivePrompt: (text) =>
    set((s) => ({
      pendingPromptText: s.pendingPromptText
        ? `${s.pendingPromptText}\n\n${text}`
        : text,
      activeNavSection: "chat",
    })),

  setProjectInstructions: (projectId, instructions) => {
    set((s) => ({
      projectInstructions: {
        ...s.projectInstructions,
        [projectId]: instructions,
      },
    }));
    void handleSetProjectInstructions(get(), projectId, instructions).then(
      (projects) => {
        set({ projects });
      },
    );
  },

  loadConversations: async () => {
    const data = await loadAgentData();
    set(data);
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
      {
        version: 1,
        activeConversationId: newConv.id,
        projects,
        conversations,
        libraryItems: get().libraryItems,
      },
      newConv,
    );
    set({
      conversations: nextData.conversations,
      activeConversationId: newConv.id,
      activeProjectId: targetProjId ?? null,
      activeNavSection: "chat",
    });
    await persistToVault(nextData, true);
    return newConv;
  },

  deleteConversation: async (id) => {
    const { conversations, projects, activeConversationId } = get();
    const nextData = deleteConversationHelper(
      {
        version: 1,
        activeConversationId,
        projects,
        conversations,
        libraryItems: get().libraryItems,
      },
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
      {
        version: 1,
        activeConversationId,
        projects,
        conversations,
        libraryItems: get().libraryItems,
      },
      updated,
    );
    set({ conversations: nextData.conversations });
    await persistToVault(nextData);
  },

  selectProject: (projectId) =>
    set({
      activeProjectId: projectId,
      activeConversationId: null,
      activeNavSection: "project",
      projectTab: "chats",
    }),

  createProject: async (name) => {
    const { projects, activeProjectId } = await handleCreateProject(
      get(),
      name,
    );
    set({ projects, activeProjectId, activeNavSection: "project" });
    return projects[projects.length - 1];
  },

  renameProject: async (id, name) =>
    set({ projects: await handleRenameProject(get(), id, name) }),
  deleteProject: async (id) => set(await handleDeleteProject(get(), id)),
  assignProject: async (convId, projectId) =>
    set({ conversations: await handleAssignProject(get(), convId, projectId) }),
  addProjectSource: async (projectId, path) =>
    set({ projects: await handleProjectSource(get(), projectId, path, "add") }),
  removeProjectSource: async (projectId, path) =>
    set({
      projects: await handleProjectSource(get(), projectId, path, "remove"),
    }),
  setProjectTab: (tab) => set({ projectTab: tab }),
  setActiveNavSection: (section) => set({ activeNavSection: section }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleThinkMode: () => set((s) => ({ thinkMode: !s.thinkMode })),

  addOrUpdateLibraryItem: async (item) =>
    set({ libraryItems: await handleAddOrUpdateLibraryItem(get(), item) }),
  deleteLibraryItem: async (id) =>
    set({ libraryItems: await handleDeleteLibraryItem(get(), id) }),

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
