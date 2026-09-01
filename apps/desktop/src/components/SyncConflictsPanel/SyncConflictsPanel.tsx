import { FileText, WarningCircle, Trash } from "@phosphor-icons/react";
import { useCallback } from "react";
import { useWorkspaceStore } from "../../state/useWorkspaceStore";
import { findSyncthingConflictFiles } from "../../vault/syncthingConflicts";
import { deleteNoteInVault } from "../../vault/deleteNoteInVault";

export function SyncConflictsPanel() {
  const allNotePaths = useWorkspaceStore((state) => state.allNotePaths);
  const openNote = useWorkspaceStore((state) => state.openNote);
  const conflicts = findSyncthingConflictFiles(allNotePaths);

  const handleDeleteConflict = useCallback(async (conflictPath: string) => {
    try {
      await deleteNoteInVault(conflictPath);
    } catch (err) {
      console.error("Failed to delete conflict file:", err);
    }
  }, []);

  if (conflicts.length === 0) {
    return (
      <div className="sync-conflicts__empty" data-testid="sync-conflicts-empty">
        <p className="sync-conflicts__empty-text">
          No sync conflict files detected.
        </p>
      </div>
    );
  }

  return (
    <div className="sync-conflicts__panel" data-testid="sync-conflicts-panel">
      <div className="sync-conflicts__header">
        <WarningCircle size={16} className="sync-conflicts__header-icon" />
        <h4 className="sync-conflicts__title">
          Sync Conflicts ({conflicts.length})
        </h4>
      </div>
      <ul className="sync-conflicts__list">
        {conflicts.map((item) => (
          <li key={item.path} className="sync-conflicts__item">
            <div className="sync-conflicts__info">
              <span className="sync-conflicts__path">{item.filename}</span>
              {item.conflictDetails && (
                <span className="sync-conflicts__details">
                  {item.conflictDetails}
                </span>
              )}
            </div>
            <div className="sync-conflicts__actions">
              <button
                type="button"
                className="sync-conflicts__action-btn"
                title="Open conflict version"
                onClick={() => void openNote(item.path)}
              >
                <FileText size={14} /> Open Conflict
              </button>
              {item.originalPath !== item.path && (
                <button
                  type="button"
                  className="sync-conflicts__action-btn"
                  title="Open original version"
                  onClick={() => void openNote(item.originalPath)}
                >
                  Open Original
                </button>
              )}
              <button
                type="button"
                className="sync-conflicts__action-btn sync-conflicts__action-btn--delete"
                title="Delete conflict file"
                onClick={() => void handleDeleteConflict(item.path)}
              >
                <Trash size={14} /> Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
