import { invoke } from "@tauri-apps/api/core";
import type { ClipAck } from "@app/clipper-core";
import { applyClipToVault, type ClipReceivedEvent } from "./applyClipToVault";

/** Rust `clipper_dispatch::CLIPPER_EVENT`; the two must stay in step. */
export const CLIPPER_EVENT = "clipper:clip-received";

/**
 * The webview half of the receiver (ADR-0177): write the clip through the
 * canonical path, then report the outcome to the listener that is blocking on
 * it, so the HTTP response the extension receives is the real one.
 *
 * The ack is sent even when the write failed — Rust waits 20 s for it, and a
 * missing ack would be reported as `app-busy` regardless. A failed report is
 * only logged: the 20 s window may already have closed, and the clip is still
 * queued on the extension's side (ADR-0178), so nothing is lost.
 */
export async function handleClipReceived(
  event: ClipReceivedEvent,
): Promise<ClipAck> {
  const ack = await applyClipToVault(event);
  try {
    await invoke("clipper_submit_result", { ack });
  } catch (error) {
    console.warn(
      `[clipper] could not report clip ${ack.clipId} to the receiver:`,
      error,
    );
  }
  return ack;
}
