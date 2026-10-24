import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClipPayload, ClipQueueEntry } from "@app/clipper-core";
import {
  isQueueEntryExpired,
  MAX_QUEUE_AGE_MS,
  MAX_QUEUE_BYTES,
  MAX_QUEUE_ENTRIES,
} from "@app/clipper-core";

const {
  createNoteInVaultMock,
  appendToNoteInVaultMock,
  resolveUniqueNotePathMock,
  getStateMock,
  invokeMock,
} = vi.hoisted(() => ({
  createNoteInVaultMock: vi.fn(),
  appendToNoteInVaultMock: vi.fn(),
  resolveUniqueNotePathMock: vi.fn(),
  getStateMock: vi.fn(),
  invokeMock: vi.fn(),
}));

vi.mock("@tauri-apps/api/core", () => ({
  invoke: (...args: unknown[]) => invokeMock(...args),
}));

vi.mock("../vault", () => ({
  createNoteInVault: (...args: unknown[]) => createNoteInVaultMock(...args),
  appendToNoteInVault: (...args: unknown[]) => appendToNoteInVaultMock(...args),
  resolveUniqueNotePath: (...args: unknown[]) =>
    resolveUniqueNotePathMock(...args),
}));

vi.mock("../state/useWorkspaceStore", () => ({
  useWorkspaceStore: { getState: () => getStateMock() },
}));

import { applyClipToVault } from "./applyClipToVault";

function adversarialPayload(
  id: string,
  overrides: Partial<ClipPayload> = {},
): ClipPayload {
  return {
    version: 1,
    clipId: id,
    capturedAt: "2026-10-17T09:05:07.000Z",
    mode: "full",
    templateId: "article",
    behavior: "create",
    target: { folder: "Clippings", noteName: `${id}.md` },
    source: { url: `https://example.com/${id}`, title: id },
    properties: {},
    tags: [],
    body: `# ${id}`,
    contentHash: `hash-${id}`,
    ...overrides,
  };
}

describe("clipperQueue adversarial verification (Phase 7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getStateMock.mockReturnValue({
      vaultPath: "/Users/test/Vault",
      allNotePaths: [],
    });
    resolveUniqueNotePathMock.mockImplementation(
      (_paths: string[], preferred: string) => preferred,
    );
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === "clipper_check_duplicate") return null;
      if (cmd === "clipper_record_written") return undefined;
      return null;
    });
    createNoteInVaultMock.mockImplementation(async (path: string) => path);
  });

  it("Check 1: enqueued clip delivered after launch is written once and recorded into dedupe ledger", async () => {
    const payload = adversarialPayload("c-launch-1");
    const result = await applyClipToVault({
      clipId: payload.clipId,
      payload,
      relativePath: "Clippings/c-launch-1.md",
    });

    expect(result.status).toBe("written");
    expect(result.path).toBe("Clippings/c-launch-1.md");
    expect(createNoteInVaultMock).toHaveBeenCalledTimes(1);
    expect(invokeMock).toHaveBeenCalledWith("clipper_record_written", {
      clipId: "c-launch-1",
      contentHash: "hash-c-launch-1",
      relativePath: "Clippings/c-launch-1.md",
    });
  });

  it("Check 2: replay of same clipId or contentHash is rejected as duplicate with no second file created", async () => {
    invokeMock.mockImplementation(async (cmd: string) => {
      if (cmd === "clipper_check_duplicate") {
        return "Clippings/Original.md";
      }
      return null;
    });

    const payload = adversarialPayload("c-duplicate");
    const result = await applyClipToVault({
      clipId: payload.clipId,
      payload,
      relativePath: "Clippings/c-duplicate.md",
    });

    expect(result.status).toBe("rejected");
    expect(result.error).toBe("duplicate");
    expect(result.path).toBe("Clippings/Original.md");
    expect(createNoteInVaultMock).not.toHaveBeenCalled();
    expect(appendToNoteInVaultMock).not.toHaveBeenCalled();
  });

  it("Check 3: mid-write crash/failure leaves no ledger entry and returns app-busy for client retry", async () => {
    createNoteInVaultMock.mockRejectedValue(new Error("Disk I/O error"));

    const payload = adversarialPayload("c-crash");
    const result = await applyClipToVault({
      clipId: payload.clipId,
      payload,
      relativePath: "Clippings/c-crash.md",
    });

    expect(result.status).toBe("rejected");
    expect(result.error).toBe("app-busy");
    expect(invokeMock).not.toHaveBeenCalledWith(
      "clipper_record_written",
      expect.anything(),
    );
  });

  it("Check 4: queue bounds constants conform to ADR-0178 specification", () => {
    expect(MAX_QUEUE_ENTRIES).toBe(200);
    expect(MAX_QUEUE_BYTES).toBe(5 * 1024 * 1024);
    expect(MAX_QUEUE_AGE_MS).toBe(30 * 24 * 60 * 60 * 1000);

    const now = new Date("2026-10-17T12:00:00.000Z");
    const freshEntry: ClipQueueEntry = {
      id: "fresh",
      clipId: "c-fresh",
      payload: adversarialPayload("c-fresh"),
      queuedAt: new Date(
        now.getTime() - 29 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      attempts: 1,
    };
    expect(isQueueEntryExpired(freshEntry, now)).toBe(false);

    const expiredEntry: ClipQueueEntry = {
      id: "expired",
      clipId: "c-old",
      payload: adversarialPayload("c-old"),
      queuedAt: new Date(
        now.getTime() - 31 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      attempts: 5,
    };
    expect(isQueueEntryExpired(expiredEntry, now)).toBe(true);
  });

  it("Check 5: payload specifying non-matching vaultId is rejected with vault-not-open without writing", async () => {
    const payload = adversarialPayload("c-wrong-vault", {
      target: {
        folder: "Clippings",
        noteName: "Wrong.md",
        vaultId: "OtherVault-uuid",
      },
    });

    const result = await applyClipToVault({
      clipId: payload.clipId,
      payload,
      relativePath: "Clippings/Wrong.md",
    });

    expect(result.status).toBe("rejected");
    expect(result.error).toBe("vault-not-open");
    expect(createNoteInVaultMock).not.toHaveBeenCalled();
    expect(appendToNoteInVaultMock).not.toHaveBeenCalled();
  });
});
