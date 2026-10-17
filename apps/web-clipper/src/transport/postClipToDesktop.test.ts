import type { ClipPayload } from "@app/clipper-core";
import { describe, expect, it, vi } from "vitest";
import type { ClipperPairing } from "../pairing/pairingStore";
import {
  CLIPPER_MAX_BODY_BYTES,
  clipperClipUrl,
  postClipToDesktop,
  type ClipFetch,
  type ClipRequestInit,
  type ClipResponse,
} from "./postClipToDesktop";

const PAIRING: ClipperPairing = { port: 47912, token: "abc123" };

function payload(overrides: Partial<ClipPayload> = {}): ClipPayload {
  return {
    version: 1,
    clipId: "clip-1",
    capturedAt: "2026-10-17T09:05:07.000Z",
    mode: "full",
    templateId: "article",
    behavior: "create",
    target: { folder: "Clippings", noteName: "Probe Article.md" },
    source: { url: "https://probe.example/a", title: "Probe Article" },
    properties: {},
    tags: ["clippings"],
    body: "# Probe Article",
    contentHash: "3a1f",
    ...overrides,
  };
}

function respond(status: number, body: unknown): ClipResponse {
  return { status, json: async () => body };
}

/** A response whose body is not JSON at all — an ack that cannot be read. */
function unreadable(status: number): ClipResponse {
  return {
    status,
    json: async () => {
      throw new SyntaxError("Unexpected token < in JSON");
    },
  };
}

function capture(response: ClipResponse): {
  fetch: ClipFetch;
  calls: Array<{ url: string; init: ClipRequestInit }>;
} {
  const calls: Array<{ url: string; init: ClipRequestInit }> = [];
  return {
    calls,
    fetch: async (url, init) => {
      calls.push({ url, init });
      return response;
    },
  };
}

describe("postClipToDesktop", () => {
  it("posts the clip to the app's port with the pairing token", async () => {
    const { fetch, calls } = capture(
      respond(200, {
        clipId: "clip-1",
        status: "written",
        path: "Clippings/Probe Article.md",
      }),
    );

    const result = await postClipToDesktop(PAIRING, payload(), fetch);

    expect(result).toEqual({
      delivered: true,
      path: "Clippings/Probe Article.md",
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].url).toBe("http://127.0.0.1:47912/clipper/clip");
    expect(calls[0].init.method).toBe("POST");
    expect(calls[0].init.headers["Content-Type"]).toBe("application/json");
    expect(calls[0].init.headers.Authorization).toBe("Bearer abc123");
    expect(JSON.parse(calls[0].init.body)).toMatchObject({ clipId: "clip-1" });
  });

  it("treats a written ack with no path as delivered", async () => {
    const { fetch } = capture(
      respond(200, { clipId: "clip-1", status: "written" }),
    );

    await expect(postClipToDesktop(PAIRING, payload(), fetch)).resolves.toEqual(
      {
        delivered: true,
        path: undefined,
      },
    );
  });

  it("carries the app's own error code back", async () => {
    const { fetch } = capture(
      respond(422, {
        clipId: "clip-1",
        status: "rejected",
        error: "invalid-path",
      }),
    );

    await expect(postClipToDesktop(PAIRING, payload(), fetch)).resolves.toEqual(
      {
        delivered: false,
        reason: "invalid-path",
      },
    );
  });

  it("reads a rejection with no recorded clip as a refusal", async () => {
    // Rust leaves `clipId` empty when the request was refused before the payload
    // could be parsed; the error code is still the answer.
    const { fetch } = capture(
      respond(401, { clipId: "", status: "rejected", error: "unauthorized" }),
    );

    await expect(postClipToDesktop(PAIRING, payload(), fetch)).resolves.toEqual(
      {
        delivered: false,
        reason: "unauthorized",
      },
    );
  });

  it("does not trust an ack for a different clip", async () => {
    const { fetch } = capture(
      respond(200, {
        clipId: "some-other-clip",
        status: "written",
        path: "x.md",
      }),
    );

    await expect(postClipToDesktop(PAIRING, payload(), fetch)).resolves.toEqual(
      {
        delivered: false,
        reason: "unreachable",
      },
    );
  });

  it("falls back to the status when the body is not an ack", async () => {
    const { fetch } = capture(unreadable(503));

    await expect(postClipToDesktop(PAIRING, payload(), fetch)).resolves.toEqual(
      {
        delivered: false,
        reason: "app-busy",
      },
    );
  });

  it.each([
    [400, "invalid-payload"],
    [401, "unauthorized"],
    [403, "unauthorized"],
    [409, "vault-not-open"],
    [413, "too-large"],
    [422, "invalid-path"],
    [503, "app-busy"],
  ] as const)("maps a %i with no body to %s", async (status, reason) => {
    const { fetch } = capture(unreadable(status));

    await expect(postClipToDesktop(PAIRING, payload(), fetch)).resolves.toEqual(
      {
        delivered: false,
        reason,
      },
    );
  });

  it.each([404, 405, 500] as const)(
    "reads a %i as something that is not our app",
    async (status) => {
      const { fetch } = capture(unreadable(status));

      await expect(
        postClipToDesktop(PAIRING, payload(), fetch),
      ).resolves.toEqual({ delivered: false, reason: "unreachable" });
    },
  );

  it("reports a clip the app asked to hold, rather than calling it written", async () => {
    const { fetch } = capture(
      respond(200, { clipId: "clip-1", status: "queued" }),
    );

    await expect(postClipToDesktop(PAIRING, payload(), fetch)).resolves.toEqual(
      {
        delivered: false,
        reason: "queued",
      },
    );
  });

  it("does not knock at all when the extension is unpaired", async () => {
    const { fetch, calls } = capture(respond(200, {}));

    await expect(
      postClipToDesktop(undefined, payload(), fetch),
    ).resolves.toEqual({ delivered: false, reason: "not-paired" });
    expect(calls).toHaveLength(0);
  });

  it("reports a refused connection as the app not running", async () => {
    const fetch: ClipFetch = async () => {
      throw new TypeError("Failed to fetch");
    };

    await expect(postClipToDesktop(PAIRING, payload(), fetch)).resolves.toEqual(
      {
        delivered: false,
        reason: "unreachable",
      },
    );
  });

  it("gives up on an app that never answers", async () => {
    vi.useFakeTimers();
    try {
      const fetch: ClipFetch = (_url, init) =>
        new Promise<ClipResponse>((_resolve, reject) => {
          init.signal.addEventListener("abort", () =>
            reject(new Error("aborted")),
          );
        });

      const pending = postClipToDesktop(PAIRING, payload(), fetch, 500);
      await vi.advanceTimersByTimeAsync(500);

      await expect(pending).resolves.toEqual({
        delivered: false,
        reason: "timeout",
      });
    } finally {
      vi.useRealTimers();
    }
  });

  it("refuses an oversized clip without sending it", async () => {
    const { fetch, calls } = capture(respond(200, {}));
    const huge = payload({ body: "x".repeat(CLIPPER_MAX_BODY_BYTES + 1) });

    await expect(postClipToDesktop(PAIRING, huge, fetch)).resolves.toEqual({
      delivered: false,
      reason: "too-large",
    });
    expect(calls).toHaveLength(0);
  });

  it("builds the documented route", () => {
    expect(clipperClipUrl(47912)).toBe("http://127.0.0.1:47912/clipper/clip");
  });
});
