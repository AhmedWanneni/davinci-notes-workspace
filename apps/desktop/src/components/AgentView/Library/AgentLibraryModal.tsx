import { useState, useEffect } from "react";
import type { AgentProject, LibraryItem, LibraryItemType } from "@app/ai-agent";
import { WindowDialog } from "../../WindowDialog";
import styles from "./AgentLibraryModal.module.scss";

export interface AgentLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: Partial<LibraryItem>) => void;
  initialItem?: LibraryItem | null;
  projects: AgentProject[];
  defaultProjectId?: string | null;
}

export function AgentLibraryModal({
  isOpen,
  onClose,
  onSave,
  initialItem,
  projects,
  defaultProjectId,
}: AgentLibraryModalProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<LibraryItemType>("prompt");
  const [projectId, setProjectId] = useState<string>("global");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  useEffect(() => {
    if (initialItem) {
      setTitle(initialItem.title || "");
      setType(initialItem.type || "prompt");
      setProjectId(initialItem.projectId || "global");
      setDescription(initialItem.description || "");
      setContent(initialItem.content || "");
    } else {
      setTitle("");
      setType("prompt");
      setProjectId(defaultProjectId || "global");
      setDescription("");
      setContent("");
    }
  }, [initialItem, defaultProjectId, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSave({
      id: initialItem?.id,
      title: title.trim(),
      type,
      projectId: projectId === "global" ? null : projectId,
      description: description.trim(),
      content: content.trim(),
    });
    onClose();
  };

  return (
    <WindowDialog
      isOpen={isOpen}
      onClose={onClose}
      title={initialItem ? "Edit Library Item" : "Create New Library Item"}
      size="md"
    >
      <form className={styles["library-modal__form"]} onSubmit={handleSubmit} style={{ padding: "16px 20px" }}>
          <div className={styles["library-modal__field"]}>
            <label className={styles["library-modal__label"]}>Type</label>
            <div className={styles["library-modal__type-group"]}>
              {(["prompt", "skill", "rule"] as LibraryItemType[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  className={`${styles["library-modal__type-btn"]} ${type === t ? styles["is-active"] : ""}`}
                  onClick={() => setType(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className={styles["library-modal__field"]}>
            <label className={styles["library-modal__label"]}>
              Project Scope
            </label>
            <select
              className={styles["library-modal__select"]}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
            >
              <option value="global">All Projects / Global</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className={styles["library-modal__field"]}>
            <label className={styles["library-modal__label"]}>Title</label>
            <input
              type="text"
              className={styles["library-modal__input"]}
              placeholder="e.g. Meeting Action Items..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div className={styles["library-modal__field"]}>
            <label className={styles["library-modal__label"]}>
              Description (Optional)
            </label>
            <input
              type="text"
              className={styles["library-modal__input"]}
              placeholder="Brief summary..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className={styles["library-modal__field"]}>
            <label className={styles["library-modal__label"]}>
              Content / Instructions / Prompt
            </label>
            <textarea
              className={styles["library-modal__textarea"]}
              placeholder="Enter prompt text or instructions..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
            />
          </div>

          <div className={styles["library-modal__footer"]}>
            <button
              type="button"
              className={styles["library-modal__cancel-btn"]}
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles["library-modal__save-btn"]}
              disabled={!title.trim() || !content.trim()}
            >
              Save Item
            </button>
          </div>
        </form>
    </WindowDialog>
  );
}
