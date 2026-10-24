import { spawn, execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';

const SCRIPT_DIR = path.dirname(new URL(import.meta.url).pathname);
const DESKTOP_ROOT = path.resolve(SCRIPT_DIR, '..');
const BINARY_PATH = path.join(DESKTOP_ROOT, 'src-tauri', 'binaries', 'syncthing-aarch64-apple-darwin');

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = http.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

function fetchJson(url, apiKey, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, {
      method: options.method || 'GET',
      headers: {
        'X-API-Key': apiKey,
        ...(options.headers || {}),
      },
      timeout: 3000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null, raw: data });
        } catch {
          resolve({ status: res.statusCode, body: null, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => req.destroy(new Error('timeout')));
    req.end();
  });
}

async function waitForApi(url, apiKey, maxAttempts = 30) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetchJson(url, apiKey);
      if (res.status === 200 && res.body?.myID) {
        return res.body;
      }
    } catch {}
    await new Promise(r => setTimeout(r, 400));
  }
  throw new Error(`Timed out waiting for Syncthing API at ${url}`);
}

function spawnSyncthing(homeDir, port, apiKey) {
  fs.mkdirSync(homeDir, { recursive: true });
  const child = spawn(BINARY_PATH, [
    'serve',
    `--home=${homeDir}`,
    `--gui-address=http://127.0.0.1:${port}`,
    `--gui-apikey=${apiKey}`,
    '--no-browser',
    '--no-upgrade',
    '--no-restart',
    '--log-file=-',
  ], {
    env: { ...process.env, STNORESTART: '1', STNOUPGRADE: '1' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return child;
}

function stripDefaultFolders(configPath) {
  if (!fs.existsSync(configPath)) return;
  let xml = fs.readFileSync(configPath, 'utf8');
  xml = xml.replace(/<folder\s+id="default"[\s\S]*?<\/folder>/g, '');
  fs.writeFileSync(configPath, xml, 'utf8');
}

export {
  BINARY_PATH,
  getFreePort,
  fetchJson,
  waitForApi,
  spawnSyncthing,
  stripDefaultFolders,
};
