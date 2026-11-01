import { useState } from "react";
import {
  Sparkle,
  MagnifyingGlass,
  SidebarSimple,
  NotePencil,
  Image as ImageIcon,
  Clock,
  Books,
  At,
  Code,
  DotsThree,
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
  { id: "images", label: "Images", icon: ImageIcon },
  { id: "scheduled", label: "Scheduled", icon: Clock },
  { id: "library", label: "Library", icon: Books },
  { id: "plugins", label: "Plugins", icon: At },
  { id: "codex", label: "Codex", icon: Code },
  { id: "explore", label: "Explore", icon: DotsThree },
];

export function AgentSidebarPanel({ onToggleSidebar }: AgentSidebarPanelProps) {
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
    void createNewConversation("New Chat", activeProjectId);
  };

  const filteredConversations = conversations.filter((c) =>
    searchQuery.trim()
      ? c.title.toLowerCase().includes(searchQuery.toLowerCase())
      : true,
  );

  const recentChats = filteredConversations.filter(
    (c) => !activeProjectId || c.projectId !== activeProjectId,
  );

  const activeProjectChats = activeProjectId
    ? filteredConversations.filter((c) => c.projectId === activeProjectId)
    : [];

  return (
    <aside className={styles["agent-sidebar"]} aria-label="AI Agent Sidebar">
      <header className={styles["agent-sidebar__header"]}>
        <div className={styles["agent-sidebar__brand"]}>
          <Sparkle
            size={18}
            weight="fill"
            className={styles["agent-sidebar__logo"]}
          />
          <span className={styles["agent-sidebar__title"]}>ChatGPT</span>
        </div>
        <div className={styles["agent-sidebar__header-actions"]}>
          <button
            type="button"
            className={styles["agent-sidebar__icon-btn"]}
            onClick={() => setShowSearch((v) => !v)}
            aria-label="Search chats"
            title="Search chats"
          >
            <MagnifyingGlass size={16} />
          </button>
          {onToggleSidebar && (
            <button
              type="button"
              className={styles["agent-sidebar__icon-btn"]}
              onClick={onToggleSidebar}
              aria-label="Close sidebar"
              title="Close sidebar"
            >
              <SidebarSimple size={16} />
            </button>
          )}
        </div>
      </header>

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
                const isActive = activeNavSection === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`${styles["agent-sidebar__nav-item"]} ${isActive ? styles["is-active"] : ""}`}
                    onClick={() => setActiveNavSection(item.id)}
                  >
                    <Icon size={16} weight="regular" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <AgentSidebarProjectsSection
              projects={projects}
              activeProjectId={activeProjectId}
              activeConversationId={activeConversationId}
              activeProjectChats={activeProjectChats}
              onSelectProject={(id) => selectProject(id)}
              onOpenProjectOverview={(id) => selectProject(id)}
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
