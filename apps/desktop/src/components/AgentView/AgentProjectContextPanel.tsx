import { useState, useEffect } from "react";
import {
  Plus,
  MagnifyingGlass,
  Lock,
  Info,
  Trash,
  Check,
  FileArrowDown,
} from "@phosphor-icons/react";
import { useAgentStore } from "./useAgentStore";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { createDesktopMutationBackend } from "./desktopAgentBridge";
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
  const projects = useAgentStore((s) => s.projects);
  const projectInstructions = useAgentStore((s) => s.projectInstructions);
  const setProjectInstructions = useAgentStore((s) => s.setProjectInstructions);
  const storeNotes = useWorkspaceStore((s) => s.allNotePaths);

  const availableNotes = vaultNotes.length > 0 ? vaultNotes : storeNotes;
  const projectObj = projects.find((p) => p.id === projectId);
  const currentInstructions =
    projectInstructions[projectId] ?? projectObj?.instructions ?? "";

  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [instructionsText, setInstructionsText] = useState(currentInstructions);
  const [showImportVault, setShowImportVault] = useState(false);
  const [importNotePath, setImportNotePath] = useState("");
  const [showAddSource, setShowAddSource] = useState(false);
  const [newSourcePath, setNewSourcePath] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    setInstructionsText(currentInstructions);
    setIsEditingInstructions(false);
    setShowImportVault(false);
    setImportNotePath("");
  }, [projectId, currentInstructions]);

  const handleSaveInstructions = () => {
    setProjectInstructions(projectId, instructionsText.trim());
    setIsEditingInstructions(false);
  };

  const handleImportFromVault = async () => {
    const targetPath = importNotePath.trim();
    if (!targetPath) return;
    let content = useWorkspaceStore.getState().notesContent?.[targetPath] || "";
    if (!content) {
      try {
        content = await createDesktopMutationBackend().readNote(targetPath);
      } catch {
        content = `# Imported from ${targetPath}`;
      }
    }
    const next = content.trim();
    setInstructionsText(next);
    setProjectInstructions(projectId, next);
    setImportNotePath("");
    setShowImportVault(false);
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
    <aside className={styles["context-panel"]} aria-label="Project context and instructions">
      <section className={styles["context-panel__section"]}>
        <div className={styles["context-panel__section-header"]}>
          <h3 className={styles["context-panel__section-title"]}>Instructions</h3>
          <div className={styles["context-panel__section-actions"]}>
            <button
              type="button"
              className={styles["context-panel__icon-btn"]}
              onClick={() => {
                setShowImportVault((v) => !v);
                setIsEditingInstructions(false);
              }}
              aria-label="Import instructions from vault"
              title="Import instructions from vault note"
            >
              <FileArrowDown size={14} weight="bold" />
            </button>
            <button
              type="button"
              className={styles["context-panel__icon-btn"]}
              onClick={() => {
                setIsEditingInstructions((v) => !v);
                setShowImportVault(false);
              }}
              aria-label="Edit instructions"
              title="Edit instructions"
            >
              <Plus size={14} weight="bold" />
            </button>
          </div>
        </div>

        {showImportVault && (
          <div className={styles["context-panel__add-input-wrap"]}>
            <input
              type="text"
              className={styles["context-panel__input"]}
              placeholder="Import note from vault (e.g. Rules/Agent.md)..."
              value={importNotePath}
              onChange={(e) => setImportNotePath(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void handleImportFromVault()}
              list="vault-notes-context-list"
              autoFocus
            />
            <button type="button" className={styles["context-panel__add-btn"]} onClick={() => void handleImportFromVault()}>
              Import
            </button>
          </div>
        )}

        {isEditingInstructions ? (
          <div className={styles["context-panel__add-input-wrap"]}>
            <textarea
              className={styles["context-panel__textarea"]}
              placeholder="e.g. Always respond in bullet points..."
              value={instructionsText}
              onChange={(e) => setInstructionsText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveInstructions();
                }
              }}
              rows={3}
              autoFocus
            />
            <button type="button" className={styles["context-panel__add-btn"]} onClick={handleSaveInstructions} aria-label="Save instructions">
              <Check size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <p className={styles["context-panel__subtitle"]}>
            {currentInstructions || "Add instructions or import from vault to tailor responses for this project"}
          </p>
        )}
      </section>

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
          Context and memory in {projectName || "this project"} are isolated and never shared with other conversations.
        </p>
      </section>

      <section className={styles["context-panel__section"]}>
        <div className={styles["context-panel__section-header"]}>
          <h3 className={styles["context-panel__section-title"]}>Context</h3>
          <div className={styles["context-panel__section-actions"]}>
            <button type="button" className={styles["context-panel__icon-btn"]} onClick={() => setShowSearch((v) => !v)} aria-label="Search context" title="Search context">
              <MagnifyingGlass size={14} />
            </button>
            <button type="button" className={styles["context-panel__icon-btn"]} onClick={() => setShowAddSource((v) => !v)} aria-label="Add note to context" title="Add note to context">
              <Plus size={14} weight="bold" />
            </button>
          </div>
        </div>

        {showSearch && (
          <div className={styles["context-panel__add-input-wrap"]}>
            <input type="text" className={styles["context-panel__input"]} placeholder="Filter context files..." value={searchFilter} onChange={(e) => setSearchFilter(e.target.value)} autoFocus />
          </div>
        )}

        {showAddSource && (
          <div className={styles["context-panel__add-input-wrap"]}>
            <input type="text" className={styles["context-panel__input"]} placeholder="Select note (e.g. Work/Design.md)..." value={newSourcePath} onChange={(e) => setNewSourcePath(e.target.value)} list="vault-notes-context-list" autoFocus />
            <button type="button" className={styles["context-panel__add-btn"]} onClick={handleAttachSource}>
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
            <div className={styles["context-panel__capacity-fill"]} style={{ width: `${capacityPercent}%` }} />
          </div>
          <div className={styles["context-panel__capacity-label"]}>
            <span>{capacityPercent}% of project capacity used</span>
            <Info size={13} weight="regular" />
          </div>
        </div>

        <div className={styles["context-panel__cards-grid"]}>
          {filteredSources.map((source) => {
            const fileName = source.split("/").pop()?.replace(/\.md$/, "") || source;
            return (
              <div key={source} className={styles["context-panel__card"]}>
                <span className={styles["context-panel__card-title"]} title={source}>{fileName}</span>
                <div className={styles["context-panel__card-footer"]}>
                  <span className={styles["context-panel__card-size"]}>6kB</span>
                  <span className={styles["context-panel__card-badge"]}>TEXT</span>
                </div>
                <button type="button" className={styles["context-panel__card-delete"]} onClick={() => onRemoveSource(source)} aria-label={`Remove ${source}`} title="Remove from context">
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
