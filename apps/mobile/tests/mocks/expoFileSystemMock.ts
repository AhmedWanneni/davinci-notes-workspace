export const documentDirectory = "file:///app/sandbox/documents/";

interface MemNode {
  isDirectory: boolean;
  content?: string | Uint8Array;
  size: number;
  mtime: number;
}

export const inMemoryFs = new Map<string, MemNode>();
let mockPickedDirUri: string | null = null;

export function setMockPickedDirectory(uri: string | null): void {
  mockPickedDirUri = uri;
}

export function normalizeKey(uri: string): string {
  return uri.replace(/\/+$/, "");
}

export function resetInMemoryFs(): void {
  inMemoryFs.clear();
  inMemoryFs.set(normalizeKey(documentDirectory), {
    isDirectory: true,
    size: 0,
    mtime: Date.now(),
  });
  mockPickedDirUri = null;
}

resetInMemoryFs();

export const EncodingType = {
  UTF8: "utf8",
  Base64: "base64",
};

function joinPaths(...parts: (string | File | Directory)[]): string {
  const strParts = parts.map((p) => (typeof p === "string" ? p : p.uri));
  if (strParts.length === 0) return "";
  let result = strParts[0];
  for (let i = 1; i < strParts.length; i++) {
    const part = strParts[i];
    if (result.endsWith("/")) {
      result += part.startsWith("/") ? part.slice(1) : part;
    } else {
      result += part.startsWith("/") ? part : "/" + part;
    }
  }
  return result;
}

function getBaseName(uri: string): string {
  const norm = normalizeKey(uri);
  const idx = norm.lastIndexOf("/");
  return idx >= 0 ? norm.slice(idx + 1) : norm;
}

export class Paths {
  static get document() {
    return new Directory(documentDirectory);
  }
  static get cache() {
    return new Directory("file:///app/sandbox/cache/");
  }
  static get totalDiskSpace() {
    return 1024 * 1024 * 1024 * 64;
  }
  static get availableDiskSpace() {
    return 1024 * 1024 * 1024 * 32;
  }
  static info(...uris: string[]) {
    const uri = joinPaths(...uris);
    const key = normalizeKey(uri);
    const node = inMemoryFs.get(key);
    if (!node) {
      return { exists: false, isDirectory: null };
    }
    return { exists: true, isDirectory: node.isDirectory };
  }
}

export class Directory {
  static async pickDirectoryAsync(): Promise<Directory | null> {
    if (!mockPickedDirUri) return null;
    return new Directory(mockPickedDirUri);
  }

  readonly uri: string;

  constructor(...uris: (string | File | Directory)[]) {
    this.uri = joinPaths(...uris);
  }

  get name(): string {
    return getBaseName(this.uri);
  }

  get exists(): boolean {
    const key = normalizeKey(this.uri);
    const node = inMemoryFs.get(key);
    return !!node && node.isDirectory;
  }

  create(options?: { intermediates?: boolean; idempotent?: boolean }): void {
    const key = normalizeKey(this.uri);
    inMemoryFs.set(key, { isDirectory: true, size: 0, mtime: Date.now() });
    if (options?.intermediates) {
      const parts = key.split("/");
      let accum = "";
      for (let i = 0; i < parts.length - 1; i++) {
        accum = accum ? `${accum}/${parts[i]}` : parts[i];
        if (accum && !inMemoryFs.has(accum)) {
          inMemoryFs.set(accum, {
            isDirectory: true,
            size: 0,
            mtime: Date.now(),
          });
        }
      }
    }
  }

  delete(): void {
    const key = normalizeKey(this.uri);
    const prefix = key + "/";
    inMemoryFs.delete(key);
    for (const k of Array.from(inMemoryFs.keys())) {
      if (k.startsWith(prefix)) {
        inMemoryFs.delete(k);
      }
    }
  }

