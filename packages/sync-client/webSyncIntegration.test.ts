import { describe, expect, it } from "vitest";
import {
  computeHexDigest,
  createWebManifestSource,
  createWebPkceProvider,
} from "./webManifestSource";
import { startDriveLogin } from "./driveAuth";
import { generateManifest } from "./manifest";
import {
  resolveBinaryConflictName,
  resolveTextConflict,
} from "./conflictResolver";

describe("Phase 5: Web Cloud Vault Sync & Conflict Resolution", () => {
  it("computes deterministic digests across empty, unicode, and 1 MB binary files", async () => {
    const emptyDigest = await computeHexDigest(new Uint8Array(0));
    const unicodeDigest = await computeHexDigest(
      new TextEncoder().encode("# Café & Naïve 🚀"),
    );
    const largeBinary = new Uint8Array(1024 * 1024);
    largeBinary[0] = 42;
    largeBinary[largeBinary.length - 1] = 99;
    const binaryDigest = await computeHexDigest(largeBinary);

    expect(emptyDigest).toMatch(/^[0-9a-f]{16,64}$/);
    expect(unicodeDigest).toMatch(/^[0-9a-f]{16,64}$/);
    expect(binaryDigest).toMatch(/^[0-9a-f]{16,64}$/);
    expect(emptyDigest).not.toBe(unicodeDigest);
    expect(unicodeDigest).not.toBe(binaryDigest);

    // Repeatability check
    expect(await computeHexDigest(largeBinary)).toBe(binaryDigest);
  });

  it("generates manifest from WebManifestSource and skips unchanged files on second pass", async () => {
    let hashCalls = 0;
    const source = createWebManifestSource({
      listVaultFiles: async () => [
        { path: "daily/2026-10-22.md", size: 12, mtimeMs: 1000 },
      ],
      readBinaryFile: async () => {
        hashCalls++;
        return new TextEncoder().encode("# Daily Note");
      },
    });

    const first = await generateManifest(source);
    expect(hashCalls).toBe(1);
    expect(first.entries).toHaveLength(1);

    // Second pass with unchanged size and mtimeMs must not re-read/re-hash
    const second = await generateManifest(source, first, first.nextDeviceClock);
    expect(hashCalls).toBe(1);
    expect(second.entries[0].hash).toBe(first.entries[0].hash);
  });

  it("merges concurrent non-overlapping edits cleanly on a 20-line note (Line 2 vs Line 18)", () => {
    const baseLines = Array.from({ length: 20 }, (_, i) => `Line ${i + 1}`);
    const remoteLines = [...baseLines];
    remoteLines[1] = "Line 2 (Edited on Desktop)";
    const localLines = [...baseLines];
    localLines[17] = "Line 18 (Edited in Web OPFS)";

    const result = resolveTextConflict({
      path: "roadmap.md",
      baseContent: baseLines.join("\n"),
      localContent: localLines.join("\n"),
      remoteContent: remoteLines.join("\n"),
    });

    expect(result.hasConflict).toBe(false);
    expect(result.kind).toBe("text-merge-clean");
    expect(result.mergedContent).toContain("Line 2 (Edited on Desktop)");
    expect(result.mergedContent).toContain("Line 18 (Edited in Web OPFS)");
    expect(result.mergedContent).not.toContain("<<<<<<<");
  });

  it("flags conflicting simultaneous edits on Line 5 and generates non-destructive conflict copy", () => {
    const baseLines = Array.from({ length: 10 }, (_, i) => `Line ${i + 1}`);
    const remoteLines = [...baseLines];
    remoteLines[4] = "Line 5: Remote Desktop Version";
    const localLines = [...baseLines];
    localLines[4] = "Line 5: Local Web Browser Version";

    const result = resolveTextConflict({
      path: "notes/Note.md",
      baseContent: baseLines.join("\n"),
      localContent: localLines.join("\n"),
      remoteContent: remoteLines.join("\n"),
      localLabel: "Web",
      remoteLabel: "Desktop",
    });

    expect(result.hasConflict).toBe(true);
    expect(result.kind).toBe("text-merge-conflict");
    expect(result.mergedContent).toContain("Line 5: Local Web Browser Version");
    expect(result.mergedContent).toContain("Line 5: Remote Desktop Version");

    const conflictCopy = resolveBinaryConflictName({
      path: "notes/Note.md",
      remoteDeviceName: "Web-Client",
      existingPaths: ["notes/Note.md"],
    });
    expect(conflictCopy.copyPath).toBe("notes/Note (Web-Client copy).md");
  });

  it("produces valid OAuth 2.0 PKCE verifier and S256 challenge in Web Crypto", async () => {
    const pkce = createWebPkceProvider();
    const login = await startDriveLogin(
      {
        clientId: "web-client-id",
        authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
        redirectUri: "https://notes.davinci.app/oauth/callback",
        state: "test-state",
      },
      pkce,
    );

    expect(login.verifier.length).toBeGreaterThanOrEqual(43);
    expect(login.authorizationUrl).toContain("code_challenge_method=S256");
    expect(login.authorizationUrl).toContain("code_challenge=");
  });
});
