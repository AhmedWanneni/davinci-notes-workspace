import { useState } from "react";
import {
  MagnifyingGlass,
  NotePencil,
  Clock,
  Books,
  X,
} from "@phosphor-icons/react";
import { useAgentStore } from "./useAgentStore";
import { AgentSidebarProjectsSection } from "./AgentSidebarProjectsSection";
import { AgentSidebarRecentsSection } from "./AgentSidebarRecentsSection";
import { AgentSidebarSearchResults } from "./AgentSidebarSearchResults";
import styles from "./AgentSidebarPanel.module.scss";

export interface AgentSidebarPanelProps {
  onToggleSidebar?: () => void;
}

const TOP_NAV_ITEMS = [
  { id: "search", label: "Search", icon: MagnifyingGlass },
  { id: "library", label: "Library", icon: Books },
  { id: "scheduled", label: "Scheduled", icon: Clock },
];

export function AgentSidebarPanel({
  onToggleSidebar: _onToggleSidebar,
}: AgentSidebarPanelProps) {
  const conversations = useAgentStore((s) => s.conversations);
  const projects = useAgentStore((s) => s.projects);
  const activeConversationId = useAgentStore((s) => s.activeConversationId);
  const activeProjectId = useAgentStore((s) => s.activeProjectId);
  const activeNavSection = useAgentStore((s) => s.activeNavSection);
  const searchQuery = useAgentStore((s) => s.searchQuery);

  const selectConversation = useAgentStore((s) => s.selectConversation);
  const createNewConversation = useAgentStore((s) => s.createNewConversation);
  const deleteConversation = useAgentStore((s) => s.deleteConversation);
  const selectProject = useAgentStore((s) => s.selectProject);
  const createProject = useAgentStore((s) => s.createProject);
  const setActiveNavSection = useAgentStore((s) => s.setActiveNavSection);
  const setSearchQuery = useAgentStore((s) => s.setSearchQuery);

  const [showSearch, setShowSearch] = useState(false);

  const handleStartNewChat = () => {
    // Preserve the active project so the new chat inherits project memory & context
    void createNewConversation("New Chat", activeProjectId ?? null);
    setActiveNavSection("chat");
  };

  const handleNavClick = (id: string) => {
    if (id === "search") {
      setShowSearch((v) => !v);
      return;
    }
    setActiveNavSection(id);
  };

  const filteredConversations = conversations.filter((c) =>
    searchQuery.trim()
      ? c.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  const recentChats = filteredConversations.filter((c) => !c.projectId);

  const activeProjectChats = activeProjectId
    ? filteredConversations.filter((c) => c.projectId === activeProjectId)
    : [];

  return (
    <aside className={styles["agent-sidebar"]} aria-label="AI Agent Sidebar">
      {showSearch && (
        <div className={styles["agent-sidebar__search-row"]}>
          <MagnifyingGlass
            size={13}
            className={styles["agent-sidebar__search-icon"]}
          />
          <input
            type="text"
            className={styles["agent-sidebar__search-input"]}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearchQuery("");
                setShowSearch(false);
              }
            }}
            placeholder="Search chats & messages..."
            autoFocus
          />
          {searchQuery && (
            <button
              type="button"
              className={styles["agent-sidebar__search-clear-btn"]}
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
            >
              <X size={11} weight="bold" />
            </button>
          )}
        </div>
      )}

      <div className={styles["agent-sidebar__scroll"]}>
        {searchQuery.trim() ? (
          <AgentSidebarSearchResults
            query={searchQuery}
            conversations={conversations}
            projects={projects}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => {
              selectConversation(id);
              setSearchQuery("");
            }}
          />
        ) : (
          <>
            <div className={styles["agent-sidebar__top-nav"]}>
              <button
                type="button"
                className={`${styles["agent-sidebar__nav-item"]} ${
                  activeNavSection === "chat" && !activeConversationId
                    ? styles["is-active"]
                    : ""
                }`}
                onClick={handleStartNewChat}
              >
                <NotePencil size={16} weight="regular" />
                <span>New chat</span>
              </button>
              {TOP_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.id === "search"
                    ? showSearch
                    : activeNavSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles["agent-sidebar__nav-item"]} ${isActive ? styles["is-active"] : ""}`}
                    onClick={() => handleNavClick(item.id)}
                  >
                    <Icon size={16} weight="regular" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <AgentSidebarProjectsSection
              projects={projects}
              conversations={filteredConversations}
              activeProjectId={activeProjectId}
              activeConversationId={activeConversationId}
              activeProjectChats={activeProjectChats}
              onSelectProject={(id) => selectProject(id)}
              onOpenProjectOverview={(id) => selectProject(id)}
              onCreateNewChatInProject={(id) => {
                void createNewConversation("New Chat", id);
                setActiveNavSection("chat");
              }}
              onSelectConversation={(id) => selectConversation(id)}
              onDeleteConversation={(id) => void deleteConversation(id)}
              onCreateProject={(name) => void createProject(name)}
            />

            <AgentSidebarRecentsSection
              recentChats={recentChats}
              activeConversationId={activeConversationId}
              onSelectConversation={(id) => selectConversation(id)}
              onDeleteConversation={(id) => void deleteConversation(id)}
            />
          </>
        )}
      </div>
    </aside>
  );
}
