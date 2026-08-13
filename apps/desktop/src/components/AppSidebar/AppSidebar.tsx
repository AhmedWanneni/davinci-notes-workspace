import { Button, Typography } from "@app/design-system";
import { Gear } from "@phosphor-icons/react";
import { FileTree } from "../FileTree";
import styles from "../../App.module.scss";

export interface AppSidebarProps {
  vaultName: string;
  allNotePaths: string[];
  activeNotePath: string | null;
  dirtyNotes: Set<string>;
  log: string[];
  onCreateNote: () => void;
  onOpenGlobalGraph: () => void;
  onOpenSettings: () => void;
  onCloseVault: () => void;
  onNoteClick: (path: string) => void;
}

export function AppSidebar({
  vaultName,
  allNotePaths,
  activeNotePath,
  dirtyNotes,
  log,
  onCreateNote,
  onOpenGlobalGraph,
  onOpenSettings,
  onCloseVault,
  onNoteClick,
}: AppSidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles["sidebar-header"]}>
        <Typography variant="h3" size="lg" className={styles["sidebar-title"]}>
          {vaultName}
        </Typography>
        <div className={styles.actions}>
          <Button variant="primary" onClick={onCreateNote}>
            New Note
          </Button>
          <Button variant="secondary" onClick={onOpenGlobalGraph}>
            Global Graph
          </Button>
          <Button variant="secondary" onClick={onOpenSettings} title="Settings">
            <Gear size={16} />
          </Button>
          <Button variant="secondary" onClick={onCloseVault}>
            Close Vault
          </Button>
        </div>
      </div>
      <div className={styles["sidebar-content"]}>
        <FileTree
          paths={allNotePaths}
          activePath={activeNotePath}
          dirtyPaths={dirtyNotes}
          onNoteClick={onNoteClick}
        />
      </div>
      {log.length > 0 && (
        <pre className={styles["debug-log"]}>{log.join("\n")}</pre>
      )}
    </aside>
  );
}
