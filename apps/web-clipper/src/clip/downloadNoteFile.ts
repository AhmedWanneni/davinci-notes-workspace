/** The slice of `browser.downloads` this module needs, so it stays testable. */
export interface DownloadsApi {
  download(options: {
    url: string;
    filename?: string;
    saveAs?: boolean;
  }): Promise<number | undefined>;
}

export function createNoteBlobUrl(content: string): string {
  return URL.createObjectURL(new Blob([content], { type: "text/markdown" }));
}

/**
 * Save the note as a `.md` file.
 *
 * Until the desktop transport lands (Phase 3) this is the whole delivery path,
 * and afterwards it stays as the "export" affordance. The object URL is revoked
 * on a delay: revoking immediately can abort the download.
 */
export async function downloadNoteFile(
  api: DownloadsApi,
  filename: string,
  content: string,
): Promise<void> {
  const url = createNoteBlobUrl(content);
  try {
    await api.download({ url, filename, saveAs: false });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}
