import { useState } from "react";
import { FolderSimple, Plus, Trash } from "@phosphor-icons/react";
import type { AgentConversation, AgentProject } from "@app/ai-agent";
import styles from "./AgentSidebarPanel.module.scss";

export interface AgentSidebarProjectsSectionProps {
  projects: AgentProject[];
  activeProjectId: string | null;
  activeConversationId: string | null;
  activeProjectChats: AgentConversation[];
  onSelectProject: (id: string) => void;
  onOpenProjectOverview: (id: string) => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onCreateProject: (name: string) => void;
}

export function AgentSidebarProjectsSection({
  projects,
  activeProjectId,
  activeConversationId,
  activeProjectChats,
  onSelectProject,
  onOpenProjectOverview,
  onSelectConversation,
  onDeleteConversation,
  onCreateProject,
}: AgentSidebarProjectsSectionProps) {
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [newProjectPrompt, setNewProjectPrompt] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [expandedProjects, setExpandedProjects] = useState<
    Record<string, boolean>
  >({});

  const handleCreate = () => {
    if (!newProjectName.trim()) return;
    onCreateProject(newProjectName.trim());
    setNewProjectName("");
    setNewProjectPrompt(false);
  };

  const toggleExpand = (id: string) => {
    setExpandedProjects((prev) => ({ ...prev, [id]: !prev[id] }));
    onSelectProject(id);
  };

  const visibleProjects = showAllProjects ? projects : projects.slice(0, 5);

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
          <input
            type="text"
            className={styles["agent-sidebar__input-inline"]}
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setNewProjectPrompt(false);
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
          return (
            <div key={p.id} className={styles["agent-sidebar__project-group"]}>
              <div className={styles["agent-sidebar__project-row-wrap"]}>
                <button
                  type="button"
                  className={`${styles["agent-sidebar__project-item"]} ${isSelected ? styles["is-active"] : ""}`}
                  onClick={() => toggleExpand(p.id)}
                >
                  <FolderSimple size={16} weight="regular" />
                  <span className={styles["agent-sidebar__item-name"]}>
                    {p.name}
                  </span>
                </button>
                <button
                  type="button"
                  className={styles["agent-sidebar__project-add-chat-btn"]}
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenProjectOverview(p.id);
                  }}
                  title={`New conversation in ${p.name}`}
                  aria-label={`New conversation in ${p.name}`}
                >
                  <Plus size={13} weight="bold" />
                </button>
              </div>

              {isExpanded && isSelected && (
                <div className={styles["agent-sidebar__project-nested"]}>
                  <button
                    type="button"
                    className={styles["agent-sidebar__chat-nested-add"]}
                    onClick={() => onOpenProjectOverview(p.id)}
                    title={`New conversation in ${p.name}`}
                  >
                    <Plus size={12} weight="bold" />
                    <span>New chat</span>
                  </button>
                  {activeProjectChats.length === 0 ? (
                    <span className={styles["agent-sidebar__empty-nested"]}>
                      No chats
                    </span>
                  ) : (
                    activeProjectChats.map((c) => (
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
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {projects.length > 5 && (
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