  list(): (Directory | File)[] {
    const dirKey = normalizeKey(this.uri);
    const prefix = dirKey + "/";
    const subEntries = new Map<string, boolean>();

    for (const [key, node] of inMemoryFs.entries()) {
      if (key.startsWith(prefix)) {
        const remainder = key.slice(prefix.length);
        const top = remainder.split("/")[0];
        if (!top) continue;
        const isDir = remainder.includes("/") || node.isDirectory;
        if (!subEntries.has(top) || isDir) {
          subEntries.set(top, isDir);
        }
      }
    }

    const result: (Directory | File)[] = [];
    for (const [name, isDir] of subEntries.entries()) {
      const childUri = `${prefix}${name}`;
      result.push(isDir ? new Directory(childUri) : new File(childUri));
    }
    return result;
  }

  info(): {
    exists: boolean;
    isDirectory: boolean;
    size: number;
    modificationTime: number;
  } {
    const key = normalizeKey(this.uri);
    const node = inMemoryFs.get(key);
    return {
      exists: this.exists,
      isDirectory: true,
      size: node?.size ?? 0,
      modificationTime: (node?.mtime ?? Date.now()) / 1000,
    };
  }

  async move(destination: Directory | File): Promise<void> {
    const fromKey = normalizeKey(this.uri);
    const toKey = normalizeKey(destination.uri);
    const prefix = fromKey + "/";
    for (const [key, node] of Array.from(inMemoryFs.entries())) {
      if (key === fromKey) {
        inMemoryFs.set(toKey, node);
        inMemoryFs.delete(fromKey);
      } else if (key.startsWith(prefix)) {
        inMemoryFs.set(toKey + "/" + key.slice(prefix.length), node);
        inMemoryFs.delete(key);
      }
    }
  }

  async copy(destination: Directory | File): Promise<void> {
    const fromKey = normalizeKey(this.uri);
    const toKey = normalizeKey(destination.uri);
    const prefix = fromKey + "/";
    for (const [key, node] of Array.from(inMemoryFs.entries())) {
      if (key === fromKey) {
        inMemoryFs.set(toKey, { ...node, mtime: Date.now() });
      } else if (key.startsWith(prefix)) {
        inMemoryFs.set(toKey + "/" + key.slice(prefix.length), {
          ...node,
          mtime: Date.now(),
        });
      }
    }
  }
}

export class File {
  readonly uri: string;

  constructor(...uris: (string | File | Directory)[]) {
    this.uri = joinPaths(...uris);
  }

  get name(): string {
    return getBaseName(this.uri);
  }

  get exists(): boolean {
    const key = normalizeKey(this.uri);
    const node = inMemoryFs.get(key);
    return !!node && !node.isDirectory;
  }

  get size(): number {
    return inMemoryFs.get(normalizeKey(this.uri))?.size ?? 0;
  }

  get lastModified(): number | null {
    const node = inMemoryFs.get(normalizeKey(this.uri));
    return node ? node.mtime : null;
  }

  get modificationTime(): number | null {
    return this.lastModified;
  }

  async text(): Promise<string> {
    return this.textSync();
  }

  textSync(): string {
    const node = inMemoryFs.get(normalizeKey(this.uri));
    if (!node || node.isDirectory)
      throw new Error(`File not found: ${this.uri}`);
    if (typeof node.content === "string") return node.content;
    if (node.content instanceof Uint8Array)
      return new TextDecoder().decode(node.content);
    return "";
  }

  async bytes(): Promise<Uint8Array> {
    const node = inMemoryFs.get(normalizeKey(this.uri));
    if (!node || node.isDirectory)
      throw new Error(`File not found: ${this.uri}`);
    if (node.content instanceof Uint8Array) return node.content;
    if (typeof node.content === "string")
      return new TextEncoder().encode(node.content);
    return new Uint8Array(0);
  }

  async base64(): Promise<string> {
    const b = await this.bytes();
    let binary = "";
    for (let i = 0; i < b.byteLength; i++) binary += String.fromCharCode(b[i]);
    return btoa(binary);
  }

