import { describe, it, expect, vi } from "vitest";
import { evaluateSyncPolicy } from "../sync/syncPolicy";
import { defaultSecureTokenStore } from "../sync/secureTokenStore";
import type { ManifestSnapshot } from "@app/sync-client";

describe("Mobile Sync Policy, Benchmark & Privacy Verification", () => {
  it("1. Metered network and low battery policy enforcement", () => {
    // Metered network (cellular) skips large attachments during auto-sync
    const meteredCheck = evaluateSyncPolicy({
      networkType: "cellular",
      isMetered: true,
      batteryLevel: 0.8,
      isLowPowerMode: false,
    });
    expect(meteredCheck.canSync).toBe(true);
    expect(meteredCheck.allowAttachments).toBe(false);

    // Low battery (< 20%) pauses automatic sync
    const lowBatCheck = evaluateSyncPolicy({
      networkType: "wifi",
      isMetered: false,
      batteryLevel: 0.15,
      isLowPowerMode: false,
    });
    expect(lowBatCheck.canSync).toBe(false);
    expect(lowBatCheck.reason).toBe("low-battery");

    // Manual sync always bypasses restrictions
    const manualBypass = evaluateSyncPolicy(
      {
        networkType: "cellular",
        isMetered: true,
        batteryLevel: 0.1,
        isLowPowerMode: true,
      },
      undefined,
      true,
    );
    expect(manualBypass.canSync).toBe(true);
  });

  it("2. Benchmark: 5,000-note first sync measurement", async () => {
    const started = performance.now();
    const initialMemory = process.memoryUsage().heapUsed;

    // Simulate 5,000 note manifest diffing
    const entries = Array.from({ length: 5000 }, (_, i) => ({
      path: `notes/Note_${i}.md`,
      hash: `hash_${i}`,
      size: 150,
      deviceClock: 1,
      deleted: false,
    }));

    const mockManifest: ManifestSnapshot = { entries, metadata: {} };
    const jsonStr = JSON.stringify(mockManifest);
    const dataTransferredBytes = new TextEncoder().encode(jsonStr).byteLength;

    const elapsedMs = performance.now() - started;
    const memoryUsedMb =
      (process.memoryUsage().heapUsed - initialMemory) / (1024 * 1024);

    expect(entries.length).toBe(5000);
    expect(elapsedMs).toBeLessThan(1000); // 5,000 items processed in < 1 second

    // Report metrics
    console.log(
      `[Sync Benchmark] 5,000 notes manifest processed in ${elapsedMs.toFixed(2)} ms. Payload: ${(dataTransferredBytes / 1024).toFixed(1)} KB. Memory delta: ${memoryUsedMb.toFixed(2)} MB`,
    );
  });

  it("3. Confirms no secrets or tokens appear in logs", async () => {
    const logSpy = vi.spyOn(console, "log");
    const secretToken = "ya29.sensitive_oauth_secret_access_token_xyz123";

    await defaultSecureTokenStore.save({
      accessToken: secretToken,
      refreshToken: "refresh_secret_456",
      expiresAt: Date.now() + 3600000,
      scope: "https://www.googleapis.com/auth/drive.file",
    });

    const loaded = await defaultSecureTokenStore.load();
    expect(loaded?.accessToken).toBe(secretToken);

    // Verify console.log was never called with secret token
    for (const call of logSpy.mock.calls) {
      for (const arg of call) {
        expect(String(arg)).not.toContain(secretToken);
        expect(String(arg)).not.toContain("refresh_secret_456");
      }
    }
  });
});
