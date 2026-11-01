import { useState, useCallback, type JSX } from "react";
import {
  CaretDown,
  CaretRight,
  Folder,
  Layout,
  Plus,
  Tag,
} from "@phosphor-icons/react";
import type { TodoProject } from "./types";
import styles from "./TodosSidebar.module.scss";

export interface TodosSidebarProps {
  projects: TodoProject[];
  selectedProjectId: string;
  isMotherboard: boolean;
  totalTodosCount: number;
  onSelectProject: (projectId: string) => void;
  onSelectMotherboard: () => void;
  onCreateProject: (name: string, folder?: string) => void;
  onCreateFolder?: (name: string) => void;
}

export function TodosSidebar({
  projects,
  selectedProjectId,
  isMotherboard,
  totalTodosCount,
  onSelectProject,
  onSelectMotherboard,
  onCreateProject,
  onCreateFolder,
}: TodosSidebarProps): JSX.Element {
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isLabelsOpen, setIsLabelsOpen] = useState(false);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newName, setNewName] = useState("");

  const handleCreateProject = useCallback(() => {
    if (newName.trim()) {
      onCreateProject(newName.trim());
      setNewName("");
      setIsCreatingProject(false);
    }
  }, [newName, onCreateProject]);

  const handleCreateFolder = useCallback(() => {
    if (newName.trim() && onCreateFolder) {
      onCreateFolder(newName.trim());
      setNewName("");
      setIsCreatingFolder(false);
    }
  }, [newName, onCreateFolder]);

  return (
    <aside className={styles["todos-sidebar"]} data-testid="todos-sidebar">
      <div className={styles["todos-sidebar__top-nav"]}>
        <button
          type="button"
          className={`${styles["todos-sidebar__item"]} ${isMotherboard ? styles["is-active"] : ""}`}
          onClick={onSelectMotherboard}
        >
          <Layout size={16} weight={isMotherboard ? "fill" : "regular"} />
          <span style={{ flex: 1, fontWeight: 600 }}>Motherboard</span>
          <span className={styles["todos-sidebar__count"]}>{totalTodosCount}</span>
        </button>
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
              setIsCreatingProject(true);
              setIsCreatingFolder(false);
            }}
            title="Add Project"
            aria-label="Add project"
          >
            <Plus size={14} />
          </button>
        </div>

        {isProjectsOpen && (
          <div className={styles["todos-sidebar__list"]}>
            {projects.map((p) => {
              const isActive = !isMotherboard && p.id === selectedProjectId;
              return (
                <button
                  key={p.id}
                  type="button"
                  className={`${styles["todos-sidebar__item"]} ${isActive ? styles["is-active"] : ""}`}
                  onClick={() => onSelectProject(p.id)}
                >
                  <Folder size={14} weight={isActive ? "fill" : "regular"} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>
                  {p.folder && (
                    <span className={styles["todos-sidebar__folder-tag"]}>
                      {p.folder}
                    </span>
                  )}
                </button>
              );
            })}

            {isCreatingProject && (
              <div style={{ padding: "4px 8px" }}>
                <input
                  type="text"
                  placeholder="New project name... (Enter)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateProject();
                    if (e.key === "Escape") setIsCreatingProject(false);
                  }}
                  autoFocus
                  style={{ width: "100%", padding: "4px 8px", fontSize: "12px" }}
                />
              </div>
            )}

            {isCreatingFolder && (
              <div style={{ padding: "4px 8px" }}>
                <input
                  type="text"
                  placeholder="New folder in todos... (Enter)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCreateFolder();
                    if (e.key === "Escape") setIsCreatingFolder(false);
                  }}
                  autoFocus
                  style={{ width: "100%", padding: "4px 8px", fontSize: "12px" }}
                />
              </div>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className={styles["todos-sidebar__action-link"]}
                onClick={() => {
                  setIsCreatingProject(true);
                  setIsCreatingFolder(false);
                }}
              >
                <Plus size={12} />
                <span>Add Project</span>
              </button>
              <button
                type="button"
                className={styles["todos-sidebar__action-link"]}
                onClick={() => {
                  setIsCreatingFolder(true);
                  setIsCreatingProject(false);
                }}
              >
                <Plus size={12} />
                <span>Add Folder</span>
              </button>
            </div>
          </div>
        )}
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
        </div>
      </div>
    </aside>
  );
}
