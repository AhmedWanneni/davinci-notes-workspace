import { useState } from "react";
import { name as coreTypesName } from "@app/core-types";
import { Button, Typography } from "@app/design-system";
import styles from "./App.module.scss";

export function App() {
  const [ready, setReady] = useState(false);

  return (
    <main className={styles.shell}>
      <section className={styles.content}>
        <Typography variant="h1" size="2xl">
          DaVinci Notes
        </Typography>
        <Typography variant="text" color="muted">
          Desktop shell wired to {coreTypesName} and @app/design-system.
        </Typography>
        <Button variant="primary" onClick={() => setReady((value) => !value)}>
          {ready ? "Shell verified" : "Verify shell"}
        </Button>
        {ready && (
          <Typography variant="text" color="accent" size="sm">
            Tokens, SCSS modules, and React primitives render through the Tauri
            webview.
          </Typography>
        )}
      </section>
    </main>
  );
}
