import { useCallback, useEffect, useRef, useState } from "react";
import { browser } from "wxt/browser";

const ORIGINS = ["*://*/*"];

export interface HighlightingSettingsDeps {
  enabled(): Promise<boolean>;
  enable(): Promise<boolean>;
  disable(): Promise<void>;
}

const defaultDeps: HighlightingSettingsDeps = {
  enabled: () => browser.permissions.contains({ origins: ORIGINS }),
  enable: () => browser.permissions.request({ origins: ORIGINS }),
  disable: async () => {
    await browser.permissions.remove({ origins: ORIGINS });
  },
};

export interface HighlightingSettingsController {
  loading: boolean;
  enabled: boolean;
  changing: boolean;
  error?: string;
  setEnabled(enabled: boolean): void;
}

/** The broad browsing permission is optional and requested only from this switch. */
export function useHighlightingSettings(
  deps: HighlightingSettingsDeps = defaultDeps,
): HighlightingSettingsController {
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [changing, setChanging] = useState(false);
  const [error, setError] = useState<string>();
  const depsRef = useRef(deps);
  depsRef.current = deps;

  useEffect(() => {
    void depsRef.current
      .enabled()
      .then(setEnabled)
      .catch(() => setError("Highlight permission could not be read."))
      .finally(() => setLoading(false));
  }, []);

  const set = useCallback((next: boolean) => {
    setChanging(true);
    setError(undefined);
    void (async () => {
      try {
        if (next) {
          if (!(await depsRef.current.enable()))
            setError("Highlight access was not granted.");
          else setEnabled(true);
        } else {
          await depsRef.current.disable();
          setEnabled(false);
        }
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : "Highlight permission could not be changed.",
        );
      } finally {
        setChanging(false);
      }
    })();
  }, []);
  return { loading, enabled, changing, error, setEnabled: set };
}
