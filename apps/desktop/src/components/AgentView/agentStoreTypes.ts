import type { AgentConversation, AgentProject, LibraryItem } from "@app/ai-agent";
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
