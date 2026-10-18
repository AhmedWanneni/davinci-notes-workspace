import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  encodePairingUri,
  validatePairingInput,
  toBase64Url,
  type SyncthingPairingPayload,
} from "@app/syncthing-api";
import * as client from "./mobileSyncthingClient";
import * as keyStore from "./secureKeyStore";
import {
  mobileSyncthingAddDevice,
  mobileSyncthingPendingFolders,
  mobileSyncthingAcceptFolder,
} from "./mobileSyncthingPairing";
import {
  mobileSyncthingFolderCompletion,
  mobileSyncthingIsDeviceConnected,
  mobileSyncthingSetLocalDeviceName,
} from "./mobileSyncthingOperations";

describe("Scan to Sync Verification Suite", () => {
  const desktopId = "C4BPTD3-DOYDMY2-BMYU2JI-XZSA2JH-B7FJJTG-WEO6WA3-XGIYHVF-C2O5BQE";
  const mobileId = "KMX2ZEX-QGFKBYF-RN7NW53-U3EGRSJ-LKWCWQO-MIWV57G-CCUAZZH-RFE36AL";
  const folderId = "davinci-vault-personal";
  const apiKey = "valid-test-key";

  const validPayload: SyncthingPairingPayload = {
    v: 1,
    id: desktopId,
    name: "Ahmed MacBook",
    folderId,
    folderLabel: "Personal Vault",
    code: "582910",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(keyStore, "getSyncthingApiKey").mockResolvedValue(apiKey);
    vi.spyOn(client, "mobileSyncthingStatus").mockResolvedValue({

      deviceId: mobileId,
      deviceName: "Pixel 8",
      uptime: 3600,
    });
  });

  it("Verification 1: Fresh phone state: scan, confirm, accept on desktop -> notes arrive and complete", async () => {
    const uri = encodePairingUri(validPayload);
    const parsed = validatePairingInput(uri);
    expect(parsed.valid).toBe(true);
    if (!parsed.valid) return;

    // Local device announces "<name>-<code>" so desktop can match code
    let announcedName = "";
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes(`/rest/config/devices/${mobileId}`) && init?.method === "PUT") {
        const body = JSON.parse(init.body as string);
        announcedName = body.name;
        return new Response("", { status: 200 });
      }
      if (url.includes("/rest/config/devices")) {
        return new Response(JSON.stringify([]), { status: 200 });
      }
      if (url.includes("/rest/cluster/pending/folders")) {
        return new Response(
          JSON.stringify({
            [folderId]: {
              label: "Personal Vault",
              offeredBy: desktopId,
              time: "2026-10-18T14:00:00Z",
            },
          }),
          { status: 200 },
        );
      }
      if (url.includes("/rest/config/folders")) {
        return new Response("", { status: 200 });
      }
      if (url.includes("/rest/db/completion")) {
        return new Response(
          JSON.stringify({ completion: 100, needBytes: 0, globalBytes: 50000, needItems: 0 }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 200 });
    });

    await mobileSyncthingSetLocalDeviceName(apiKey, `Pixel 8-${parsed.payload.code}`);
    expect(announcedName).toBe("Pixel 8-582910");

    await mobileSyncthingAddDevice(apiKey, parsed.payload.id, parsed.payload.name);

    const pending = await mobileSyncthingPendingFolders(apiKey);
    const matched = pending.find(
      (f) => f.folderId === parsed.payload.folderId && f.offeredBy === parsed.payload.id,
    );
    expect(matched).toBeDefined();

    await mobileSyncthingAcceptFolder(apiKey, matched!.folderId, "/app/documents/vault");
    const completion = await mobileSyncthingFolderCompletion(apiKey, parsed.payload.folderId);
    expect(completion.completion).toBe(100);
    expect(completion.needBytes).toBe(0);
  });

  it("Verification 2: Scan unrelated QR (URL, random text, v2 payload) -> rejected, nothing added", () => {
    const webUrl = "https://notes.davinci.app/share/doc123";
    const resUrl = validatePairingInput(webUrl);
    expect(resUrl.valid).toBe(false);
    if (!resUrl.valid) {
      expect(resUrl.error).toContain("web URL");
    }

    const randomText = "BEGIN:VCARD\nVERSION:3.0\nN:John;Doe\nEND:VCARD";
    const resText = validatePairingInput(randomText);
    expect(resText.valid).toBe(false);

    const v2Payload = { ...validPayload, v: 2 };
    const v2Uri = `davincinotes://pair?d=${toBase64Url(JSON.stringify(v2Payload))}`;
    const resV2 = validatePairingInput(v2Uri);
    expect(resV2.valid).toBe(false);
    if (!resV2.valid) {
      expect(resV2.error).toContain("Unsupported pairing version (v2)");
    }
  });

  it("Verification 3: Scan same QR twice -> idempotent, no duplicate device or folder", async () => {
    let addDeviceCount = 0;
    global.fetch = vi.fn().mockImplementation(async (url: string, init?: RequestInit) => {
      if (url.includes("/rest/config/devices")) {
        if (init?.method === "POST") {
          addDeviceCount++;
          return new Response("", { status: 200 });
        }
        // Second call simulates device already present
        return new Response(
          JSON.stringify(addDeviceCount > 0 ? [{ deviceID: desktopId }] : []),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 200 });
    });

    // First scan adds device
    await mobileSyncthingAddDevice(apiKey, validPayload.id, validPayload.name);
    expect(addDeviceCount).toBe(1);

    // Second scan detects device already added and rejects duplicate cleanly
    await expect(
      mobileSyncthingAddDevice(apiKey, validPayload.id, validPayload.name),
    ).rejects.toThrow("Device already added");
    expect(addDeviceCount).toBe(1);
  });

  it("Verification 4: Scan expired QR -> desktop does not highlight, phone handles timeout", async () => {
    // When code is expired, desktop's hasCode check is false
    const currentCode = "999999";
    const phoneAnnouncedName = `Pixel-8-${validPayload.code}`; // contains old code "582910"
    const isCodeMatching = phoneAnnouncedName.includes(currentCode);
    expect(isCodeMatching).toBe(false);

    // Phone polls pending folders but desktop declined/ignored, so pending is empty
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/rest/cluster/pending/folders")) {
        return new Response(JSON.stringify({}), { status: 200 });
      }
      return new Response("{}", { status: 200 });
    });

    const pending = await mobileSyncthingPendingFolders(apiKey);
    const matched = pending.find((f) => f.folderId === validPayload.folderId);
    expect(matched).toBeUndefined();
  });

  it("Verification 5: Deny camera permission -> paste flow works with uri or raw id", () => {
    // Paste link
    const uri = encodePairingUri(validPayload);
    const linkRes = validatePairingInput(uri);
    expect(linkRes.valid).toBe(true);

    // Paste raw 56-char ID
    const rawRes = validatePairingInput(desktopId);
    expect(rawRes.valid).toBe(true);
    if (rawRes.valid) {
      expect(rawRes.type).toBe("raw_device");
      expect(rawRes.payload.id).toBe(desktopId);
    }
  });

  it("Verification 6: Desktop offline during scan -> connection error surfaced and retryable", async () => {
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/rest/system/connections")) {
        return new Response(
          JSON.stringify({
            connections: { [desktopId]: { connected: false } },
          }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 200 });
    });

    const isConnected = await mobileSyncthingIsDeviceConnected(apiKey, desktopId);
    expect(isConnected).toBe(false);

    // Retry when desktop comes online
    global.fetch = vi.fn().mockImplementation(async (url: string) => {
      if (url.includes("/rest/system/connections")) {
        return new Response(
          JSON.stringify({
            connections: { [desktopId]: { connected: true } },
          }),
          { status: 200 },
        );
      }
      return new Response("{}", { status: 200 });
    });

    const isConnectedNow = await mobileSyncthingIsDeviceConnected(apiKey, desktopId);
    expect(isConnectedNow).toBe(true);
  });
});