  write(content: string | Uint8Array): void {
    const key = normalizeKey(this.uri);
    const size =
      typeof content === "string"
        ? new TextEncoder().encode(content).byteLength
        : content.byteLength;
    inMemoryFs.set(key, {
      isDirectory: false,
      content,
      size,
      mtime: Date.now(),
    });
  }

  delete(): void {
    inMemoryFs.delete(normalizeKey(this.uri));
  }

  async move(destination: Directory | File): Promise<void> {
    const fromKey = normalizeKey(this.uri);
    const toKey = normalizeKey(destination.uri);
    const node = inMemoryFs.get(fromKey);
    if (!node) throw new Error(`Cannot move non-existent path: ${this.uri}`);
    inMemoryFs.set(toKey, node);
    inMemoryFs.delete(fromKey);
  }

  async copy(destination: Directory | File): Promise<void> {
    const fromKey = normalizeKey(this.uri);
    const toKey = normalizeKey(destination.uri);
    const node = inMemoryFs.get(fromKey);
    if (!node) throw new Error(`Cannot copy non-existent path: ${this.uri}`);
    inMemoryFs.set(toKey, { ...node, mtime: Date.now() });
  }

  info(): {
    exists: boolean;
    uri: string;
    size?: number;
    modificationTime?: number;
  } {
    const node = inMemoryFs.get(normalizeKey(this.uri));
    if (!node || node.isDirectory) return { exists: false, uri: this.uri };
    return {
      exists: true,
      uri: this.uri,
      size: node.size,
      modificationTime: node.mtime / 1000,
    };
  }
}

// Transitional legacy shims for existing tests/helpers
export async function getInfoAsync(uri: string) {
  const info = Paths.info(uri);
  if (!info.exists) return { exists: false, uri };
  const key = normalizeKey(uri);
  const node = inMemoryFs.get(key);
  return {
    exists: true,
    isDirectory: info.isDirectory ?? false,
    size: node?.size ?? 0,
    modificationTime: (node?.mtime ?? Date.now()) / 1000,
    uri,
  };
}

export async function readDirectoryAsync(dirUri: string): Promise<string[]> {
  const dir = new Directory(dirUri);
  return dir.list().map((e) => e.name);
}

export async function readAsStringAsync(
  fileUri: string,
  options?: { encoding?: string },
): Promise<string> {
  const f = new File(fileUri);
  if (
    options?.encoding === "base64" ||
    options?.encoding === EncodingType.Base64
  ) {
    return f.base64();
  }
  return f.text();
}

export async function writeAsStringAsync(
  fileUri: string,
  contents: string,
  options?: { encoding?: string },
): Promise<void> {
  const f = new File(fileUri);
  if (
    options?.encoding === "base64" ||
    options?.encoding === EncodingType.Base64
  ) {
    try {
      const bin = atob(contents);
      const b = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) b[i] = bin.charCodeAt(i);
      f.write(b);
      return;
    } catch {
      // fallback
    }
  }
  f.write(contents);
}

export async function makeDirectoryAsync(
  dirUri: string,
  options?: { intermediates?: boolean },
): Promise<void> {
  new Directory(dirUri).create(options);
}

export async function deleteAsync(uri: string): Promise<void> {
  const info = Paths.info(uri);
  if (info.isDirectory) new Directory(uri).delete();
  else new File(uri).delete();
}

export async function moveAsync(options: {
  from: string;
  to: string;
}): Promise<void> {
  const info = Paths.info(options.from);
  if (info.isDirectory)
    await new Directory(options.from).move(new Directory(options.to));
  else await new File(options.from).move(new File(options.to));
}

export async function copyAsync(options: {
  from: string;
  to: string;
}): Promise<void> {
  const info = Paths.info(options.from);
  if (info.isDirectory)
    await new Directory(options.from).copy(new Directory(options.to));
  else await new File(options.from).copy(new File(options.to));
}

export const StorageAccessFramework = {
  readDirectoryAsync,
  readAsStringAsync,
  writeAsStringAsync,
  deleteAsync,
  makeDirectoryAsync,
};
