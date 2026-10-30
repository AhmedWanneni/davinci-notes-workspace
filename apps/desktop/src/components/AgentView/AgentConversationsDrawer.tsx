import { useState } from "react";
import { Typography, Button, Input } from "@app/design-system";
import {
  ChatCircleDots,
  Plus,
  Trash,
  Folder,
  X,
  MagnifyingGlass,
  Check,
} from "@phosphor-icons/react";
import type { AgentConversation, AgentProject } from "@app/ai-agent";

export interface AgentConversationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: AgentConversation[];
  projects: AgentProject[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: (projectId?: string | null) => void;
  onDeleteConversation: (id: string) => void;
  onAddProject: (name: string) => void;
  onAssignProject: (conversationId: string, projectId: string | null) => void;
}

export function AgentConversationsDrawer({
  isOpen,
  onClose,
  conversations,
  projects,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onAddProject,
  onAssignProject,
}: AgentConversationsDrawerProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [assigningConvId, setAssigningConvId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    onAddProject(newProjectName.trim());
    setNewProjectName("");
    setIsAddingProject(false);
  };

  const filteredConversations = conversations.filter((c) => {
    const matchesProj = selectedProjectId === "all" || c.projectId === selectedProjectId;
    const matchesQuery = !searchQuery.trim() || c.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesProj && matchesQuery;
  });

  return (
    <aside className="agent-conv-drawer" role="region" aria-label="Previous Conversations & Projects">
      <div className="agent-conv-drawer__header">
        <div className="agent-conv-drawer__title-group">
          <ChatCircleDots size={18} weight="fill" />
          <Typography variant="text" size="base" weight="semibold">Conversations</Typography>
        </div>
        <div className="agent-conv-drawer__header-actions">
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNewConversation(selectedProjectId === "all" ? null : selectedProjectId)}
            title="Start new conversation"
          >
            <Plus size={14} weight="bold" /> New
          </Button>
          <button type="button" className="agent-conv-drawer__close-btn" onClick={onClose} aria-label="Close drawer">
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="agent-conv-drawer__search">
        <MagnifyingGlass size={14} className="agent-conv-drawer__search-icon" />
        <input
          type="text"
          className="agent-conv-drawer__search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search chats..."
          aria-label="Search conversations"
        />
      </div>

      <div className="agent-conv-drawer__projects-section">
        <div className="agent-conv-drawer__section-header">
          <Typography variant="text" size="xs" weight="semibold" color="muted">PROJECTS</Typography>
          {!isAddingProject && (
            <button
              type="button"
              className="agent-conv-drawer__add-project-btn"
              onClick={() => setIsAddingProject(true)}
              title="Add new project"
            >
              <Plus size={12} weight="bold" /> Project
            </button>
          )}
        </div>

        {isAddingProject && (
          <div className="agent-conv-drawer__add-project-row">
            <Input
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name..."
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            />
            <button type="button" className="agent-conv-drawer__mini-btn" onClick={handleCreateProject}>
              <Check size={13} />
            </button>
            <button type="button" className="agent-conv-drawer__mini-btn" onClick={() => setIsAddingProject(false)}>
              <X size={13} />
            </button>
          </div>
        )}

        <div className="agent-conv-drawer__project-chips">
          <button
            type="button"
            className={`agent-conv-drawer__project-chip${selectedProjectId === "all" ? " is-active" : ""}`}
            onClick={() => setSelectedProjectId("all")}
          >
            <span>All</span>
            <span className="agent-conv-drawer__chip-count">{conversations.length}</span>
          </button>
          {projects.map((proj) => (
            <button
              key={proj.id}
              type="button"
              className={`agent-conv-drawer__project-chip${selectedProjectId === proj.id ? " is-active" : ""}`}
              onClick={() => setSelectedProjectId(proj.id)}
            >
              <Folder size={12} />
              <span>{proj.name}</span>
              <span className="agent-conv-drawer__chip-count">
                {conversations.filter((c) => c.projectId === proj.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversations List */}
      <div className="agent-conv-drawer__list">
        {filteredConversations.length === 0 ? (
          <div className="agent-conv-drawer__empty">
            <Typography variant="text" size="xs" color="muted">
              {searchQuery ? "No matching conversations." : "No conversations in this project."}
            </Typography>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            const project = projects.find((p) => p.id === conv.projectId);

            return (
              <div
                key={conv.id}
                className={`agent-conv-item${isSelected ? " is-active" : ""}`}
                onClick={() => onSelectConversation(conv.id)}
                role="button"
                tabIndex={0}
              >
                <div className="agent-conv-item__main">
                  <div className="agent-conv-item__title">{conv.title}</div>
                  <div className="agent-conv-item__meta">
                    {project ? (
                      <span className="agent-conv-item__badge">{project.name}</span>
                    ) : (
                      <span className="agent-conv-item__date">
                        {new Date(conv.updatedAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                      </span>
                    )}
                    <span className="agent-conv-item__count">
                      {conv.messages.length} msg{conv.messages.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>

                <div className="agent-conv-item__actions" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    className="agent-conv-item__icon-btn"
                    onClick={() => setAssigningConvId(assigningConvId === conv.id ? null : conv.id)}
                    title="Change project"
                  >
                    <Folder size={13} />
                  </button>
                  <button
                    type="button"
                    className="agent-conv-item__icon-btn agent-conv-item__icon-btn--delete"
                    onClick={() => onDeleteConversation(conv.id)}
                    title="Delete conversation"
                  >
                    <Trash size={13} />
                  </button>
                </div>

                {assigningConvId === conv.id && (
                  <div className="agent-conv-item__project-menu" onClick={(e) => e.stopPropagation()}>
                    <div className="agent-conv-item__menu-label">Move to project:</div>
                    <button
                      type="button"
                      className="agent-conv-item__menu-opt"
                      onClick={() => {
                        onAssignProject(conv.id, null);
                        setAssigningConvId(null);
                      }}
                    >
                      (None)
                    </button>
                    {projects.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="agent-conv-item__menu-opt"
                        onClick={() => {
                          onAssignProject(conv.id, p.id);
                          setAssigningConvId(null);
                        }}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
