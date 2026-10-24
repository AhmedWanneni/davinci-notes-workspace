#!/usr/bin/env node
import { execFileSync, execSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  chmodSync,
  createWriteStream,
  existsSync,
  mkdirSync,
  rmSync,
  statSync,
} from "node:fs";
import https from "node:https";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PINNED_SYNCTHING_VERSION = "v2.1.6";

export const TARGET_METADATA = {
  "aarch64-apple-darwin": {
    asset: "syncthing-macos-arm64-v2.1.6.zip",
    sha256: "f86bfa0bdbb5b1b13229a7e5643e898e3c4e017a4fff6dd525994ebaf28ff6e2",
    binaryName: "syncthing",
    archiveType: "zip",
  },
  "x86_64-apple-darwin": {
    asset: "syncthing-macos-amd64-v2.1.6.zip",
    sha256: "d1464be24a7157440dfb52e2d84939f83caf89c129761945abcdd4956e09ffb1",
    binaryName: "syncthing",
    archiveType: "zip",
  },
  "x86_64-unknown-linux-gnu": {
    asset: "syncthing-linux-amd64-v2.1.6.tar.gz",
    sha256: "524ef4e1df1850b719e2378c8369956f4e5f2ab9a46fdf7f45f2b925012147aa",
    binaryName: "syncthing",
    archiveType: "tar.gz",
  },
  "aarch64-unknown-linux-gnu": {
    asset: "syncthing-linux-arm64-v2.1.6.tar.gz",
    sha256: "f054de02462d5d58bd126908f2f92b63aba74f162a5be85e50e96d656e7db47d",
    binaryName: "syncthing",
    archiveType: "tar.gz",
  },
  "x86_64-pc-windows-msvc": {
    asset: "syncthing-windows-amd64-v2.1.6.zip",
    sha256: "589098269cabb9a5a1703a934305b4153609d7623e978e1c94f0f49d77ae5e9f",
    binaryName: "syncthing.exe",
    archiveType: "zip",
  },
  "aarch64-pc-windows-msvc": {
    asset: "syncthing-windows-arm64-v2.1.6.zip",
    sha256: "ddb25a3cf556157e329263bd3331d889ea7bb952b85a5f530320175105bab072",
    binaryName: "syncthing.exe",
    archiveType: "zip",
  },
};

export function detectHostTargetTriple() {
  try {
    const output = execSync("rustc -vV", { encoding: "utf8" });
    const match = output.match(/host:\s+([^\s]+)/);
    if (match?.[1]) return match[1];
  } catch {
    // rustc not found or failed, fallback to node platform detection
  }

  const p = process.platform;
  const a = process.arch;

  if (p === "darwin") return a === "arm64" ? "aarch64-apple-darwin" : "x86_64-apple-darwin";
  if (p === "linux") return a === "arm64" ? "aarch64-unknown-linux-gnu" : "x86_64-unknown-linux-gnu";
  if (p === "win32") return a === "arm64" ? "aarch64-pc-windows-msvc" : "x86_64-pc-windows-msvc";

  throw new Error(`Unsupported platform/architecture: ${p}/${a}`);
}

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          downloadFile(res.headers.location, destPath).then(resolve).catch(reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: status code ${res.statusCode}`));
          return;
        }
        const fileStream = createWriteStream(destPath);
        res.pipe(fileStream);
        fileStream.on("finish", () => {
          fileStream.close(() => resolve());
        });
        fileStream.on("error", reject);
      })
      .on("error", reject);
  });
}

function computeFileSha256(filePath) {
  return new Promise((resolve, reject) => {
    import("node:fs").then(({ createReadStream }) => {
      const hash = createHash("sha256");
      const stream = createReadStream(filePath);
      stream.on("data", (data) => hash.update(data));
      stream.on("end", () => resolve(hash.digest("hex")));
      stream.on("error", reject);
    });
  });
}

export async function fetchSyncthingBinary(targetTriple, options = {}) {
  const meta = TARGET_METADATA[targetTriple];
  if (!meta) {
    throw new Error(`Target triple '${targetTriple}' not recognized in Syncthing metadata.`);
  }

  const binariesDir = path.resolve(__dirname, "../src-tauri/binaries");
  mkdirSync(binariesDir, { recursive: true });

  const ext = targetTriple.includes("windows") ? ".exe" : "";
  const targetBinName = `syncthing-${targetTriple}${ext}`;
  const targetBinPath = path.join(binariesDir, targetBinName);

  if (!options.force && existsSync(targetBinPath)) {
    const size = statSync(targetBinPath).size;
    if (size > 10 * 1024 * 1024) {
      console.log(`[fetchSyncthing] Binary already exists and verified: ${targetBinPath} (${(size / 1024 / 1024).toFixed(1)} MB)`);
      return targetBinPath;
    }
  }

  const downloadUrl = `https://github.com/syncthing/syncthing/releases/download/${PINNED_SYNCTHING_VERSION}/${meta.asset}`;
  const tmpDir = path.join(os.tmpdir(), `syncthing-fetch-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });
  const archivePath = path.join(tmpDir, meta.asset);

  console.log(`[fetchSyncthing] Downloading Syncthing ${PINNED_SYNCTHING_VERSION} for ${targetTriple}...`);
  console.log(`[fetchSyncthing] URL: ${downloadUrl}`);
  await downloadFile(downloadUrl, archivePath);

  console.log(`[fetchSyncthing] Verifying SHA-256 against published checksum...`);
  const actualSha256 = await computeFileSha256(archivePath);
  if (actualSha256.toLowerCase() !== meta.sha256.toLowerCase()) {
    rmSync(tmpDir, { recursive: true, force: true });
    throw new Error(
      `SHA-256 checksum mismatch for ${meta.asset}!\nExpected: ${meta.sha256}\nActual:   ${actualSha256}`
    );
  }
  console.log(`[fetchSyncthing] Checksum valid: ${actualSha256}`);

  const extractDir = path.join(tmpDir, "extracted");
  mkdirSync(extractDir, { recursive: true });

  if (meta.archiveType === "zip") {
    execFileSync("unzip", ["-q", "-o", archivePath, "-d", extractDir]);
  } else {
    execFileSync("tar", ["-xzf", archivePath, "-C", extractDir]);
  }

  // Find the syncthing binary inside extracted directory
  const rootFolderName = meta.asset.replace(/\.(zip|tar\.gz)$/, "");
  const extractedBinPath = path.join(extractDir, rootFolderName, meta.binaryName);

  if (!existsSync(extractedBinPath)) {
    rmSync(tmpDir, { recursive: true, force: true });
    throw new Error(`Extracted binary not found at expected path: ${extractedBinPath}`);
  }

  const { copyFileSync } = await import("node:fs");
  copyFileSync(extractedBinPath, targetBinPath);
  chmodSync(targetBinPath, 0o755);

  rmSync(tmpDir, { recursive: true, force: true });

  const finalSize = statSync(targetBinPath).size;
  console.log(`[fetchSyncthing] Successfully placed: ${targetBinPath} (${(finalSize / 1024 / 1024).toFixed(1)} MB)`);
  return targetBinPath;
}

async function runCli() {
  const args = process.argv.slice(2);
  let target = process.env.TARGET;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--target" && args[i + 1]) {
      target = args[i + 1];
      i++;
    } else if (args[i] === "--force") {
      force = true;
    }
  }

  if (!target) {
    target = detectHostTargetTriple();
  }

  await fetchSyncthingBinary(target, { force });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runCli().catch((err) => {
    console.error("[fetchSyncthing] Error:", err.message);
    process.exit(1);
  });
}
