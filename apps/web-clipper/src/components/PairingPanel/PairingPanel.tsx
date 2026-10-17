import { Button, Input, Typography } from "@app/design-system";
import type { PairingSettingsController } from "../../pairing/usePairingSettings";
import styles from "./PairingPanel.module.scss";

export interface PairingPanelProps {
  controller: PairingSettingsController;
}

/**
 * The extension's pairing form (ADR-0173, open decision O5).
 *
 * Manual pairing: the user copies the port and the per-install token out of the
 * app's Web Clipper settings. Nothing is discovered and nothing is guessed, so
 * the panel shows both values back and lets them be replaced.
 */
export function PairingPanel({ controller }: PairingPanelProps) {
  const { loading, paired, saving, error, notice, portError, tokenError } =
    controller;

  return (
    <main className={styles["pairing-panel"]}>
      <header className={styles["pairing-panel__header"]}>
        <Typography variant="h1" size="base">
          Web Clipper
        </Typography>
        <Typography variant="text" size="sm" color="muted">
          Clip a page into your vault from the browser. In DaVinci Notes, open
          Settings, then Web Clipper, and switch it on: the panel there shows
          the port and the pairing token to copy here.
        </Typography>
      </header>

      {loading ? (
        <Typography variant="text" size="sm" color="muted" role="status">
          Reading the saved pairing…
        </Typography>
      ) : (
        <form
          className={styles["pairing-panel__form"]}
          onSubmit={(event) => {
            event.preventDefault();
            controller.save();
          }}
        >
          <div className={styles["pairing-panel__field"]}>
            <label
              className={styles["pairing-panel__label"]}
              htmlFor="clipper-port"
            >
              <Typography variant="text" size="sm" weight="medium">
                Port
              </Typography>
            </label>
            <Input
              id="clipper-port"
              size="sm"
              inputMode="numeric"
              variant={portError === undefined ? "default" : "error"}
              value={controller.port}
              onChange={(event) => controller.setPort(event.target.value)}
            />
            {portError === undefined ? null : (
              <Typography variant="text" size="xs" color="error" role="alert">
                {portError}
              </Typography>
            )}
          </div>

          <div className={styles["pairing-panel__field"]}>
            <label
              className={styles["pairing-panel__label"]}
              htmlFor="clipper-token"
            >
              <Typography variant="text" size="sm" weight="medium">
                Pairing token
              </Typography>
            </label>
            <Input
              id="clipper-token"
              size="sm"
              autoComplete="off"
              spellCheck={false}
              variant={tokenError === undefined ? "default" : "error"}
              value={controller.token}
              onChange={(event) => controller.setToken(event.target.value)}
            />
            {tokenError === undefined ? null : (
              <Typography variant="text" size="xs" color="error" role="alert">
                {tokenError}
              </Typography>
            )}
          </div>

          <div className={styles["pairing-panel__actions"]}>
            <Button type="submit" variant="primary" size="sm" disabled={saving}>
              {saving ? "Saving…" : "Save pairing"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!paired || saving}
              onClick={controller.clear}
            >
              Forget pairing
            </Button>
          </div>
        </form>
      )}

      {error === undefined ? null : (
        <Typography variant="text" size="sm" color="error" role="alert">
          {error}
        </Typography>
      )}

      {notice === undefined ? null : (
        <Typography
          variant="text"
          size="xs"
          color="muted"
          role="status"
          className={styles["pairing-panel__notice"]}
        >
          {notice}
        </Typography>
      )}

      <Typography variant="text" size="xs" color="muted">
        {paired
          ? "This extension sends clips to DaVinci Notes on this computer only. Nothing is sent anywhere else."
          : "Until this is paired, a clip can be downloaded as a Markdown file instead."}
      </Typography>
    </main>
  );
}
