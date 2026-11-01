import { useState, useCallback, type JSX } from "react";
import {
  CaretDown,
  CaretRight,
  Folder,
  Plus,
  Tag,
  UserPlus,
} from "@phosphor-icons/react";
import type { TodoWorkspace } from "./types";
import styles from "./TodosSidebar.module.scss";

export interface TodosSidebarProps {
  workspaces: TodoWorkspace[];
  selectedWorkspace: string;
  selectedProjectId: string;
  onSelectProject: (workspace: string, projectId: string) => void;
  onCreateProject: (workspace: string, name: string) => void;
}

export function TodosSidebar({
  workspaces,
  selectedWorkspace,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
}: TodosSidebarProps): JSX.Element {
  const [isWsOpen, setIsWsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);
  const [newProjectWs, setNewProjectWs] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState("");

  const handleCreateSubmit = useCallback(
    (wsName: string) => {
      if (newProjectName.trim()) {
        onCreateProject(wsName, newProjectName.trim());
        setNewProjectName("");
        setNewProjectWs(null);
      }
    },
    [newProjectName, onCreateProject],
  );

  return (
    <aside className={styles["todos-sidebar"]} data-testid="todos-sidebar">
      <div className={styles["todos-sidebar__section"]}>
        <div
          className={styles["todos-sidebar__header"]}
          onClick={() => setIsWsOpen((v) => !v)}
        >
          <div className={styles["todos-sidebar__header-title"]}>
            {isWsOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
            <span>Workspaces</span>
          </div>
          <button
            type="button"
            className={styles["todos-sidebar__add-btn"]}
            onClick={(e) => {
              e.stopPropagation();
              setNewProjectWs("Design");
            }}
            title="Add Project"
            aria-label="Add project to workspace"
          >
            <Plus size={14} />
          </button>
        </div>

        {isWsOpen && (
          <div className={styles["todos-sidebar__list"]}>
            {workspaces.map((ws) => (
              <div key={ws.name}>
                <div className={styles["todos-sidebar__item"]} style={{ fontWeight: 600 }}>
                  <Folder size={16} weight="fill" />
                  <span>{ws.name}</span>
                </div>
                <div style={{ paddingLeft: "16px" }}>
                  {ws.projects.map((p) => {
                    const isActive = p.id === selectedProjectId || (!selectedProjectId && ws.name === selectedWorkspace);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={`${styles["todos-sidebar__item"]} ${isActive ? styles["is-active"] : ""}`}
                        onClick={() => onSelectProject(ws.name, p.id)}
                      >
                        <Folder size={14} />
                        <span>{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {newProjectWs && (
              <div style={{ padding: "4px 8px" }}>
                <input
                  type="text"
                  placeholder="Project name..."
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateSubmit(newProjectWs);
                    if (e.key === "Escape") setNewProjectWs(null);
                  }}
                  autoFocus
                  style={{ width: "100%", padding: "4px", fontSize: "12px" }}
                />
              </div>
            )}

            <button
              type="button"
              className={styles["todos-sidebar__action-link"]}
              onClick={() => setNewProjectWs(selectedWorkspace || "Design")}
            >
              <Plus size={14} />
              <span>Add Project</span>
            </button>
          </div>
        )}
      </div>

      <div className={styles["todos-sidebar__section"]}>
        <div
          className={styles["todos-sidebar__header"]}
          onClick={() => setIsProjectsOpen((v) => !v)}
        >
          <div className={styles["todos-sidebar__header-title"]}>
            {isProjectsOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
            <span>Projects</span>
          </div>
          <button
            type="button"
            className={styles["todos-sidebar__add-btn"]}
            onClick={(e) => {
              e.stopPropagation();
              setNewProjectWs("Projects");
            }}
            title="Add Project"
            aria-label="Add project"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className={styles["todos-sidebar__section"]}>
        <div
          className={styles["todos-sidebar__header"]}
          onClick={() => setIsLabelsOpen((v) => !v)}
        >
          <div className={styles["todos-sidebar__header-title"]}>
            {isLabelsOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
            <Tag size={14} />
            <span>Labels</span>
          </div>
          <button
            type="button"
            className={styles["todos-sidebar__add-btn"]}
            title="Add Label"
            aria-label="Add label"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <div className={styles["todos-sidebar__footer"]}>
        <button type="button" className={styles["todos-sidebar__action-link"]}>
          <UserPlus size={14} />
          <span>Invite Members</span>
        </button>
      </div>
    </aside>
  );
}
