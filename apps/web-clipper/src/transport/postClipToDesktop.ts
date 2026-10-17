import type { ClipAck, ClipError, ClipPayload } from "@app/clipper-core";
import type { ClipperPairing } from "../pairing/pairingStore";

/**
 * The documented wire contract, mirrored in Rust (`clipper_routes.rs`).
 *
 * The request body is capped before it leaves the browser as well: the app
 * refuses anything over `MAX_BODY_BYTES` (`clipper_validate.rs`) with a 413, and
 * building a 5 MiB request only to have it refused is work nobody asked for.
 */
export const CLIPPER_CLIP_PATH = "/clipper/clip";
export const CLIPPER_MAX_BODY_BYTES = 2 * 1024 * 1024;

/**
 * Give up after this long.
 *
 * The app answers in well under a second when it is listening. The ceiling
 * exists for the case where something *else* holds the port and never replies:
 * the popup must not hang on it.
 */
export const CLIPPER_REQUEST_TIMEOUT_MS = 15_000;

/** Why a clip did not reach the vault, in the app's own vocabulary where possible. */
export type ClipDeliveryFailure =
  "not-paired" | "unreachable" | "timeout" | "queued" | ClipError;

export type ClipDelivery =
  | { delivered: true; path?: string }
  | { delivered: false; reason: ClipDeliveryFailure };

/** The slice of `fetch` this module uses, so tests need no real network. */
export interface ClipFetch {
  (url: string, init: ClipRequestInit): Promise<ClipResponse>;
}

export interface ClipRequestInit {
  method: string;
  headers: Record<string, string>;
  body: string;
  signal: AbortSignal;
}

export interface ClipResponse {
  status: number;
  json(): Promise<unknown>;
}

export function clipperClipUrl(port: number): string {
  return `http://127.0.0.1:${port}${CLIPPER_CLIP_PATH}`;
}

/**
 * The app's failure vocabulary for a status that arrived without a usable ack
 * body. A `404` or `405` means whatever is on the port is not our route, which
 * is "unreachable" from the user's point of view, not a payload problem.
 */
function failureForStatus(status: number): ClipDeliveryFailure {
  switch (status) {
    case 400:
      return "invalid-payload";
    case 401:
    case 403:
      return "unauthorized";
    case 409:
      return "vault-not-open";
    case 413:
      return "too-large";
    case 422:
      return "invalid-path";
    case 503:
      return "app-busy";
    default:
      return "unreachable";
  }
}

function isClipAck(value: unknown): value is ClipAck {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<ClipAck>;
  return (
    typeof candidate.clipId === "string" &&
    (candidate.status === "written" ||
      candidate.status === "queued" ||
      candidate.status === "rejected") &&
    (candidate.path === undefined || typeof candidate.path === "string") &&
    (candidate.error === undefined || typeof candidate.error === "string")
  );
}

/** Read the ack, or `undefined` when the body is not one. Never throws. */
async function readAck(response: ClipResponse): Promise<ClipAck | undefined> {
  try {
    const body: unknown = await response.json();
    return isClipAck(body) ? body : undefined;
  } catch {
    return undefined;
  }
}

/**
 * Hand one clip to the app over loopback (ADR-0173).
 *
 * Never throws: a failure is a value, because every failure here has a user-
 * facing explanation and the popup must keep the clip on screen rather than
 * unwind into an error boundary.
 *
 * The ack is trusted only when it names the clip that was sent, or names none
 * at all: the app leaves `clipId` empty when a request is refused before the
 * payload could be parsed (a bad token, a bad host, an oversized body), and
 * those refusals carry the reason. A reply naming a *different* clip is not
 * evidence that this clip was written, so it is reported as unreachable.
 */
export async function postClipToDesktop(
  pairing: ClipperPairing | undefined,
  payload: ClipPayload,
  fetchImpl: ClipFetch,
  timeoutMs: number = CLIPPER_REQUEST_TIMEOUT_MS,
): Promise<ClipDelivery> {
  if (pairing === undefined) return { delivered: false, reason: "not-paired" };

  const body = JSON.stringify(payload);
  if (new TextEncoder().encode(body).length > CLIPPER_MAX_BODY_BYTES) {
    return { delivered: false, reason: "too-large" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let response: ClipResponse;
  try {
    response = await fetchImpl(clipperClipUrl(pairing.port), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${pairing.token}`,
      },
      body,
      signal: controller.signal,
    });
  } catch {
    // Aborting is how the ceiling above fires; anything else is a refused
    // connection, which is the ordinary "the app is not running" case.
    return {
      delivered: false,
      reason: controller.signal.aborted ? "timeout" : "unreachable",
    };
  } finally {
    clearTimeout(timer);
  }

  const ack = await readAck(response);
  if (ack !== undefined && ack.clipId !== "" && ack.clipId !== payload.clipId) {
    return { delivered: false, reason: "unreachable" };
  }
  if (ack?.status === "written") return { delivered: true, path: ack.path };
  if (ack?.status === "queued") return { delivered: false, reason: "queued" };
  return {
    delivered: false,
    reason: ack?.error ?? failureForStatus(response.status),
  };
}
