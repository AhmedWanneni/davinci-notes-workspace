import { describe, expect, it } from "vitest";
import { describeDeliveryFailure } from "./describeDeliveryFailure";
import type { ClipDeliveryFailure } from "./postClipToDesktop";

/**
 * Every reason the transport can produce. The record it reads from is typed
 * `Record<ClipDeliveryFailure, string>`, so a new reason fails the build rather
 * than reaching the popup as an empty line; this list keeps the *copy* honest.
 */
const REASONS: readonly ClipDeliveryFailure[] = [
  "not-paired",
  "unreachable",
  "timeout",
  "queued",
  "unauthorized",
  "too-large",
  "invalid-path",
  "invalid-payload",
  "vault-not-open",
  "duplicate",
  "app-busy",
];

describe("describeDeliveryFailure", () => {
  it("explains every failure the transport can report", () => {
    for (const reason of REASONS) {
      expect(describeDeliveryFailure(reason).length).toBeGreaterThan(0);
    }
  });

  it("does not reuse one explanation for two different failures", () => {
    const messages = REASONS.map(describeDeliveryFailure);
    expect(new Set(messages).size).toBe(REASONS.length);
  });

  it("says what to do about a missing pairing and a refused token", () => {
    expect(describeDeliveryFailure("not-paired")).toMatch(/pair/i);
    expect(describeDeliveryFailure("unauthorized")).toMatch(/token/i);
  });

  it("says the clip was not sent when the app is not reachable", () => {
    expect(describeDeliveryFailure("unreachable")).toMatch(/not sent/i);
    expect(describeDeliveryFailure("timeout")).toMatch(/not sent/i);
  });
});
