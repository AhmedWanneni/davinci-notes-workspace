import { Directory, File, Paths } from "expo-file-system";
import { sanitizeEntryName } from "./entryName";
import { isContentUri } from "./vaultEntries";

/**
 * Vault-level filesystem operations (ADR-0196): sandbox vault creation,
 * folder picking, access checks and app-private JSON files. All URIs handed
 * back to callers are produced by expo-file-system objects, never by string
 * concatenation.
 */

const VAULTS_FOLDER = "vaults";

function vaultsRoot(): Directory {
  const dir = new Directory(Paths.document, VAULTS_FOLDER);
  if (!dir.exists) dir.create({ intermediates: true, idempotent: true });
  return dir;
}

export interface CreatedVaultDirectory {
  readonly uri: string;
  readonly folderName: string;
}

/**
 * Creates a fresh sandbox vault folder. Never reuses an existing folder:
 * a name collision gets a numeric suffix ("My Notes 2").
 */
export function createSandboxVaultDirectory(
  name: string,
): CreatedVaultDirectory {
  const base = sanitizeEntryName(name, { fallback: "Vault" });
  const root = vaultsRoot();
  for (let n = 1; n < 1000; n++) {
    const folderName = n === 1 ? base : sanitizeEntryName(`${base} ${n}`);
    const dir = new Directory(root, folderName);
    if (dir.exists) continue;
    dir.create({ intermediates: true });
    return { uri: dir.uri, folderName };
  }
  throw new Error("Could not find a free folder name for this vault.");
}

/** Rollback helper: removes a vault folder this app just created. */
export function deleteVaultDirectory(uri: string): void {
  const dir = new Directory(uri);
  if (dir.exists) dir.delete();
}

export interface PickedDirectory {
  readonly uri: string;
  readonly name: string;
}

/**
 * Opens the system folder picker (Android SAF `ACTION_OPEN_DOCUMENT_TREE`,
 * iOS UIDocumentPicker). On Android the native module takes a persistable
 * read/write URI permission. Returns null when the user cancels.
 */
export async function pickDirectory(): Promise<PickedDirectory | null> {
  let picked: Directory;
  try {
    picked = await Directory.pickDirectoryAsync();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (/cancel/i.test(message)) return null;
    throw err;
  }
  if (!picked?.uri) return null;
  picked.list(); // throws if the grant is unusable
  return { uri: picked.uri, name: picked.name || "External Folder" };
}

export interface DirectoryAccess {
  readonly isAccessible: boolean;
  readonly error?: string;
}

/** Checks a vault root exists and is still readable (SAF grant valid). */
export function verifyDirectoryAccess(uri: string): DirectoryAccess {
  try {
    const dir = new Directory(uri);
    if (!dir.exists) {
      return {
        isAccessible: false,
        error: "Vault folder does not exist or was deleted.",
      };
    }
    dir.list();
    return { isAccessible: true };
  } catch (err) {
    return {
      isAccessible: false,
      error: isContentUri(uri)
        ? "Access to this folder was revoked. Re-open it to grant permission again."
        : err instanceof Error
          ? err.message
          : "The vault folder cannot be read.",
    };
  }
}

/** Reads an app-private JSON file from the documents directory. */
export async function readAppJson<T>(fileName: string): Promise<T | null> {
  const file = new File(Paths.document, fileName);
  if (!file.exists) return null;
  return JSON.parse(await file.text()) as T;
}

/** Writes an app-private JSON file (temp + move for crash safety). */
export async function writeAppJson(
  fileName: string,
  value: unknown,
): Promise<void> {
  const target = new File(Paths.document, fileName);
  const temp = new File(Paths.document, `.${fileName}.tmp`);
  temp.write(JSON.stringify(value, null, 2));
  await temp.move(target, { overwrite: true });
}
