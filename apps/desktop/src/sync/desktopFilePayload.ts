import {
  readBinaryFile,
  readNote,
  writeBinaryFile,
  writeNote,
} from "../vault/vaultCommands";

export async function readFilePayload(path: string): Promise<Blob> {
  const isText = path.endsWith(".md") || path.endsWith(".canvas");
  if (isText) {
    const payload = await readNote(path);
    return new Blob([payload.content], { type: "text/plain; charset=utf-8" });
  }

  const bytes = await readBinaryFile(path);
  return new Blob([bytes]);
}

export async function applyDownloadedPayload(
  path: string,
  buffer: ArrayBuffer,
): Promise<void> {
  const isText = path.endsWith(".md") || path.endsWith(".canvas");
  if (isText) {
    const text = new TextDecoder().decode(buffer);
    await writeNote(path, text);
  } else {
    await writeBinaryFile(path, new Uint8Array(buffer));
  }
}
