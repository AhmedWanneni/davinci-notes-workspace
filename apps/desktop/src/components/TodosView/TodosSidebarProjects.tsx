import { useState, useCallback, type JSX } from "react";
import {
  CaretDown,
  CaretRight,
  FileText,
  Folder,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import type { TodoProject, TodoViewMode } from "./types";
import styles from "./TodosSidebar.module.scss";

export interface TodosSidebarProjectsProps {
  projects: TodoProject[];
  selectedProjectId: string;
  selectedNotePath?: string;
  viewMode: TodoViewMode;
  onSelectProject: (projectId: string) => void;
  onSelectNote?: (projectId: string, notePath: string) => void;
  onCreateProject: (name: string) => void;
  onCreateTodoNote?: (projectFolderPath: string, name: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onDeleteNote?: (notePath: string) => void;
}

export function TodosSidebarProjects({
  projects,
  selectedProjectId,
  selectedNotePath,
  viewMode,
  onSelectProject,
  onSelectNote,
  onCreateProject,
  onCreateTodoNote,
  onDeleteProject,
  onDeleteNote,
}: TodosSidebarProjectsProps): JSX.Element {
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [addingNoteToProjectId, setAddingNoteToProjectId] = useState<string | null>(null);
  const [newNoteName, setNewNoteName] = useState("");

  const handleCreateProject = useCallback(() => {
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName("");
      setIsCreatingProject(false);
    }
  }, [newProjectName, onCreateProject]);

  const handleCreateNote = useCallback(
    (projectFolderPath: string) => {
      if (newNoteName.trim() && onCreateTodoNote) {
        onCreateTodoNote(projectFolderPath, newNoteName.trim());
        setNewNoteName("");
        setAddingNoteToProjectId(null);
      }
    },
    [newNoteName, onCreateTodoNote],
  );

  return (
    <div className={styles["todos-sidebar__section"]}>
      <div
        className={styles["todos-sidebar__header"]}
        onClick={() => setIsProjectsOpen((v) => !v)}
      >
        <div className={styles["todos-sidebar__header-title"]}>
          {isProjectsOpen ? <CaretDown size={14} /> : <CaretRight size={14} />}
          <span>Projects</span>
        </div>
      </div>

      {isProjectsOpen && (
        <div className={styles["todos-sidebar__list"]}>
          {projects.map((p) => {
            const isActive = viewMode === "project" && p.id === selectedProjectId;
            return (
              <div key={p.id} className={styles["todos-sidebar__project-group"]}>
                <div
                  role="button"
                  tabIndex={0}
                  className={`${styles["todos-sidebar__item"]} ${isActive ? styles["is-active"] : ""}`}
                  onClick={() => onSelectProject(p.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onSelectProject(p.id);
                  }}
                >
                  <Folder size={14} weight={isActive ? "fill" : "regular"} />
                  <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {p.name}
                  </span>

                  <div className={styles["todos-sidebar__actions"]}>
                    {onCreateTodoNote && (
                      <button
                        type="button"
                        className={styles["todos-sidebar__icon-btn"]}
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingNoteToProjectId(p.id);
                        }}
                        title="Add Todo note"
                        aria-label="Add todo note"
                      >
                        <Plus size={12} />
                      </button>
                    )}
                    {onDeleteProject && (
                      <button
                        type="button"
                        className={`${styles["todos-sidebar__icon-btn"]} ${styles["is-danger"]}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteProject(p.id);
                        }}
                        title="Delete Project"
                        aria-label={`Delete project ${p.name}`}
                      >
                        <Trash size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className={styles["todos-sidebar__sublist"]}>
                  {p.notes.map((note) => {
                    const isNoteActive = isActive && note.notePath === selectedNotePath;
                    return (
                      <div
                        key={note.id}
                        role="button"
                        tabIndex={0}
                        className={`${styles["todos-sidebar__subitem"]} ${isNoteActive ? styles["is-active"] : ""}`}
                        onClick={() => onSelectNote?.(p.id, note.notePath)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") onSelectNote?.(p.id, note.notePath);
                        }}
                      >
                        <FileText size={12} />
                        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {note.name}
                        </span>
                        {onDeleteNote && (
                          <div className={styles["todos-sidebar__actions"]}>
                            <button
                              type="button"
                              className={`${styles["todos-sidebar__icon-btn"]} ${styles["is-danger"]}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteNote(note.notePath);
                              }}
                              title="Delete note"
                              aria-label={`Delete note ${note.name}`}
                            >
                              <Trash size={11} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {addingNoteToProjectId === p.id && (
                    <div style={{ padding: "2px 0" }}>
                      <input
                        type="text"
                        placeholder="Note name... (Enter)"
                        value={newNoteName}
                        onChange={(e) => setNewNoteName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleCreateNote(p.folderPath);
                          if (e.key === "Escape") setAddingNoteToProjectId(null);
                        }}
                        autoFocus
                        style={{ width: "100%", padding: "2px 6px", fontSize: "11px" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isCreatingProject && (
            <div style={{ padding: "4px 8px" }}>
              <input
                type="text"
                placeholder="New project name... (Enter)"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateProject();
                  if (e.key === "Escape") setIsCreatingProject(false);
                }}
                autoFocus
                style={{ width: "100%", padding: "4px 8px", fontSize: "12px" }}
              />
            </div>
          )}

          <button
            type="button"
            className={styles["todos-sidebar__action-link"]}
            onClick={() => setIsCreatingProject(true)}
          >
            <Plus size={12} />
            <span>Add Project</span>
          </button>
        </div>
      )}
    </div>
  );
}
