import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { applyThemeCss, restoreCachedBuiltinTheme } from "../../themes";

export function useCaptureTheme(): void {
  useEffect(() => {
    restoreCachedBuiltinTheme();
    let unlistenTheme: (() => void) | undefined;
    void listen<{ id: string | null; css?: string | null }>(
      "davinci-theme-changed",
      (event) => {
        applyThemeCss(event.payload.id, event.payload.css ?? null);
      },
    )
      .then((fn) => {
        unlistenTheme = fn;
      })
      .catch(() => {});

    return () => {
      unlistenTheme?.();
    };
  }, []);
}
