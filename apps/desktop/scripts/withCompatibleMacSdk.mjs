#!/usr/bin/env node
/**
 * macOS 27 SDK TBD stubs list `arm64e.x1`, which older Command Line Tools
 * linkers reject ("tapi error: malformed file / unknown architecture").
 * Prefer a known-good SDK when the active one is unusable with the current ld.
 */
import { execFileSync, spawn } from "node:child_process";
import { existsSync, readFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const PREFERRED_SDKS = [
  "/Library/Developer/CommandLineTools/SDKs/MacOSX26.5.sdk",
  "/Library/Developer/CommandLineTools/SDKs/MacOSX26.sdk",
  "/Library/Developer/CommandLineTools/SDKs/MacOSX15.4.sdk",
  "/Library/Developer/CommandLineTools/SDKs/MacOSX15.sdk",
];

function activeSdkPath() {
  try {
    return execFileSync("xcrun", ["--sdk", "macosx", "--show-sdk-path"], {
      encoding: "utf8",
    }).trim();
  } catch {
    return undefined;
  }
}

function tbdListsArm64eX1(sdkRoot) {
  const tbd = join(sdkRoot, "usr/lib/libSystem.tbd");
  if (!existsSync(tbd)) return false;
  return readFileSync(tbd, "utf8").slice(0, 1024).includes("arm64e.x1");
}

function canLinkWithSdk(sdkRoot) {
  const dir = mkdtempSync(join(tmpdir(), "davinci-sdk-"));
  const src = join(dir, "t.c");
  const out = join(dir, "t");
  writeFileSync(src, "int main(void){return 0;}\n");
  try {
    execFileSync(
      "clang",
      [src, "-isysroot", sdkRoot, "-o", out],
      { stdio: "ignore" },
    );
    return true;
  } catch {
    return false;
  }
}

function resolveSdkRoot() {
  if (process.platform !== "darwin") return process.env.SDKROOT;
  if (process.env.SDKROOT) return process.env.SDKROOT;

  const active = activeSdkPath();
  if (!active) return undefined;
  if (!tbdListsArm64eX1(active) || canLinkWithSdk(active)) return active;

  for (const candidate of PREFERRED_SDKS) {
    if (existsSync(candidate) && canLinkWithSdk(candidate)) {
      console.warn(
        `[withCompatibleMacSdk] Active SDK cannot link (arm64e.x1). Using ${candidate}`,
      );
      return candidate;
    }
  }

  console.warn(
    "[withCompatibleMacSdk] No compatible macOS SDK found; continuing with default.",
  );
  return active;
}

const sdkRoot = resolveSdkRoot();
const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("usage: withCompatibleMacSdk.mjs <command> [args...]");
  process.exit(1);
}

const env = { ...process.env };
if (sdkRoot) env.SDKROOT = sdkRoot;

const child = spawn(args[0], args.slice(1), {
  stdio: "inherit",
  env,
  shell: process.platform === "win32",
});
child.on("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
