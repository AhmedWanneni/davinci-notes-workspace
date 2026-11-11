import { create } from "zustand";
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
import {
  getInitialAgentChoice,
  persistAgentChoice,
  loadAgentChoiceFromDb,
} from "./agentUserChoicePersistence";
import {
  handleCreateConversation,
  handleDeleteConversation,
  handleRenameConversation,
} from "./agentConversationActions";
import type { AgentStoreState } from "./agentStoreTypes";

export type { AgentStoreState };

const initialChoice = getInitialAgentChoice();

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
  selectedModel: initialChoice.selectedModel,
  selectedProvider: initialChoice.selectedProvider,
  selectedCliAgent: initialChoice.selectedCliAgent,
  cliAgentModels: {
    agy: "gemini-2.0-flash",
    claude: "claude-3-7-sonnet",
    codex: "gpt-4o",
    opencode: "deepseek-coder",
  },
  projectInstructions: {},
  pendingPromptText: null,

  setSelectedModel: (model, provider) => {
    set({
      selectedModel: model,
      selectedProvider: provider,
      selectedCliAgent: null,
    });
    void persistAgentChoice({
      selectedModel: model,
      selectedProvider: provider,
      selectedCliAgent: null,
    });
  },
  setSelectedCliAgent: (agentId) => {
    set({ selectedCliAgent: agentId });
    void persistAgentChoice({ selectedCliAgent: agentId });
  },
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
    const [data, dbChoice] = await Promise.all([
      loadAgentData(),
      loadAgentChoiceFromDb(),
    ]);
    const current = get();
    set({
      ...data,
      selectedCliAgent:
        dbChoice.selectedCliAgent !== undefined
          ? dbChoice.selectedCliAgent
          : current.selectedCliAgent,
    });
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
    const res = await handleCreateConversation(get(), title, projectId);
    set({
      conversations: res.conversations,
      activeConversationId: res.activeConversationId,
      activeProjectId: res.activeProjectId,
      activeNavSection: "chat",
    });
    return res.newConv;
  },

  deleteConversation: async (id) => {
    const res = await handleDeleteConversation(get(), id);
    set({
      conversations: res.conversations,
      activeConversationId: res.activeConversationId,
    });
  },

  renameConversation: async (id, title) => {
    const conversations = await handleRenameConversation(get(), id, title);
    set({ conversations });
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
