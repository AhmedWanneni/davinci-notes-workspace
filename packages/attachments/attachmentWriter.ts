import { isAcceptedAttachmentName } from "./attachmentFormats";

export interface AttachmentFileSystem {
  exists(path: string): Promise<boolean>;
  mkdir(path: string): Promise<void>;
  writeFile(path: string, data: Uint8Array): Promise<void>;
}

export type AttachmentData = Uint8Array | Blob;

export type AttachmentWriteErrorCode =
  | "invalid-filename"
  | "unsupported-format";

export class AttachmentWriteError extends Error {
  constructor(
    readonly code: AttachmentWriteErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "AttachmentWriteError";
  }
}

function filenameParts(filename: string): [string, string] {
  const dot = filename.lastIndexOf(".");
  return dot > 0 ? [filename.slice(0, dot), filename.slice(dot)] : [filename, ""];
}

function candidateName(filename: string, suffix: number): string {
  if (suffix === 0) return filename;
  const [stem, extension] = filenameParts(filename);
  return `${stem} ${suffix}${extension}`;
}

function joinVaultPath(vaultPath: string, folder: string, filename: string): string {
  const normalizedVault = vaultPath.replaceAll("\\", "/");
  const rooted = normalizedVault.startsWith("/");
  const joined = [normalizedVault, folder, filename]
    .map((part) => part.replaceAll("\\", "/").replace(/^\/+|\/+$/g, ""))
    .filter(Boolean)
    .join("/");
  return rooted ? `/${joined}` : joined;
}

export async function writeAttachment(
  fileSystem: AttachmentFileSystem,
  vaultPath: string,
  targetFolder: string,
  desiredFilename: string,
  data: AttachmentData,
): Promise<string> {
  if (!desiredFilename || desiredFilename === "." || desiredFilename === ".."
    || desiredFilename.includes("/") || desiredFilename.includes("\\")) {
    throw new AttachmentWriteError("invalid-filename", "Attachment filename is invalid.");
  }
  if (!isAcceptedAttachmentName(desiredFilename)) {
    throw new AttachmentWriteError("unsupported-format", `Attachment format is not supported: ${desiredFilename}`);
  }
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(await data.arrayBuffer());
  const folderPath = joinVaultPath(vaultPath, targetFolder, "");
  if (folderPath) await fileSystem.mkdir(folderPath);
  let suffix = 0;
  let finalPath = joinVaultPath(vaultPath, targetFolder, candidateName(desiredFilename, suffix));
  while (await fileSystem.exists(finalPath)) {
    suffix += 1;
    finalPath = joinVaultPath(vaultPath, targetFolder, candidateName(desiredFilename, suffix));
  }
  await fileSystem.writeFile(finalPath, bytes);
  return finalPath;
}
