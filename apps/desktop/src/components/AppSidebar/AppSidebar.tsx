import { FilePlus } from "@phosphor-icons/react";
import { Tooltip, Typography } from "@app/design-system";
import { FileTree } from "../FileTree";

export interface AppSidebarProps {
  vaultName: string;
  allNotePaths: string[];
  activeNotePath: string | null;
  dirtyNotes: Set<string>;
  log: string[];
  isCollapsed?: boolean;
  onCreateNote: () => void;
  onNoteClick: (path: string) => void;
}

export function AppSidebar({
  vaultName,
  allNotePaths,
  activeNotePath,
  dirtyNotes,
  log,
  isCollapsed,
  onCreateNote,
  onNoteClick,
}: AppSidebarProps) {
  return (
    <aside
      className="app-sidebar"
      data-collapsed={isCollapsed || undefined}
      aria-label="File Explorer"
    >
      <div className="app-sidebar__header">
        <div className="app-sidebar__vault-title">
          <Typography
            variant="text"
            size="sm"
            weight="semibold"
            className="app-sidebar__title"
          >
            {vaultName}
          </Typography>
        </div>
        <div className="app-sidebar__header-actions">
          <Tooltip content="New note" contentProps={{ side: "bottom" }}>
            <button
              type="button"
              className="app-sidebar__action-btn"
              onClick={onCreateNote}
              aria-label="New note"
            >
              <FilePlus size={16} />
            </button>
          </Tooltip>
        </div>
      </div>

      <div className="app-sidebar__content">
        <FileTree
          paths={allNotePaths}
          activePath={activeNotePath}
          dirtyPaths={dirtyNotes}
          onNoteClick={onNoteClick}
        />
      </div>

      {log.length > 0 && <pre className="debug-log">{log.join("\n")}</pre>}
    </aside>
  );
}
