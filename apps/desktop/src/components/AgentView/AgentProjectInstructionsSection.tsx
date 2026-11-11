import { useState, useEffect } from "react";
import { Plus, Check, FileArrowDown } from "@phosphor-icons/react";
import { useAgentStore } from "./useAgentStore";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { createDesktopMutationBackend } from "./desktopAgentBridge";
import styles from "./AgentProjectContextPanel.module.scss";

export interface AgentProjectInstructionsSectionProps {
  projectId: string;
}

export function AgentProjectInstructionsSection({
  projectId,
}: AgentProjectInstructionsSectionProps) {
  const projects = useAgentStore((s) => s.projects);
  const projectInstructions = useAgentStore((s) => s.projectInstructions);
  const setProjectInstructions = useAgentStore((s) => s.setProjectInstructions);

  const projectObj = projects.find((p) => p.id === projectId);
  const currentInstructions =
    projectInstructions[projectId] ?? projectObj?.instructions ?? "";

  const [isEditingInstructions, setIsEditingInstructions] = useState(false);
  const [instructionsText, setInstructionsText] = useState(currentInstructions);
  const [showImportVault, setShowImportVault] = useState(false);
  const [importNotePath, setImportNotePath] = useState("");

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

  return (
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
          <button
            type="button"
            className={styles["context-panel__add-btn"]}
            onClick={() => void handleImportFromVault()}
          >
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
          <button
            type="button"
            className={styles["context-panel__add-btn"]}
            onClick={handleSaveInstructions}
            aria-label="Save instructions"
          >
            <Check size={14} weight="bold" />
          </button>
        </div>
      ) : (
        <p className={styles["context-panel__subtitle"]}>
          {currentInstructions ||
            "Add instructions or import from vault to tailor responses for this project"}
        </p>
      )}
    </section>
  );
}
