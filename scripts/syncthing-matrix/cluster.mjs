import { spawn, execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export const DESKTOP_URL = "http://127.0.0.1:8384";
export const DESKTOP_KEY = "nwF6b6CCKZj5nePcYqeco4ZSiTKvgum4";
export const DESKTOP_VAULT = "/tmp/matrix-vault-desktop";

export const MOBILE_URL = "http://127.0.0.1:8385";
export const MOBILE_KEY = "mobile-matrix-test-api-key-9999";
export const MOBILE_VAULT = "/tmp/matrix-vault-mobile";
export const MOBILE_HOME = "/tmp/st-peer-matrix";

export const FOLDER_ID = "matrix-sync-vault";

let mobileProcess = null;
let desktopId = "";
let mobileId = "";

export async function request(baseUrl, apiKey, endpoint, method = "GET", body = null) {
  const url = `${baseUrl}${endpoint}`;
  const headers = { "X-API-Key": apiKey };
  if (body) headers["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${method} ${endpoint} failed (${res.status}): ${text}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function initCluster() {
  // 1. Prepare vault directories with .stfolder markers
  fs.rmSync(DESKTOP_VAULT, { recursive: true, force: true });
  fs.rmSync(MOBILE_VAULT, { recursive: true, force: true });
  fs.mkdirSync(DESKTOP_VAULT, { recursive: true });
  fs.mkdirSync(MOBILE_VAULT, { recursive: true });
  fs.mkdirSync(path.join(DESKTOP_VAULT, ".stfolder"), { recursive: true });
  fs.mkdirSync(path.join(MOBILE_VAULT, ".stfolder"), { recursive: true });

  // 2. Query Desktop Device ID
  const deskStatus = await request(DESKTOP_URL, DESKTOP_KEY, "/rest/system/status");
  desktopId = deskStatus.myID;

  // 3. Generate Peer Home if not exists
  fs.rmSync(MOBILE_HOME, { recursive: true, force: true });
  execSync(`syncthing generate --home=${MOBILE_HOME}`, { stdio: "ignore" });

  // Customize config.xml for mobile peer: port 8385, key, listen 22002
  const configPath = path.join(MOBILE_HOME, "config.xml");
  let xml = fs.readFileSync(configPath, "utf8");
  xml = xml.replace(/<address>127\.0\.0\.1:\d+<\/address>/, `<address>127.0.0.1:8385</address>`);
  xml = xml.replace(/<apikey>[^<]+<\/apikey>/, `<apikey>${MOBILE_KEY}</apikey>`);
  xml = xml.replace(/<listenAddress>tcp:\/\/0\.0\.0\.0:\d+<\/listenAddress>/, `<listenAddress>tcp://127.0.0.1:22002</listenAddress>`);
  xml = xml.replace(/<listenAddress>quic:\/\/0\.0\.0\.0:\d+<\/listenAddress>/, `<listenAddress>quic://127.0.0.1:22002</listenAddress>`);
  fs.writeFileSync(configPath, xml, "utf8");

  // Read mobile device ID from generated config
  const idMatch = xml.match(/<device id="([^"]+)"/);
  if (!idMatch) throw new Error("Could not extract mobile device ID from config.xml");
  mobileId = idMatch[1];

  // 4. Spawn Mobile Syncthing
  mobileProcess = spawn("syncthing", ["serve", "--home=" + MOBILE_HOME, "--no-browser", "--no-restart"], {
    stdio: "ignore",
  });

  // 5. Poll for mobile instance ready
  for (let i = 0; i < 50; i++) {
    try {
      const ping = await request(MOBILE_URL, MOBILE_KEY, "/rest/system/ping");
      if (ping.ping === "pong") break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  // 6. Configure devices and folders on both nodes
  await pairNodes();
}

async function pairNodes() {
  // Add mobile device to desktop
  const deskCfg = await request(DESKTOP_URL, DESKTOP_KEY, "/rest/config");
  if (!deskCfg.devices.some((d) => d.deviceID === mobileId)) {
    deskCfg.devices.push({
      deviceID: mobileId,
      name: "Mobile Phone Test",
      addresses: ["tcp://127.0.0.1:22002"],
      paused: false,
    });
  }

  // Add folder to desktop
  const existingDeskFolder = deskCfg.folders.find((f) => f.id === FOLDER_ID);
  if (existingDeskFolder) {
    existingDeskFolder.path = DESKTOP_VAULT;
    existingDeskFolder.devices = [{ deviceID: desktopId }, { deviceID: mobileId }];
    existingDeskFolder.fsWatcherEnabled = true;
    existingDeskFolder.rescanIntervalS = 1;
  } else {
    deskCfg.folders.push({
      id: FOLDER_ID,
      label: "Matrix Sync Vault",
      path: DESKTOP_VAULT,
      type: "sendreceive",
      fsWatcherEnabled: true,
      rescanIntervalS: 1,
      devices: [{ deviceID: desktopId }, { deviceID: mobileId }],
    });
  }
  await request(DESKTOP_URL, DESKTOP_KEY, "/rest/config", "PUT", deskCfg);

  // Configure mobile node
  const mobCfg = await request(MOBILE_URL, MOBILE_KEY, "/rest/config");
  if (!mobCfg.devices.some((d) => d.deviceID === desktopId)) {
    mobCfg.devices.push({
      deviceID: desktopId,
      name: "Desktop Mac Test",
      addresses: ["tcp://127.0.0.1:22000"],
      paused: false,
    });
  }
  mobCfg.folders = [
    {
      id: FOLDER_ID,
      label: "Matrix Sync Vault",
      path: MOBILE_VAULT,
      type: "sendreceive",
      fsWatcherEnabled: true,
      rescanIntervalS: 1,
      devices: [{ deviceID: desktopId }, { deviceID: mobileId }],
    },
  ];
  await request(MOBILE_URL, MOBILE_KEY, "/rest/config", "PUT", mobCfg);

  // Restart scans
  await triggerScan("desktop");
  await triggerScan("mobile");
}

export async function triggerScan(target = "all") {
  if (target === "desktop" || target === "all") {
    await request(DESKTOP_URL, DESKTOP_KEY, `/rest/db/scan?folder=${FOLDER_ID}`, "POST").catch(() => {});
  }
  if (target === "mobile" || target === "all") {
    await request(MOBILE_URL, MOBILE_KEY, `/rest/db/scan?folder=${FOLDER_ID}`, "POST").catch(() => {});
  }
}

export async function pauseFolder(target = "mobile", paused = true) {
  const url = target === "desktop" ? DESKTOP_URL : MOBILE_URL;
  const key = target === "desktop" ? DESKTOP_KEY : MOBILE_KEY;

  const cfg = await request(url, key, "/rest/config");
  const folder = cfg.folders.find((f) => f.id === FOLDER_ID);
  if (folder) {
    folder.paused = paused;
    await request(url, key, "/rest/config", "PUT", cfg);
  }
}

export async function pauseDevice(remoteFrom = "desktop", paused = true) {
  const url = remoteFrom === "desktop" ? DESKTOP_URL : MOBILE_URL;
  const key = remoteFrom === "desktop" ? DESKTOP_KEY : MOBILE_KEY;
  const targetId = remoteFrom === "desktop" ? mobileId : desktopId;

  const cfg = await request(url, key, "/rest/config");
  const dev = cfg.devices.find((d) => d.deviceID === targetId);
  if (dev) {
    dev.paused = paused;
    await request(url, key, "/rest/config", "PUT", cfg);
  }
}

export async function waitForCondition(checkFn, timeoutMs = 15000, intervalMs = 250) {
  const start = performance.now();
  while (performance.now() - start < timeoutMs) {
    try {
      const res = await checkFn();
      if (res) return res;
    } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(`Condition timed out after ${timeoutMs}ms`);
}

export async function teardownCluster() {
  if (mobileProcess) {
    mobileProcess.kill("SIGTERM");
    mobileProcess = null;
  }
  fs.rmSync(MOBILE_HOME, { recursive: true, force: true });
}

export function getDeviceIds() {
  return { desktopId, mobileId };
}
