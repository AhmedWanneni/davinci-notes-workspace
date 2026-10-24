import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button, Input, Toggle, Typography } from "@app/design-system";
import { SettingsCard } from "./SettingsCard";
import { SettingsRow } from "./SettingsRow";
import styles from "./SettingsDialog.module.scss";

/** Mirrors Rust `clipper_server::ClipperStatus`. */
export interface ClipperStatus {
  enabled: boolean;
  /** Bound port, or `null` while the listener is not running. */
  port: number | null;
  /** Whether a pairing token exists (it is created on first enable/reveal). */
  paired: boolean;
  /** The preferred port, shown before the listener has bound. */
  defaultPort: number;
}

const CONTROL_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "4px",
};

function describeError(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  return "The Web Clipper could not be updated.";
}

function connectionLabel(status: ClipperStatus): string {
  if (!status.enabled) return "Disabled";
  return status.port === null
    ? "Starting…"
    : `Listening on 127.0.0.1:${status.port}`;
}

/**
 * Web Clipper pairing (plan §5, Phase 3).
 *
 * Enabling binds a loopback listener; it stays unbound otherwise, so the disabled
 * state costs nothing (ADR-0173). The token is what pairs the extension with this
 * vault, and it is revealed only on request: the panel never shows it by default.
 */
export function ClipperSettingsSection() {
  const [status, setStatus] = useState<ClipperStatus | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let mounted = true;
    void invoke<ClipperStatus>("clipper_status")
      .then((next) => {
        if (mounted) setStatus(next);
      })
      .catch((err: unknown) => {
        if (mounted) setError(describeError(err));
      });
    return () => {
      mounted = false;
    };
  }, []);

  /** Run a command and settle into its outcome; never leaves the panel silent. */
  const run = useCallback(
    async <T,>(command: string): Promise<T | undefined> => {
      setBusy(true);
      try {
        const result = await invoke<T>(command);
        setError(null);
        return result;
      } catch (err: unknown) {
        setError(describeError(err));
        return undefined;
      } finally {
        setBusy(false);
      }
    },
    [],
  );

  const handleToggle = async (enabled: boolean) => {
    const next = await run<ClipperStatus>(
      enabled ? "clipper_enable" : "clipper_disable",
    );
    if (!next) return;
    setStatus(next);
    if (!enabled) setToken(null);
  };

  const handleReveal = async () => {
    const revealed = await run<string>("clipper_reveal_token");
    if (revealed === undefined) return;
    setToken(revealed);
    setCopied(false);
  };

  const handleRotate = async () => {
    const rotated = await run<string>("clipper_rotate_token");
    if (rotated === undefined) return;
    setToken(rotated);
    setCopied(false);
  };

  const handleRevoke = async () => {
    const next = await run<ClipperStatus>("clipper_revoke_token");
    if (!next) return;
    setStatus(next);
    setToken(null);
  };

  const handleCopy = async () => {
    if (!token) return;
    await navigator.clipboard.writeText(token);
    setCopied(true);
  };

  return (
    <div className={styles["settings-tab-content"]}>
      <SettingsCard title="Web Clipper">
        <SettingsRow
          title="Enable the Web Clipper"
          description="Accept clips from the browser extension over a loopback connection. Nothing is bound on this machine while this is off."
        >
          <Toggle
            checked={status?.enabled ?? false}
            disabled={busy || status === null}
            onCheckedChange={(checked) => void handleToggle(checked)}
            aria-label="Enable the Web Clipper"
          />
        </SettingsRow>

        <SettingsRow
          title="Connection"
          description="The extension sends clips to this address on this machine only."
        >
          <Typography variant="text" size="sm" color="muted">
            {status === null ? "Loading…" : connectionLabel(status)}
          </Typography>
        </SettingsRow>

        <SettingsRow
          title="Pairing token"
          description={
            token === null
              ? "The extension needs this token to pair with this vault. It is kept in the system keychain until you revoke it."
              : "Paste this into the extension. Rotating or revoking immediately stops this value working."
          }
        >
          <div style={CONTROL_STYLE}>
            {token === null ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => void handleReveal()}
              >
                Show token
              </Button>
            ) : (
              <>
                <Input
                  size="sm"
                  readOnly
                  value={token}
                  aria-label="Pairing token"
                />
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => void handleCopy()}
                >
                  {copied ? "Copied" : "Copy"}
                </Button>
              </>
            )}
            <Button
              variant="secondary"
              size="sm"
              disabled={busy || !status?.paired}
              onClick={() => void handleRotate()}
            >
              Rotate
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={busy || !status?.paired}
              onClick={() => void handleRevoke()}
            >
              Revoke
            </Button>
          </div>
        </SettingsRow>

        {error && (
          <span className={styles["settings-field-error"]} role="alert">
            {error}
          </span>
        )}
      </SettingsCard>
    </div>
  );
}
