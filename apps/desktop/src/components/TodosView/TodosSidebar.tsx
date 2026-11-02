import { useState, useCallback, type JSX } from "react";
import {
  CaretDown,
  CaretRight,
  FileText,
  Folder,
  Layout,
  Plus,
  Trash,
} from "@phosphor-icons/react";
import type { TodoProject } from "./types";
import styles from "./TodosSidebar.module.scss";

export interface TodosSidebarProps {
  vaultName: string;
  projects: TodoProject[];
  selectedProjectId: string;
  selectedNotePath?: string;
  isMotherboard: boolean;
  totalTodosCount: number;
  onSelectProject: (projectId: string) => void;
  onSelectNote?: (projectId: string, notePath: string) => void;
  onSelectMotherboard: () => void;
  onCreateProject: (name: string) => void;
  onCreateTodoNote?: (projectFolderPath: string, name: string) => void;
  onDeleteProject?: (projectId: string) => void;
  onDeleteNote?: (notePath: string) => void;
}

export function TodosSidebar({
  vaultName,
  projects,
  selectedProjectId,
  selectedNotePath,
  isMotherboard,
  totalTodosCount,
  onSelectProject,
  onSelectNote,
  onSelectMotherboard,
  onCreateProject,
  onCreateTodoNote,
  onDeleteProject,
  onDeleteNote,
}: TodosSidebarProps): JSX.Element {
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [addingNoteToProjectId, setAddingNoteToProjectId] = useState<
    string | null
  >(null);
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
    <aside className={styles["todos-sidebar"]} data-testid="todos-sidebar">
      <div className={styles["todos-sidebar__top-nav"]}>
        <button
          type="button"
          className={`${styles["todos-sidebar__item"]} ${isMotherboard ? styles["is-active"] : ""}`}
          onClick={onSelectMotherboard}
        >
          <Layout size={16} weight={isMotherboard ? "fill" : "regular"} />
          <span style={{ flex: 1, fontWeight: 600 }}>Motherboard</span>
          <span className={styles["todos-sidebar__count"]}>
            {totalTodosCount}
          </span>
        </button>
      </div>

      <div className={styles["todos-sidebar__section"]}>
        <div
          className={styles["todos-sidebar__header"]}
          onClick={() => setIsProjectsOpen((v) => !v)}
        >
          <div className={styles["todos-sidebar__header-title"]}>
            {isProjectsOpen ? (
              <CaretDown size={14} />
            ) : (
              <CaretRight size={14} />
            )}
            <span>{vaultName || "Projects"}</span>
          </div>
          <button
            type="button"
            className={styles["todos-sidebar__add-btn"]}
            onClick={(e) => {
              e.stopPropagation();
              setIsCreatingProject(true);
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
                <div
                  key={p.id}
                  className={styles["todos-sidebar__project-group"]}
                >
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
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
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
                      const isNoteActive =
                        isActive && note.notePath === selectedNotePath;
                      return (
                        <div
                          key={note.id}
                          role="button"
                          tabIndex={0}
                          className={`${styles["todos-sidebar__subitem"]} ${isNoteActive ? styles["is-active"] : ""}`}
                          onClick={() => onSelectNote?.(p.id, note.notePath)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter")
                              onSelectNote?.(p.id, note.notePath);
                          }}
                        >
                          <FileText size={12} />
                          <span
                            style={{
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
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
                            if (e.key === "Enter")
                              handleCreateNote(p.folderPath);
                            if (e.key === "Escape")
                              setAddingNoteToProjectId(null);
                          }}
                          autoFocus
                          style={{
                            width: "100%",
                            padding: "2px 6px",
                            fontSize: "11px",
                          }}
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
                  style={{
                    width: "100%",
                    padding: "4px 8px",
                    fontSize: "12px",
                  }}
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
    </aside>
  );
}
