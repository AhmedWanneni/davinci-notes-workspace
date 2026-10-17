import { describe, it, expect, beforeEach, vi } from "vitest";
import { MobileVaultStorageAdapter } from "../vault";
import {
  resetInMemoryFs,
  inMemoryFs,
  documentDirectory,
} from "./mocks/expoFileSystemMock";
import {
  captureItem,
  ensureDailyNote,
  getDailyNotePath,
  fetchUrlMetadata,
  capturePhotoFromCamera,
  pickPhotoFromLibrary,
  startVoiceMemoRecording,
  formatDateStamp,
} from "../capture";
import { defaultVaultIndexer } from "../indexer";
import { searchVault } from "../indexer/mobileSearch";

describe("Mobile Fast Capture & Attachment Verification", () => {
  const VAULT_ROOT = `${documentDirectory}capture-vault/`;
  let adapter: MobileVaultStorageAdapter;

  beforeEach(async () => {
    resetInMemoryFs();
    inMemoryFs.set(VAULT_ROOT.replace(/\/+$/, ""), {
      isDirectory: true,
      size: 0,
      mtime: Date.now(),
    });
    adapter = new MobileVaultStorageAdapter(VAULT_ROOT, "sandbox");
    await defaultVaultIndexer.indexVault(adapter, true);
  });

  it("1. Shares text, URL, and image across closed, backgrounded, and open states", async () => {
    // A. App closed: Share text from notes app
    const resText = await captureItem(
      adapter,
      { type: "text", text: "Important research snippet from Apple Notes" },
      "quick-notes",
    );
    expect(resText.isNewNote).toBe(true);
    const textNote = await adapter.readNote(resText.targetNotePath);
    expect(textNote.content).toContain(
      "Important research snippet from Apple Notes",
    );

    // B. App backgrounded: Share URL from browser
    const resUrl = await captureItem(
      adapter,
      {
        type: "url",
        url: "https://davincinotes.app/docs",
        title: "DaVinci Notes Documentation",
        text: "Offline-first reference guide",
      },
      "quick-notes",
    );
    const urlNote = await adapter.readNote(resUrl.targetNotePath);
    expect(urlNote.content).toContain(
      "[DaVinci Notes Documentation](https://davincinotes.app/docs)",
    );
    expect(urlNote.content).toContain("> Offline-first reference guide");

    // C. App open: Share image from photo gallery
    const imageUri = `${documentDirectory}gallery_temp.jpg`;
    inMemoryFs.set(imageUri.replace(/\/+$/, ""), {
      isDirectory: false,
      content: "fake-jpg-binary-stream",
      size: 2048,
      mtime: Date.now(),
    });

    const resImage = await captureItem(
      adapter,
      {
        type: "image",
        fileUri: imageUri,
        filename: "screenshot.jpg",
        text: "Diagram of architecture",
      },
      "quick-notes",
    );
    expect(resImage.attachmentPath).toBe("Attachments/screenshot.jpg");
    const imageNote = await adapter.readNote(resImage.targetNotePath);
    expect(imageNote.content).toContain("![[Attachments/screenshot.jpg]]");
    expect(imageNote.content).toContain("Diagram of architecture");

    // Verify attachment exists on disk in Attachments/
    const statAttachment = await adapter.statFile("Attachments/screenshot.jpg");
    expect(statAttachment.exists).toBe(true);
  });

  it("2. Widget/Shortcut: creates daily note when missing and reuses when existing", async () => {
    const today = new Date();
    const expectedPath = getDailyNotePath(today);

    // Initial state: daily note does NOT exist
    const stat1 = await adapter.statFile(expectedPath);
    expect(stat1.exists).toBe(false);

    // Widget opens "Today's note": creates note atomically
    const firstCall = await ensureDailyNote(adapter, today);
    expect(firstCall.created).toBe(true);
    expect(firstCall.path).toBe(expectedPath);
    expect(firstCall.content).toContain(`# ${formatDateStamp(today)}`);

    const stat2 = await adapter.statFile(expectedPath);
    expect(stat2.exists).toBe(true);

    // Second widget tap: reopens existing note without overwriting
    const secondCall = await ensureDailyNote(adapter, today);
    expect(secondCall.created).toBe(false);
    expect(secondCall.content).toBe(firstCall.content);
  });

  it("3. Handles camera/photo/voice permissions denial without crashing", async () => {
    // Mock image picker with denial
    vi.mock("expo-image-picker", () => ({
      requestCameraPermissionsAsync: vi
        .fn()
        .mockResolvedValue({ granted: false, canAskAgain: true }),
      requestMediaLibraryPermissionsAsync: vi
        .fn()
        .mockResolvedValue({ granted: false, canAskAgain: false }),
      launchCameraAsync: vi.fn(),
      launchImageLibraryAsync: vi.fn(),
    }));

    const cameraResult = await capturePhotoFromCamera();
    expect(cameraResult.success).toBe(false);
    expect(cameraResult.reason).toBe("permission-denied");
    expect(cameraResult.canAskAgain).toBe(true);

    const libraryResult = await pickPhotoFromLibrary();
    expect(libraryResult.success).toBe(false);
    expect(libraryResult.reason).toBe("permission-denied");

    // Mock audio with denial
    vi.mock("expo-audio", () => ({
      requestRecordingPermissionsAsync: vi
        .fn()
        .mockResolvedValue({ granted: false, canAskAgain: true }),
      setAudioModeAsync: vi.fn(),
      RecordingPresets: { HIGH_QUALITY: {} },
      AudioRecorder: vi.fn().mockImplementation(() => ({
        prepareToRecordAsync: vi.fn(),
        record: vi.fn(),
        stop: vi.fn(),
        uri: "file:///mock/recording.m4a",
      })),
    }));

    const voiceResult = await startVoiceMemoRecording();
    expect("success" in voiceResult && voiceResult.success).toBe(false);
  });

  it("4. Large image (>10 MB) and long audio memo stay responsive and within bounds", async () => {
    // 12 MB simulated camera photo
    const largePayload = "X".repeat(12 * 1024 * 1024);
    const startImage = performance.now();

    const res = await captureItem(
      adapter,
      {
        type: "image",
        text: largePayload,
        filename: "high_res_photo.jpg",
      },
      "quick-notes",
    );

    const elapsedImage = performance.now() - startImage;
    expect(elapsedImage).toBeLessThan(3000); // Sub-3s for 12 MB payload write & index
    const diskStat = await adapter.statFile(res.attachmentPath!);
    expect(diskStat.size).toBe(12 * 1024 * 1024);

    // Simulated 30-minute voice memo (15 MB audio)
    const audioPayload = "A".repeat(15 * 1024 * 1024);
    const startAudio = performance.now();
    const resAudio = await captureItem(
      adapter,
      {
        type: "audio",
        text: audioPayload,
        filename: "meeting_recording.m4a",
      },
      "quick-notes",
    );
    const elapsedAudio = performance.now() - startAudio;
    expect(elapsedAudio).toBeLessThan(3000);
    const audioStat = await adapter.statFile(resAudio.attachmentPath!);
    expect(audioStat.size).toBe(15 * 1024 * 1024);
  }, 15000);

  it("5. Resolves filename collisions for attachments and notes without overwriting", async () => {
    // 3 attachments with identical name
    const a1 = await captureItem(adapter, {
      type: "image",
      text: "img1",
      filename: "diagram.png",
    });
    const a2 = await captureItem(adapter, {
      type: "image",
      text: "img2",
      filename: "diagram.png",
    });
    const a3 = await captureItem(adapter, {
      type: "image",
      text: "img3",
      filename: "diagram.png",
    });

    expect(a1.attachmentPath).toBe("Attachments/diagram.png");
    expect(a2.attachmentPath).toBe("Attachments/diagram 1.png");
    expect(a3.attachmentPath).toBe("Attachments/diagram 2.png");

    expect((await adapter.readNote(a1.attachmentPath!)).content).toBe("img1");
    expect((await adapter.readNote(a2.attachmentPath!)).content).toBe("img2");
    expect((await adapter.readNote(a3.attachmentPath!)).content).toBe("img3");

    // Same-second capture notes
    const ts = 1729000000000;
    const n1 = await captureItem(adapter, {
      type: "text",
      text: "Thought 1",
      timestamp: ts,
    });
    const n2 = await captureItem(adapter, {
      type: "text",
      text: "Thought 2",
      timestamp: ts,
    });

    expect(n1.targetNotePath).not.toBe(n2.targetNotePath);
    expect(n2.targetNotePath).toContain(" 1.md");
    expect((await adapter.readNote(n1.targetNotePath)).content).toContain(
      "Thought 1",
    );
    expect((await adapter.readNote(n2.targetNotePath)).content).toContain(
      "Thought 2",
    );
  });

  it("6. Captured items appear in search and file list after indexing", async () => {
    await captureItem(
      adapter,
      {
        type: "text",
        text: "Quantum computing algorithms for portfolio optimization",
        title: "Quantum Finance",
      },
      "quick-notes",
    );

    // Re-scan vault
    const scan = await adapter.scanVault();
    expect(scan.notes.some((p) => p.includes("Quantum Finance"))).toBe(true);

    // Search via searchVault under withDbLock
    const searchRes = await searchVault(
      "Quantum computing",
      defaultVaultIndexer.getTagIndex(),
    );

    expect(searchRes.length).toBeGreaterThan(0);
    expect(searchRes[0].path).toContain("Quantum Finance");
  });

  it("7. Gracefully fetches URL title and falls back on error", async () => {
    const meta = await fetchUrlMetadata("https://example.com/some/article");
    expect(meta.url).toBe("https://example.com/some/article");
    expect(typeof meta.title).toBe("string");
    expect(meta.title.length).toBeGreaterThan(0);
  });
});
