import { Directory, File } from "expo-file-system";
import { splitRelativePath } from "./entryName";

/**
 * Resolves vault-relative paths to expo-file-system `File` / `Directory`
 * objects (ADR-0196). Nothing outside `vault/fs/` ever builds a URI string.
 *
 * - `file://` roots (app sandbox): segments are handed to the class
 *   constructors separately so `Paths.join` percent-encodes each one. Never
 *   concatenate a raw name into a URI string — `java.net.URI` rejects spaces
 *   and non-ASCII ("Illegal character in path").
 * - `content://` roots (Android SAF tree): document URIs are opaque and cannot
 *   be joined; children are located via `list()` and created through
 *   `createDirectory` / `createFile`.
 */

export type VaultEntry = File | Directory;

export function isContentUri(uri: string): boolean {
  return uri.startsWith("content://");
}

function findChild(dir: Directory, name: string): VaultEntry | null {
  try {
    return dir.list().find((entry) => entry.name === name) ?? null;
  } catch {
    return null;
  }
}

/** Returns the entry at `relativePath` (may not exist for file:// roots). */
export function resolveEntry(
  root: Directory,
  relativePath: string,
  kind: "file" | "directory",
): VaultEntry | null {
  const segments = splitRelativePath(relativePath);
  if (segments.length === 0) return root;
  if (!isContentUri(root.uri)) {
    return kind === "file"
      ? new File(root, ...segments)
      : new Directory(root, ...segments);
  }
  let current: VaultEntry | null = root;
  for (const segment of segments) {
    if (!(current instanceof Directory)) return null;
    current = findChild(current, segment);
    if (!current) return null;
  }
  return current;
}

/** Ensures every directory along `relativePath` exists and returns the leaf. */
export function ensureDirectory(
  root: Directory,
  relativePath: string,
): Directory {
  const segments = splitRelativePath(relativePath);
  if (!isContentUri(root.uri)) {
    const dir = segments.length ? new Directory(root, ...segments) : root;
    if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
    return dir;
  }
  let current = root;
  for (const segment of segments) {
    const child = findChild(current, segment);
    if (child instanceof Directory) current = child;
    else if (child) throw new Error(`"${segment}" exists and is not a folder.`);
    else current = current.createDirectory(segment);
  }
  return current;
}

function splitParent(relativePath: string): { parent: string; name: string } {
  const segments = splitRelativePath(relativePath);
  const name = segments.pop() ?? "";
  return { parent: segments.join("/"), name };
}

function tempNameFor(name: string): string {
  const nonce = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
  // Leading dot keeps the temp file out of vault scans if a crash orphans it.
  return `.${name.slice(0, 64)}.${nonce}.tmp`;
}

/**
 * Atomic write: temp file in the same folder, then `move` over the target
 * with `overwrite: true` (the API default is `false`). SAF providers do not
 * support rename-over, so content:// targets are written in place.
 */
export async function atomicWriteEntry(
  root: Directory,
  relativePath: string,
  data: string | Uint8Array,
): Promise<File> {
  const { parent, name } = splitParent(relativePath);
  if (!name) throw new Error("Cannot write to an empty path.");
  const parentDir = ensureDirectory(root, parent);

  if (isContentUri(root.uri)) {
    const existing = findChild(parentDir, name);
    if (existing instanceof Directory)
      throw new Error(`"${name}" is a folder.`);
    const file = existing ?? parentDir.createFile(name, null);
    file.write(data);
    return file;
  }

  const target = new File(parentDir, name);
  const temp = new File(parentDir, tempNameFor(name));
  try {
    temp.write(data);
    await temp.move(target, { overwrite: true });
    return new File(parentDir, name);
  } catch (err) {
    try {
      if (temp.exists) temp.delete();
    } catch {
      // best-effort cleanup
    }
    throw err;
  }
}

/** Returns the existing file or folder at `relativePath`, or null. */
export function resolveExisting(
  root: Directory,
  relativePath: string,
): VaultEntry | null {
  const asFile = resolveEntry(root, relativePath, "file");
  if (asFile?.exists) return asFile;
  const asDir = resolveEntry(root, relativePath, "directory");
  return asDir?.exists ? asDir : null;
}

/** Moves/renames an entry to another vault-relative path. */
export async function moveEntry(
  root: Directory,
  fromPath: string,
  toPath: string,
): Promise<void> {
  const entry = resolveExisting(root, fromPath);
  if (!entry) throw new Error(`Cannot move non-existent path: ${fromPath}`);
  const { parent, name } = splitParent(toPath);
  if (splitParent(fromPath).parent === parent) {
    entry.rename(name);
    return;
  }
  const destDir = ensureDirectory(root, parent);
  if (isContentUri(root.uri)) {
    await entry.move(destDir);
    if (entry.name !== name) entry.rename(name);
    return;
  }
  await entry.move(
    entry instanceof Directory
      ? new Directory(destDir, name)
      : new File(destDir, name),
  );
}
