import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';


const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const MOBILE_ROOT = path.resolve(SCRIPT_DIR, '..');
const JNI_LIBS_DIR = path.join(MOBILE_ROOT, 'modules', 'expo-syncthing', 'android', 'src', 'main', 'jniLibs');

// Pinned Syncthing version (syncthing-android v2.1.6.0 matching desktop v2.1.6)
const PINNED_VERSION = 'v2.1.6.0';
const BASE_URL = `https://github.com/researchxxl/syncthing-android/releases/download/${PINNED_VERSION}`;

// Pinned SHA-256 checksums of the release APKs and extracted libsyncthingnative.so
const ARTIFACTS = {
  'arm64-v8a': {
    apkName: `com.github.catfriend1.syncthingfork_release_${PINNED_VERSION}_arm64-v8a.apk`,
    libSoName: 'lib/arm64-v8a/libsyncthingnative.so',
    expectedLibSha256: '7edcabbd3c02b6bb6829fb217b57cba52cb063021dd895221b42b4d3dd1d3864',
  },
  'x86_64': {
    apkName: `com.github.catfriend1.syncthingfork_release_${PINNED_VERSION}_x86_64.apk`,
    libSoName: 'lib/x86_64/libsyncthingnative.so',
    expectedLibSha256: '88bf4bfeefd6bdcd1ab6e4a51e61cd6e705bd0526700ebd7db41ae665190fa26',
  },
};

function sha256File(filePath) {
  const data = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(data).digest('hex');
}

async function downloadFile(url, destPath) {
  console.log(`Downloading ${url} -> ${destPath}...`);
  execSync(`curl -sL --retry 3 -o "${destPath}" "${url}"`, { stdio: 'inherit' });
}

export async function fetchAndroidSyncthing() {
  console.log(`=== Fetching Android Syncthing ${PINNED_VERSION} native binaries ===\n`);
  fs.mkdirSync(JNI_LIBS_DIR, { recursive: true });
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'tmp_fetch_syncthing_'));


  try {
    for (const [abi, info] of Object.entries(ARTIFACTS)) {
      const targetDir = path.join(JNI_LIBS_DIR, abi);
      fs.mkdirSync(targetDir, { recursive: true });
      const targetSoPath = path.join(targetDir, 'libsyncthing.so');

      if (fs.existsSync(targetSoPath)) {
        const currentSha = sha256File(targetSoPath);
        if (currentSha === info.expectedLibSha256) {
          console.log(`✓ ${abi}/libsyncthing.so already present and matches expected SHA-256.`);
          continue;
        }
      }

      const apkDownloadUrl = `${BASE_URL}/${info.apkName}`;
      const apkPath = path.join(tmpDir, info.apkName);
      await downloadFile(apkDownloadUrl, apkPath);

      console.log(`Extracting ${info.libSoName} to ${targetSoPath}...`);
      execSync(`unzip -p "${apkPath}" "${info.libSoName}" > "${targetSoPath}"`, { stdio: 'inherit' });
      fs.chmodSync(targetSoPath, 0o755);

      const actualSha = sha256File(targetSoPath);
      if (actualSha !== info.expectedLibSha256) {
        throw new Error(`Checksum mismatch for ${abi}! Expected ${info.expectedLibSha256}, got ${actualSha}`);
      }
      console.log(`✓ ${abi} verified successfully (SHA-256: ${actualSha})\n`);
    }

    console.log('=== All Android Syncthing binaries verified and placed in jniLibs! ===\n');
  } finally {
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}

if (process.argv[1] && process.argv[1].endsWith('fetchAndroidSyncthing.mjs')) {
  fetchAndroidSyncthing().catch((err) => {
    console.error('Failed to fetch Android Syncthing:', err);
    process.exit(1);
  });
}
