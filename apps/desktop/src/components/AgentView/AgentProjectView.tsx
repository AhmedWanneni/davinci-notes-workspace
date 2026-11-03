import { useState, useRef, useEffect } from "react";
import { PushPin, DotsThree, Trash } from "@phosphor-icons/react";
import { AgentPromptBar } from "./AgentPromptBar";
import { AgentProjectContextPanel } from "./AgentProjectContextPanel";
import { useAgentStore } from "./useAgentStore";
import type { AgentShortcut } from "@app/ai-agent";
import styles from "./AgentProjectView.module.scss";

export interface AgentProjectViewProps {
  projectId: string;
  onSend: (prompt: string, images?: string[]) => void;
  shortcuts?: AgentShortcut[];
  isStreaming?: boolean;
  vaultNotes?: string[];
}

function formatRelativeTime(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function AgentProjectView({
  projectId,
  onSend,
  shortcuts = [],
  isStreaming = false,
  vaultNotes = [],
}: AgentProjectViewProps) {
  const projects = useAgentStore((s) => s.projects);
  const conversations = useAgentStore((s) => s.conversations);
  const selectConversation = useAgentStore((s) => s.selectConversation);
  const deleteConversation = useAgentStore((s) => s.deleteConversation);
  const deleteProject = useAgentStore((s) => s.deleteProject);
  const renameProject = useAgentStore((s) => s.renameProject);
  const addProjectSource = useAgentStore((s) => s.addProjectSource);
  const removeProjectSource = useAgentStore((s) => s.removeProjectSource);
  const pendingPromptText = useAgentStore((s) => s.pendingPromptText);
  const setPendingPromptText = useAgentStore((s) => s.setPendingPromptText);

  const [prompt, setPrompt] = useState("");
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pendingPromptText) {
      setPrompt((prev) =>
        prev ? `${prev}\n\n${pendingPromptText}` : pendingPromptText,
      );
      setPendingPromptText(null);
    }
  }, [pendingPromptText, setPendingPromptText]);

  useEffect(() => {
    if (!showMenu) return;
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [showMenu]);

  const project = projects.find((p) => p.id === projectId) ?? {
    id: projectId,
    name: "Project",
    createdAt: Date.now(),
    sources: [],
  };

  const projectChats = conversations.filter((c) => c.projectId === projectId);
  const sources = project.sources ?? [];

  const handleCreateChat = () => {
    if (!prompt.trim() || isStreaming) return;
    onSend(prompt.trim());
    setPrompt("");
  };

  const handleRename = () => {
    const nextName = window.prompt("Rename project:", project.name);
    if (nextName && nextName.trim()) {
      void renameProject(project.id, nextName.trim());
    }
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (window.confirm(`Delete project "${project.name}"?`)) {
      void deleteProject(project.id);
    }
    setShowMenu(false);
  };

  return (
    <div
      className={styles["project-view"]}
      role="region"
      aria-label={`Project: ${project.name}`}
    >
      <div className={styles["project-view__breadcrumbs"]}>
        <span className={styles["project-view__breadcrumb-link"]}>
          Projects
        </span>
        <span>/</span>
        <span>{project.name}</span>
      </div>

      <header className={styles["project-view__header"]}>
        <div className={styles["project-view__header-info"]}>
          <h1 className={styles["project-view__title"]}>{project.name}</h1>
          <p className={styles["project-view__subtitle"]}>
            my project in a tauri app like the obsidian note taking app
          </p>
        </div>

        <div className={styles["project-view__header-actions"]}>
          <button
            type="button"
            className={styles["project-view__icon-btn"]}
            aria-label="Pin project"
            title="Pin project"
          >
            <PushPin size={17} weight="bold" />
          </button>
          <div className={styles["project-view__menu-wrap"]} ref={menuRef}>
            <button
              type="button"
              className={styles["project-view__icon-btn"]}
              onClick={() => setShowMenu((v) => !v)}
              aria-label="More options"
            >
              <DotsThree size={18} weight="bold" />
            </button>
            {showMenu && (
              <div className={styles["project-view__menu"]}>
                <button type="button" onClick={handleRename}>
                  Rename
                </button>
                <button
                  type="button"
                  className={styles["is-danger"]}
                  onClick={handleDelete}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className={styles["project-view__layout"]}>
        <div className={styles["project-view__main"]}>
          <AgentPromptBar
            value={prompt}
            onChange={setPrompt}
            onSubmit={handleCreateChat}
            onSendWithImages={(text, imgs) => {
              if (isStreaming) return;
              if (imgs && imgs.length > 0) {
                onSend(text, imgs);
              } else {
                onSend(text);
              }
              setPrompt("");
            }}
            placeholder="How can I help you today?"
            shortcuts={shortcuts}
            isStreaming={isStreaming}
            variant="project"
            autoFocus
          />

          <h2 className={styles["project-view__recents-header"]}>Recents</h2>

          {projectChats.length === 0 ? (
            <div className={styles["project-view__empty-recents"]}>
              No recent chats in this project. Ask a question above to get
              started.
            </div>
          ) : (
            <div className={styles["project-view__chat-list"]}>
              {projectChats.map((chat) => (
                <div
                  key={chat.id}
                  className={styles["project-view__chat-row-wrap"]}
                >
                  <button
                    type="button"
                    className={styles["project-view__chat-row"]}
                    onClick={() => selectConversation(chat.id)}
                  >
                    <span className={styles["project-view__chat-title"]}>
                      {chat.title || "Untitled chat"}
                    </span>
                    <span className={styles["project-view__chat-time"]}>
                      {formatRelativeTime(chat.createdAt || Date.now())}
                    </span>
                  </button>
                  <button
                    type="button"
                    className={styles["project-view__delete-chat-btn"]}
                    onClick={(e) => {
                      e.stopPropagation();
                      void deleteConversation(chat.id);
                    }}
                    aria-label={`Delete ${chat.title}`}
                    title="Delete chat"
                  >
                    <Trash size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={styles["project-view__aside"]}>
          <AgentProjectContextPanel
            projectId={project.id}
            projectName={project.name}
            sources={sources}
            vaultNotes={vaultNotes}
            onAddSource={(s) => void addProjectSource(project.id, s)}
            onRemoveSource={(s) => void removeProjectSource(project.id, s)}
          />
        </div>
      </div>
    </div>
  );
}
