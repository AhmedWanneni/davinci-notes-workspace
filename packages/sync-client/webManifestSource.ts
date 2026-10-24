import type { ManifestFile, ManifestSource } from "./manifest";
import type { PkceProvider } from "./driveAuth";

export interface WebVaultFileReader {
  listVaultFiles(): Promise<readonly ManifestFile[]>;
  readBinaryFile(path: string): Promise<Uint8Array>;
}

export async function computeHexDigest(bytes: Uint8Array): Promise<string> {
  if (
    typeof crypto !== "undefined" &&
    crypto.subtle &&
    typeof crypto.subtle.digest === "function"
  ) {
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength,
      ) as ArrayBuffer,
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  // Deterministic FNV-1a 64-bit fallback if Web Crypto is unavailable
  let h1 = 0xdeadbeef ^ bytes.length;
  let h2 = 0x41c6ce57 ^ bytes.length;
  for (let i = 0; i < bytes.length; i++) {
    const ch = bytes[i];
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0")
  );
}

export function createWebManifestSource(
  reader: WebVaultFileReader,
): ManifestSource {
  return {
    listFiles: () => reader.listVaultFiles(),
    hashFile: async (path: string) => {
      const bytes = await reader.readBinaryFile(path);
      return computeHexDigest(bytes);
    },
  };
}

export function createWebPkceProvider(): PkceProvider {
  return {
    randomBytes: (length: number) => {
      const random = new Uint8Array(length);
      crypto.getRandomValues(random);
      return random;
    },
    sha256: async (value: string) => {
      const encoded = new TextEncoder().encode(value);
      const digest = await crypto.subtle.digest("SHA-256", encoded);
      return new Uint8Array(digest);
    },
  };
}
