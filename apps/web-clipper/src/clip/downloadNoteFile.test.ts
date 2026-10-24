import { beforeEach, describe, expect, it, vi } from "vitest";
import { downloadNoteFile, type DownloadsApi } from "./downloadNoteFile";

describe("downloadNoteFile", () => {
  beforeEach(() => {
    // jsdom does not implement object URLs; the extension page does.
    if (typeof URL.createObjectURL !== "function") {
      Object.defineProperty(URL, "createObjectURL", {
        value: () => "blob:clipper",
        configurable: true,
      });
      Object.defineProperty(URL, "revokeObjectURL", {
        value: () => undefined,
        configurable: true,
      });
    }
  });

  it("hands the note to the downloads API with the vault path", async () => {
    const download = vi.fn().mockResolvedValue(1);
    const api: DownloadsApi = { download };

    await downloadNoteFile(api, "Clippings/Note.md", "# Note\n");

    expect(download).toHaveBeenCalledTimes(1);
    const options = download.mock.calls[0][0];
    expect(options.filename).toBe("Clippings/Note.md");
    expect(options.url).toMatch(/^(blob:|data:)/);
    expect(options.saveAs).toBe(false);
  });

  it("propagates a downloads failure to the caller", async () => {
    const api: DownloadsApi = {
      download: vi.fn().mockRejectedValue(new Error("denied")),
    };
    await expect(downloadNoteFile(api, "Note.md", "x")).rejects.toThrow(
      "denied",
    );
  });
});
