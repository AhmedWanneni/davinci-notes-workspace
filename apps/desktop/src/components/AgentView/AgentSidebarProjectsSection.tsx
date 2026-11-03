import { useState } from "react";
import { FolderOpen, FolderSimple, Plus, Trash } from "@phosphor-icons/react";
import type { AgentConversation, AgentProject } from "@app/ai-agent";
import styles from "./AgentSidebarPanel.module.scss";

export interface AgentSidebarProjectsSectionProps {
  projects: AgentProject[];
  conversations?: AgentConversation[];
  activeProjectId: string | null;
  activeConversationId: string | null;
  activeProjectChats: AgentConversation[];
  onSelectProject: (id: string) => void;
  onOpenProjectOverview: (id: string) => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onCreateProject: (name: string) => void;
  onCreateNewChatInProject?: (id: string) => void;
}

export function AgentSidebarProjectsSection({
  projects,
  conversations,
  activeProjectId,
  activeConversationId,
  activeProjectChats,
  onSelectProject,
  onOpenProjectOverview,
  onSelectConversation,
  onDeleteConversation,
  onCreateProject,
  onCreateNewChatInProject,
}: AgentSidebarProjectsSectionProps) {
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [newProjectPrompt, setNewProjectPrompt] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<
    Record<string, boolean>
  >({});

  const handleCreate = () => {
    const trimmed = newProjectName.trim();
    if (!trimmed) {
      setNewProjectPrompt(false);
      return;
    }
    onCreateProject(trimmed);
    setNewProjectName("");
    setNewProjectPrompt(false);
  };

  const toggleExpand = (id: string) => {
    const currentlySelected = activeProjectId === id;
    setExpandedProjects((prev) => {
      const currentVal = prev[id] ?? currentlySelected;
      return { ...prev, [id]: currentlySelected ? !currentVal : true };
    });
    onSelectProject(id);
  };

  const visibleProjects = showAllProjects ? projects : projects.slice(0, 6);

  return (
    <div className={styles["agent-sidebar__section"]}>
      <div className={styles["agent-sidebar__section-header"]}>
        <span className={styles["agent-sidebar__section-title"]}>Projects</span>
        <button
          type="button"
          className={styles["agent-sidebar__add-btn"]}
          onClick={() => setNewProjectPrompt(true)}
          aria-label="Add project"
          title="Add project"
        >
          <Plus size={13} weight="bold" />
        </button>
      </div>

      {newProjectPrompt && (
        <div className={styles["agent-sidebar__new-project-row"]}>
          <FolderOpen
            size={16}
            weight="regular"
            className={styles["agent-sidebar__new-project-icon"]}
          />
          <input
            type="text"
            className={styles["agent-sidebar__input-inline"]}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onBlur={handleCreate}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") {
                setNewProjectName("");
                setNewProjectPrompt(false);
              }
            }}
            placeholder="Project name..."
            autoFocus
          />
        </div>
      )}

      <div className={styles["agent-sidebar__list"]}>
        {visibleProjects.map((p) => {
          const isSelected = activeProjectId === p.id;
          const isExpanded = expandedProjects[p.id] ?? isSelected;
          const projectChats = conversations
            ? conversations.filter((c) => c.projectId === p.id)
            : isSelected
              ? activeProjectChats
              : [];
          const FolderIcon =
            isExpanded || isSelected ? FolderOpen : FolderSimple;

          return (
            <div key={p.id} className={styles["agent-sidebar__project-group"]}>
              <div className={styles["agent-sidebar__project-row-wrap"]}>
                <button
                  type="button"
                  className={`${styles["agent-sidebar__project-item"]} ${isSelected ? styles["is-active"] : ""}`}
                  onClick={() => toggleExpand(p.id)}
                >
                  <FolderIcon size={17} weight="regular" />
                  <span className={styles["agent-sidebar__item-name"]}>
                    {p.name}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles["agent-sidebar__project-add-chat-btn"]}
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedProjects((prev) => ({ ...prev, [p.id]: true }));
                    if (onCreateNewChatInProject) {
                      onCreateNewChatInProject(p.id);
                    } else {
                      onOpenProjectOverview(p.id);
                    }
                  }}
                  title={`New conversation in ${p.name}`}
                  aria-label={`New conversation in ${p.name}`}
                >
                  <Plus size={13} weight="bold" />
                </button>
              </div>

              {isExpanded && projectChats.length > 0 && (
                <div className={styles["agent-sidebar__project-nested"]}>
                  {projectChats.map((c) => (
                    <div
                      key={c.id}
                      className={styles["agent-sidebar__chat-nested-row"]}
                    >
                      <button
                        type="button"
                        className={`${styles["agent-sidebar__chat-nested-item"]} ${
                          c.id === activeConversationId
                            ? styles["is-active"]
                            : ""
                        }`}
                        onClick={() => onSelectConversation(c.id)}
                      >
                        <span className={styles["agent-sidebar__chat-title"]}>
                          {c.title}
                        </span>
                      </button>
                      <button
                        type="button"
                        className={styles["agent-sidebar__delete-chat-btn"]}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteConversation(c.id);
                        }}
                        title="Delete conversation"
                        aria-label={`Delete ${c.title}`}
                      >
                        <Trash size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {projects.length > 6 && (
        <button
          type="button"
          className={styles["agent-sidebar__show-more"]}
          onClick={() => setShowAllProjects((v) => !v)}
        >
          {showAllProjects ? "Show less" : "Show more"}
        </button>
      )}
    </div>
  );
}
