import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ClipPayload } from "@app/clipper-core";

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

import { applyClipToVault, clipTargetPlan } from "./applyClipToVault";

function payload(overrides: Partial<ClipPayload> = {}): ClipPayload {
  return {
    version: 1,
    clipId: "clip-1",
    capturedAt: "2026-10-17T09:05:07.000Z",
    mode: "full",
    templateId: "article",
    behavior: "create",
    target: { folder: "Clippings", noteName: "Probe.md" },
    source: { url: "https://probe.example/a", title: "Probe" },
    properties: { source: "https://probe.example/a" },
    tags: ["clippings"],
    body: "# Probe",
    contentHash: "0123456789abcdef",
    ...overrides,
  };
}

const event = (overrides: Partial<ClipPayload> = {}) => ({
  clipId: "clip-1",
  payload: payload(overrides),
  relativePath: "Clippings/Probe.md",
});

describe("clipTargetPlan", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resolveUniqueNotePathMock.mockImplementation(
      (_paths: string[], preferred: string) => preferred,
    );
  });

  it("creates with a unique name and never overwrites", () => {
    resolveUniqueNotePathMock.mockReturnValue("Clippings/Probe 1.md");

    expect(
      clipTargetPlan("create", "Clippings/Probe.md", ["Clippings/Probe.md"]),
    ).toEqual({ kind: "create", path: "Clippings/Probe 1.md" });
    expect(resolveUniqueNotePathMock).toHaveBeenCalledWith(
      ["Clippings/Probe.md"],
      "Clippings/Probe.md",
    );
  });

  it("maps every append behaviour to the bottom of the note", () => {
    for (const behavior of ["append-bottom", "daily-append"] as const) {
      expect(clipTargetPlan(behavior, "Daily/2026-10-17.md", [])).toEqual({
        kind: "insert",
        path: "Daily/2026-10-17.md",
        position: "bottom",
      });
    }
  });

  it("maps every prepend behaviour to the top of the note", () => {
    for (const behavior of [
      "append-top",
      "prepend",
      "daily-prepend",
    ] as const) {
      expect(clipTargetPlan(behavior, "Clippings/Probe.md", [])).toEqual({
        kind: "insert",
        path: "Clippings/Probe.md",
        position: "top",
      });
    }
  });

  it("does not touch the resolver for an append", () => {
    clipTargetPlan("prepend", "Clippings/Probe.md", ["Clippings/Probe.md"]);
    expect(resolveUniqueNotePathMock).not.toHaveBeenCalled();
  });
});

describe("applyClipToVault", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    invokeMock.mockResolvedValue(null);
    createNoteInVaultMock.mockImplementation(async (path: string) => path);
    appendToNoteInVaultMock.mockImplementation(async (path: string) => path);
    resolveUniqueNotePathMock.mockImplementation(
      (_paths: string[], preferred: string) => preferred,
    );
    getStateMock.mockReturnValue({
      vaultPath: "/vault",
      allNotePaths: ["welcome.md"],
    });
  });

  it("rejects with vault-not-open when no vault is open", async () => {
    getStateMock.mockReturnValue({ vaultPath: null, allNotePaths: [] });

    await expect(applyClipToVault(event())).resolves.toEqual({
      clipId: "clip-1",
      status: "rejected",
      error: "vault-not-open",
    });
    expect(createNoteInVaultMock).not.toHaveBeenCalled();
  });

  it("creates the note with the composed file for a create clip", async () => {
    await expect(applyClipToVault(event())).resolves.toEqual({
      clipId: "clip-1",
      status: "written",
      path: "Clippings/Probe.md",
    });
    expect(createNoteInVaultMock).toHaveBeenCalledWith(
      "Clippings/Probe.md",
      '---\nsource: "https://probe.example/a"\ntags:\n  - clippings\n---\n# Probe\n',
    );
  });

  it("appends the body only — never a second frontmatter block", async () => {
    await applyClipToVault(
      event({ behavior: "daily-append", body: "clipped text" }),
    );

    expect(appendToNoteInVaultMock).toHaveBeenCalledWith(
      "Clippings/Probe.md",
      "clipped text",
      "bottom",
    );
    expect(createNoteInVaultMock).not.toHaveBeenCalled();
  });

  it("reports a failed write as app-busy instead of throwing", async () => {
    createNoteInVaultMock.mockRejectedValue(new Error("disk is full"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined);

    await expect(applyClipToVault(event())).resolves.toEqual({
      clipId: "clip-1",
      status: "rejected",
      error: "app-busy",
    });
    expect(consoleError).toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("reports the ack against the event's clip id", async () => {
    await expect(
      applyClipToVault({ ...event(), clipId: "clip-9" }),
    ).resolves.toMatchObject({ clipId: "clip-9" });
  });

  it("rejects with duplicate and returns existing path when ledger matches", async () => {
    invokeMock.mockImplementation((cmd: string) => {
      if (cmd === "clipper_check_duplicate") {
        return Promise.resolve("Clippings/Probe.md");
      }
      return Promise.resolve(null);
    });

    await expect(applyClipToVault(event())).resolves.toEqual({
      clipId: "clip-1",
      status: "rejected",
      error: "duplicate",
      path: "Clippings/Probe.md",
    });
    expect(createNoteInVaultMock).not.toHaveBeenCalled();
  });

  it("rejects with vault-not-open when target vaultId does not match current vault", async () => {
    const mismatchedEvent = {
      ...event(),
      payload: payload({
        target: {
          vaultId: "OtherVault",
          folder: "Clippings",
          noteName: "Probe.md",
        },
      }),
    };

    await expect(applyClipToVault(mismatchedEvent)).resolves.toEqual({
      clipId: "clip-1",
      status: "rejected",
      error: "vault-not-open",
    });
    expect(createNoteInVaultMock).not.toHaveBeenCalled();
  });

  it("records successfully written note into dedupe ledger", async () => {
    await applyClipToVault(event());
    expect(invokeMock).toHaveBeenCalledWith("clipper_record_written", {
      clipId: "clip-1",
      contentHash: "0123456789abcdef",
      relativePath: "Clippings/Probe.md",
    });
  });
});
