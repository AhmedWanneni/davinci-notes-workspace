import { useState, useRef } from "react";
import {
  Plus,
  MagnifyingGlass,
  Lock,
  Info,
  Trash,
  UploadSimple,
} from "@phosphor-icons/react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { createDesktopMutationBackend } from "./desktopAgentBridge";
import { AgentProjectInstructionsSection } from "./AgentProjectInstructionsSection";
import styles from "./AgentProjectContextPanel.module.scss";

export interface AgentProjectContextPanelProps {
  projectId: string;
  projectName?: string;
  sources: string[];
  vaultNotes?: string[];
  onAddSource: (notePath: string) => void;
  onRemoveSource: (notePath: string) => void;
}

export function AgentProjectContextPanel({
  projectId,
  projectName,
  sources,
  vaultNotes = [],
  onAddSource,
  onRemoveSource,
}: AgentProjectContextPanelProps) {
  const storeNotes = useWorkspaceStore((s) => s.allNotePaths);
  const availableNotes = vaultNotes.length > 0 ? vaultNotes : storeNotes;

  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourcePath, setNewSourcePath] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  const handleAttachSource = () => {
    if (!newSourcePath.trim()) return;
    onAddSource(newSourcePath.trim());
    setNewSourcePath("");
    setShowAddSource(false);
  };

  const handleUploadContextFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const text = (ev.target?.result as string) || "";
        const savePath = `.sophia/projects/${projectId}/context/${file.name}`;
        try {
          await createDesktopMutationBackend().writeNote(savePath, text);
          onAddSource(savePath);
        } catch {
          onAddSource(file.name);
        }
      };
      reader.readAsText(file);
    }
    e.target.value = "";
  };

  const capacityPercent = Math.max(1, Math.min(100, sources.length * 3));
  const activeSources =
    sources.length > 0 ? sources : [`Context of ${projectName || "project"}`];
  const filteredSources = searchFilter.trim()
    ? activeSources.filter((s) =>
        s.toLowerCase().includes(searchFilter.toLowerCase()),
      )
    : activeSources;

  return (
    <aside
      className={styles["context-panel"]}
      aria-label="Project context and instructions"
    >
      <input
        ref={uploadInputRef}
        type="file"
        multiple
        style={{ display: "none" }}
        onChange={handleUploadContextFile}
      />

      <AgentProjectInstructionsSection projectId={projectId} />

      <section className={styles["context-panel__section"]}>
        <div className={styles["context-panel__section-header"]}>
          <h3 className={styles["context-panel__section-title"]}>Memory</h3>
          <div className={styles["context-panel__memory-meta"]}>
            <span className={styles["context-panel__badge"]}>
              <Lock size={11} weight="fill" /> Isolated to project
            </span>
          </div>
        </div>
        <p className={styles["context-panel__subtitle"]}>
          Context and memory in {projectName || "this project"} are isolated
          and shared across all chats in this project.
        </p>
      </section>

      <section className={styles["context-panel__section"]}>
        <div className={styles["context-panel__section-header"]}>
          <h3 className={styles["context-panel__section-title"]}>Context</h3>
          <div className={styles["context-panel__section-actions"]}>
            <button
              type="button"
              className={styles["context-panel__icon-btn"]}
              onClick={() => uploadInputRef.current?.click()}
              aria-label="Upload context file"
              title="Upload file into project context"
            >
              <UploadSimple size={14} weight="bold" />
            </button>
            <button
              type="button"
              className={styles["context-panel__icon-btn"]}
              onClick={() => setShowSearch((v) => !v)}
              aria-label="Search context"
              title="Search context"
            >
              <MagnifyingGlass size={14} />
            </button>
            <button
              type="button"
              className={styles["context-panel__icon-btn"]}
              onClick={() => setShowAddSource((v) => !v)}
              aria-label="Add note to context"
              title="Add note to context"
            >
              <Plus size={14} weight="bold" />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className={styles["context-panel__add-input-wrap"]}>
            <input
              type="text"
              className={styles["context-panel__input"]}
              placeholder="Filter context files..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {showAddSource && (
          <div className={styles["context-panel__add-input-wrap"]}>
            <input
              type="text"
              className={styles["context-panel__input"]}
              placeholder="Select note (e.g. Work/Design.md)..."
              value={newSourcePath}
              onChange={(e) => setNewSourcePath(e.target.value)}
              list="vault-notes-context-list"
              autoFocus
            />
            <button
              type="button"
              className={styles["context-panel__add-btn"]}
              onClick={handleAttachSource}
            >
              Add
            </button>
          </div>
        )}

        <datalist id="vault-notes-context-list">
          {availableNotes.map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>

        <div className={styles["context-panel__capacity"]}>
          <div className={styles["context-panel__capacity-bar"]}>
            <div
              className={styles["context-panel__capacity-fill"]}
              style={{ width: `${capacityPercent}%` }}
            />
          </div>
          <div className={styles["context-panel__capacity-label"]}>
            <span>{capacityPercent}% of project capacity used</span>
            <Info size={13} weight="regular" />
          </div>
        </div>

        <div className={styles["context-panel__cards-grid"]}>
          {filteredSources.map((source) => {
            const fileName =
              source.split("/").pop()?.replace(/\.md$/, "") || source;
            return (
              <div key={source} className={styles["context-panel__card"]}>
                <span
                  className={styles["context-panel__card-title"]}
                  title={source}
                >
                  {fileName}
                </span>
                <div className={styles["context-panel__card-footer"]}>
                  <span className={styles["context-panel__card-size"]}>
                    6kB
                  </span>
                  <span className={styles["context-panel__card-badge"]}>
                    TEXT
                  </span>
                </div>
                <button
                  type="button"
                  className={styles["context-panel__card-delete"]}
                  onClick={() => onRemoveSource(source)}
                  aria-label={`Remove ${source}`}
                  title="Remove from context"
                >
                  <Trash size={12} />
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </aside>
  );
}
