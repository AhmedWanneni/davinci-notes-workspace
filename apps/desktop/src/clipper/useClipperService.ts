import { useEffect } from "react";
import { listen } from "@tauri-apps/api/event";
import { CLIPPER_EVENT, handleClipReceived } from "./handleClipReceived";
import type { ClipReceivedEvent } from "./applyClipToVault";

/**
 * Serve clips the listener hands to this window (ADR-0177).
 *
 * One event subscription for the app's lifetime: subscribing is what lets the
 * webview write a clip, and it costs nothing while the Web Clipper is disabled
 * because then nothing is bound to emit (ADR-0173). The write itself goes
 * through the canonical vault path, so this hook never touches the disk.
 */
export function useClipperService(): void {
  useEffect(() => {
    let disposed = false;
    let unlisten: (() => void) | undefined;

    void listen<ClipReceivedEvent>(CLIPPER_EVENT, (event) => {
      void handleClipReceived(event.payload);
    }).then((stop) => {
      if (disposed) {
        stop();
      } else {
        unlisten = stop;
      }
    });

    return () => {
      disposed = true;
      unlisten?.();
    };
  }, []);
}
