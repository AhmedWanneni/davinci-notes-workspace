import { useState } from "react";
import {
  Plus,
  MagnifyingGlass,
  Lock,
  Info,
  Trash,
  Check,
} from "@phosphor-icons/react";
import { useAgentStore } from "./useAgentStore";
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
  const projectInstructions = useAgentStore((s) => s.projectInstructions);
  const setProjectInstructions = useAgentStore((s) => s.setProjectInstructions);

  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [instructionsText, setInstructionsText] = useState(
    projectInstructions[projectId] || "",
  );
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourcePath, setNewSourcePath] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const currentInstructions = projectInstructions[projectId];

  const handleSaveInstructions = () => {
    setProjectInstructions(projectId, instructionsText.trim());
    setIsEditingInstructions(false);
  };

  const handleAttachSource = () => {
    if (!newSourcePath.trim()) return;
    onAddSource(newSourcePath.trim());
    setNewSourcePath("");
    setShowAddSource(false);
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
      <section className={styles["context-panel__section"]}>
        <div className={styles["context-panel__section-header"]}>
          <h3 className={styles["context-panel__section-title"]}>
            Instructions
          </h3>
          <button
            type="button"
            className={styles["context-panel__icon-btn"]}
            onClick={() => setIsEditingInstructions((v) => !v)}
            aria-label="Edit instructions"
            title="Edit instructions"
          >
            <Plus size={14} weight="bold" />
          </button>
        </div>
        {isEditingInstructions ? (
          <div className={styles["context-panel__add-input-wrap"]}>
            <input
              type="text"
              className={styles["context-panel__input"]}
              placeholder="e.g. Always respond in bullet points..."
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveInstructions()}
              autoFocus
            />
            <button
              type="button"
              className={styles["context-panel__add-btn"]}
              onClick={handleSaveInstructions}
            >
              <Check size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <p className={styles["context-panel__subtitle"]}>
            {currentInstructions ||
              "Add instructions to tailor Claude's responses"}
          </p>
        )}
      </section>

      <section className={styles["context-panel__section"]}>
        <div className={styles["context-panel__section-header"]}>
          <h3 className={styles["context-panel__section-title"]}>Memory</h3>
          <div className={styles["context-panel__memory-meta"]}>
            <span className={styles["context-panel__badge"]}>
              <Lock size={11} weight="fill" /> Only you
            </span>
            <button
              type="button"
              className={styles["context-panel__text-btn"]}
              onClick={() =>
                alert(
                  "Sophia maintains persistent memory across your conversations.",
                )
              }
            >
              View memory
            </button>
          </div>
        </div>
        <p className={styles["context-panel__subtitle"]}>
          View and manage what Claude remembers from your chats.
        </p>
      </section>

      <section className={styles["context-panel__section"]}>
        <div className={styles["context-panel__section-header"]}>
          <h3 className={styles["context-panel__section-title"]}>Context</h3>
          <div className={styles["context-panel__section-actions"]}>
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
            <datalist id="vault-notes-context-list">
              {vaultNotes.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
            <button
              type="button"
              className={styles["context-panel__add-btn"]}
              onClick={handleAttachSource}
            >
              Add
            </button>
          </div>
        )}

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
