import { useCallback, useEffect, useRef, useState } from "react";
import {
  DEFAULT_CLIPPER_PORT,
  parsePort,
  type ClipperPairing,
} from "./pairingStore";
import { defaultPairingDeps, type PairingDeps } from "./pairingDeps";

/**
 * Everything the pairing panel renders, in one object.
 *
 * The panel is presentational and this owns the state, so the panel can be
 * snapshotted from a literal in Storybook and every branch is reachable in a
 * test without touching extension storage.
 */
export interface PairingSettingsController {
  /** The stored pairing is still being read. */
  loading: boolean;
  /** A pairing is stored, so the popup can send clips. */
  paired: boolean;
  /** The port field, as typed. */
  port: string;
  /** The token field, as typed. */
  token: string;
  portError?: string;
  tokenError?: string;
  /** A save or a clear that could not be completed. */
  error?: string;
  /** Confirmation of the last completed save or clear. */
  notice?: string;
  saving: boolean;
  setPort(value: string): void;
  setToken(value: string): void;
  save(): void;
  clear(): void;
}

function messageFor(cause: unknown, fallback: string): string {
  return cause instanceof Error ? cause.message : fallback;
}

export function usePairingSettings(
  deps: PairingDeps = defaultPairingDeps,
): PairingSettingsController {
  const [loading, setLoading] = useState(true);
  const [paired, setPaired] = useState(false);
  const [port, setPortState] = useState(String(DEFAULT_CLIPPER_PORT));
  const [token, setTokenState] = useState("");
  const [portError, setPortError] = useState<string>();
  const [tokenError, setTokenError] = useState<string>();
  const [error, setError] = useState<string>();
  const [notice, setNotice] = useState<string>();
  const [saving, setSaving] = useState(false);

  // Read through a ref and run once: a re-created `deps` object must not trigger
  // a second read of the stored pairing.
  const depsRef = useRef(deps);
  depsRef.current = deps;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const stored = await depsRef.current.load();
        if (cancelled) return;
        if (stored !== undefined) {
          setPortState(String(stored.port));
          setTokenState(stored.token);
          setPaired(true);
        }
      } catch (cause) {
        if (cancelled) return;
        setError(messageFor(cause, "The saved pairing could not be read."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const setPort = useCallback((value: string) => {
    setPortState(value);
    setPortError(undefined);
    setNotice(undefined);
  }, []);

  const setToken = useCallback((value: string) => {
    setTokenState(value);
    setTokenError(undefined);
    setNotice(undefined);
  }, []);

  const save = useCallback(() => {
    const nextPort = parsePort(port);
    const nextToken = token.trim();
    setPortError(
      nextPort === undefined
        ? "Enter the port DaVinci Notes shows, for example 47912."
        : undefined,
    );
    setTokenError(
      nextToken.length === 0
        ? "Paste the pairing token from DaVinci Notes."
        : undefined,
    );
    setError(undefined);
    setNotice(undefined);
    if (nextPort === undefined || nextToken.length === 0) return;

    const pairing: ClipperPairing = { port: nextPort, token: nextToken };
    setSaving(true);
    void (async () => {
      try {
        await depsRef.current.save(pairing);
        setPaired(true);
        setNotice("Pairing saved. Clips now go straight to your vault.");
      } catch (cause) {
        setError(
          messageFor(cause, "The pairing could not be saved. Try again."),
        );
      } finally {
        setSaving(false);
      }
    })();
  }, [port, token]);

  const clear = useCallback(() => {
    setError(undefined);
    setNotice(undefined);
    setSaving(true);
    void (async () => {
      try {
        await depsRef.current.clear();
        setPaired(false);
        setTokenState("");
        setNotice("Pairing removed. Clips can still be downloaded.");
      } catch (cause) {
        setError(
          messageFor(cause, "The pairing could not be removed. Try again."),
        );
      } finally {
        setSaving(false);
      }
    })();
  }, []);

  return {
    loading,
    paired,
    port,
    token,
    portError,
    tokenError,
    error,
    notice,
    saving,
    setPort,
    setToken,
    save,
    clear,
  };
}
