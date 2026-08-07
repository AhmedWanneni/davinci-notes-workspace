import { useEffect, useRef, useState } from "react";
import { name as coreTypesName } from "@app/core-types";
import { Button, Typography } from "@app/design-system";
import styles from "./App.module.scss";
import {
  getVaultIndexDb,
  openAndIndexVault,
  openAndIndexVaultFromPicker,
  queryBacklinkSources,
  reconcileVaultChanges,
  subscribeVaultChanges,
  vaultWatchCoordinator,
} from "./vault";

const FIXTURE_VAULT = __FIXTURE_VAULT_PATH__;
const LARGE_FIXTURE_VAULT = __LARGE_FIXTURE_VAULT_PATH__;

export function App() {
  const [log, setLog] = useState<string[]>([]);
  const reconcileCount = useRef(0);

  const append = (line: string) => {
    setLog((prev) => [...prev.slice(-12), line]);
    console.info(`[vault] ${line}`);
  };

  useEffect(() => {
    let unlisten: (() => void) | undefined;

    subscribeVaultChanges(async (batch) => {
      if (!vaultWatchCoordinator.shouldProcessBatch()) {
        return;
      }
      reconcileCount.current += 1;
      append(
        `watcher batch #${reconcileCount.current}: +${batch.changed.length} ~${batch.removed.length} removed`,
      );
      const { updated } = await reconcileVaultChanges(batch);
      append(`reconciled ${updated} path(s) in SQLite`);
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      unlisten?.();
    };
  }, []);

  const openFixture = async () => {
    try {
      const result = await openAndIndexVault(FIXTURE_VAULT);
      append(
        `indexed ${result.noteCount} notes in ${result.elapsedMs} ms (${result.vaultPath})`,
      );
      const db = await getVaultIndexDb();
      const backlinks = await queryBacklinkSources(db, "projects/alpha.md");
      append(
        `backlinks → projects/alpha.md: ${backlinks.join(", ") || "(none)"}`,
      );
    } catch (error) {
      append(error instanceof Error ? error.message : String(error));
    }
  };

  const openLargeFixture = async () => {
    try {
      const result = await openAndIndexVault(LARGE_FIXTURE_VAULT);
      append(
        `large vault: ${result.noteCount} notes in ${result.elapsedMs} ms`,
      );
    } catch (error) {
      append(error instanceof Error ? error.message : String(error));
    }
  };

  const openPicker = async () => {
    try {
      const result = await openAndIndexVaultFromPicker();
      append(`opened ${result.vaultPath}`);
      append(`indexed ${result.noteCount} notes in ${result.elapsedMs} ms`);
    } catch (error) {
      append(error instanceof Error ? error.message : String(error));
    }
  };

  return (
    <main className={styles.shell}>
      <section className={styles.content}>
        <Typography variant="h1" size="2xl">
          DaVinci Notes
        </Typography>
        <Typography variant="text" color="muted">
          Phase 5 vault I/O — {coreTypesName}, indexer wired via IPC (debug
          only).
        </Typography>
        <div className={styles.actions}>
          <Button variant="primary" onClick={() => void openFixture()}>
            Open fixture vault &amp; index
          </Button>
          <Button variant="secondary" onClick={() => void openLargeFixture()}>
            Index large fixture (350 notes)
          </Button>
          <Button variant="secondary" onClick={() => void openPicker()}>
            Pick folder &amp; index
          </Button>
        </div>
        {log.length > 0 && <pre className="debug-log">{log.join("\n")}</pre>}
      </section>
    </main>
  );
}
