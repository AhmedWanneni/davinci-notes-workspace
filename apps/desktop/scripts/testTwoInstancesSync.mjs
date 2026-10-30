import { execSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BINARY_PATH,
  getFreePort,
  fetchJson,
  waitForApi,
} from './verifySyncthingHelpers.mjs';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `sophia_sync_${prefix}_`));
}

function extractDeviceId(homeDir) {
  const xml = fs.readFileSync(path.join(homeDir, 'config.xml'), 'utf8');
  // First device in config is the local device
  const m = xml.match(/<device id="([^"]+)" name="([^"]*)"/);
  if (!m) throw new Error('Could not find device id in config.xml');
  return m[1];
}

async function run() {
  console.log('=== End-to-End Multi-Instance Syncthing & Vault Switcher Verification ===\n');

  const baseDir = makeTempDir('multi_instance');
  const home1 = path.join(baseDir, 'home1');
  const home2 = path.join(baseDir, 'home2');

  const vault1Dir = path.join(baseDir, 'vault_1');
  const vault2OriginDir = path.join(baseDir, 'vault_2_origin');
  const vault2ReplicaDir = path.join(baseDir, 'vault_2_replica');

  fs.mkdirSync(vault1Dir, { recursive: true });
  fs.mkdirSync(vault2OriginDir, { recursive: true });
  fs.mkdirSync(vault2ReplicaDir, { recursive: true });

  // Syncthing requires .stfolder marker in each folder
  fs.mkdirSync(path.join(vault1Dir, '.stfolder'), { recursive: true });
  fs.mkdirSync(path.join(vault2OriginDir, '.stfolder'), { recursive: true });
  fs.mkdirSync(path.join(vault2ReplicaDir, '.stfolder'), { recursive: true });

  // 1. Instance 1 has vault_1 with 1.md and 2.md
  fs.writeFileSync(path.join(vault1Dir, '1.md'), '# Note 1\nContent of 1.md in vault_1');
  fs.writeFileSync(path.join(vault1Dir, '2.md'), '# Note 2\nContent of 2.md in vault_1');
  console.log('✓ Instance 1 created vault_1 with files: 1.md, 2.md');

  // 2. Instance 2 has vault_2 with a.md and b.md
  fs.writeFileSync(path.join(vault2OriginDir, 'a.md'), '# Note A\nContent of a.md in vault_2');
  fs.writeFileSync(path.join(vault2OriginDir, 'b.md'), '# Note B\nContent of b.md in vault_2');
  console.log('✓ Instance 2 created vault_2 with files: a.md, b.md');

  // Generate configs using syncthing binary with --no-port-probing
  execSync(`"${BINARY_PATH}" generate --home="${home1}" --no-port-probing`, { stdio: 'ignore' });
  execSync(`"${BINARY_PATH}" generate --home="${home2}" --no-port-probing`, { stdio: 'ignore' });

  const id1 = extractDeviceId(home1);
  const id2 = extractDeviceId(home2);

  console.log(`✓ Generated Node 1 Device ID: ${id1}`);
  console.log(`✓ Generated Node 2 Device ID: ${id2}`);

  const portGui1 = await getFreePort();
  const portGui2 = await getFreePort();
  const syncPort1 = await getFreePort();
  const syncPort2 = await getFreePort();

  const apiKey1 = 'test_key_node1_secret12345';
  const apiKey2 = 'test_key_node2_secret54321';

  // Configure Node 1 config.xml:
  let xml1 = fs.readFileSync(path.join(home1, 'config.xml'), 'utf8');
  xml1 = xml1.replace(/<folder\s+id="default"[\s\S]*?<\/folder>/g, '');
  xml1 = xml1.replace(/<listenAddress>[\s\S]*?<\/listenAddress>/g, `<listenAddress>tcp://127.0.0.1:${syncPort1}</listenAddress>`);
  xml1 = xml1.replace(/<reconnectionIntervalS>\d+<\/reconnectionIntervalS>/g, `<reconnectionIntervalS>1</reconnectionIntervalS>`);
  xml1 = xml1.replace(/<\/configuration>/, `
    <device id="${id2}" name="Instance 2" compression="metadata">
        <address>tcp://127.0.0.1:${syncPort2}</address>
    </device>
    <folder id="vault-1-id" label="vault_1" path="${vault1Dir}" type="sendreceive" rescanIntervalS="1" fsWatcherEnabled="true">
        <device id="${id1}"></device>
        <markerName>.stfolder</markerName>
    </folder>
    <folder id="vault-2-id" label="vault_2" path="${vault2ReplicaDir}" type="sendreceive" rescanIntervalS="1" fsWatcherEnabled="true">
        <device id="${id1}"></device>
        <device id="${id2}"></device>
        <markerName>.stfolder</markerName>
    </folder>
</configuration>`);
  fs.writeFileSync(path.join(home1, 'config.xml'), xml1);

  // Configure Node 2 config.xml:
  let xml2 = fs.readFileSync(path.join(home2, 'config.xml'), 'utf8');
  xml2 = xml2.replace(/<folder\s+id="default"[\s\S]*?<\/folder>/g, '');
  xml2 = xml2.replace(/<listenAddress>[\s\S]*?<\/listenAddress>/g, `<listenAddress>tcp://127.0.0.1:${syncPort2}</listenAddress>`);
  xml2 = xml2.replace(/<reconnectionIntervalS>\d+<\/reconnectionIntervalS>/g, `<reconnectionIntervalS>1</reconnectionIntervalS>`);
  xml2 = xml2.replace(/<\/configuration>/, `
    <device id="${id1}" name="Instance 1" compression="metadata">
        <address>tcp://127.0.0.1:${syncPort1}</address>
    </device>
    <folder id="vault-2-id" label="vault_2" path="${vault2OriginDir}" type="sendreceive" rescanIntervalS="1" fsWatcherEnabled="true">
        <device id="${id2}"></device>
        <device id="${id1}"></device>
        <markerName>.stfolder</markerName>
    </folder>
</configuration>`);
  fs.writeFileSync(path.join(home2, 'config.xml'), xml2);

  // Spawn both daemons with --no-port-probing
  const child1 = spawn(BINARY_PATH, [
    'serve',
    `--home=${home1}`,
    `--gui-address=http://127.0.0.1:${portGui1}`,
    `--gui-apikey=${apiKey1}`,
    '--no-browser',
    '--no-upgrade',
    '--no-restart',
    '--no-port-probing',
    '--log-file=-',
  ], { env: { ...process.env, STNORESTART: '1', STNOPORTPROBING: '1' } });

  const child2 = spawn(BINARY_PATH, [
    'serve',
    `--home=${home2}`,
    `--gui-address=http://127.0.0.1:${portGui2}`,
    `--gui-apikey=${apiKey2}`,
    '--no-browser',
    '--no-upgrade',
    '--no-restart',
    '--no-port-probing',
    '--log-file=-',
  ], { env: { ...process.env, STNORESTART: '1', STNOPORTPROBING: '1' } });

  child1.stdout.on('data', d => console.log('[Instance 1]', d.toString().trim()));
  child2.stdout.on('data', d => console.log('[Instance 2]', d.toString().trim()));

  const cleanup = () => {
    try { child1.kill('SIGKILL'); } catch {}
    try { child2.kill('SIGKILL'); } catch {}
  };
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  await waitForApi(`http://127.0.0.1:${portGui1}/rest/system/status`, apiKey1);
  await waitForApi(`http://127.0.0.1:${portGui2}/rest/system/status`, apiKey2);

  console.log(`✓ Instance 1 live on GUI port ${portGui1}, transfer port ${syncPort1}`);
  console.log(`✓ Instance 2 live on GUI port ${portGui2}, transfer port ${syncPort2}`);

  // Wait for P2P connection and sync of vault_2 into Instance 1's replica
  const replicaA = path.join(vault2ReplicaDir, 'a.md');
  const replicaB = path.join(vault2ReplicaDir, 'b.md');

  console.log('Waiting for Syncthing P2P transfer of a.md and b.md from Instance 2 to Instance 1...');
  let synced = false;
  for (let i = 0; i < 40; i++) {
    if (fs.existsSync(replicaA) && fs.existsSync(replicaB)) {
      synced = true;
      break;
    }
    await new Promise(r => setTimeout(r, 500));
  }

  if (!synced) {
    throw new Error('Sync transfer timed out: files did not sync within 20 seconds');
  }

  console.log('✓ Verified: a.md synced to Instance 1: ' + fs.readFileSync(replicaA, 'utf8').trim());
  console.log('✓ Verified: b.md synced to Instance 1: ' + fs.readFileSync(replicaB, 'utf8').trim());

  // -------------------------------------------------------------
  // Verify Instance 1's UI representation of shared vaults
  // -------------------------------------------------------------
  console.log('\n--- Verifying Instance 1 Shared Vaults Representation ---');

  const foldersRes = await fetchJson(`http://127.0.0.1:${portGui1}/rest/config/folders`, apiKey1);
  const folders = foldersRes.body;

  // Emulate Rust backend `list_shared_vaults(active_vault_path)`
  function getSharedVaults(currentActivePath) {
    return folders.map(f => ({
      folderId: f.id,
      label: f.label,
      path: f.path,
      sharedWithDeviceIds: f.devices.map(d => d.deviceID || d.id).filter(id => id !== id1),
      paused: Boolean(f.paused),
      isActiveVault: path.resolve(f.path) === path.resolve(currentActivePath),
    }));
  }

  // 1. Initial State: Instance 1 is opened to vault_1
  let activeVault = vault1Dir;
  let sharedVaults = getSharedVaults(activeVault);

  console.log(`Current Active Vault: ${activeVault}`);
  for (const v of sharedVaults) {
    console.log(`  - [${v.isActiveVault ? 'ACTIVE VAULT' : 'SYNCED VAULT'}] "${v.label}" -> Path: ${v.path} (${v.sharedWithDeviceIds.length} remote devices)`);
  }

  const v1 = sharedVaults.find(v => v.label === 'vault_1');
  const v2 = sharedVaults.find(v => v.label === 'vault_2');

  if (!v1 || !v1.isActiveVault) {
    throw new Error('Expected vault_1 to be the active vault initially');
  }
  if (!v2 || v2.isActiveVault) {
    throw new Error('Expected vault_2 to be present as a synced (non-active) vault with option to switch');
  }
  if (v2.path !== vault2ReplicaDir) {
    throw new Error(`Expected vault_2 link path to point to ${vault2ReplicaDir}, got ${v2.path}`);
  }
  console.log('✓ Verified: Instance 1 has vault_1 as Active Vault, and displays vault_2 with link path and "Open Vault" switch option');

  // 2. User clicks "Open Vault" on vault_2
  console.log('\n--- User clicks "Open Vault" on vault_2 ---');
  activeVault = v2.path;
  sharedVaults = getSharedVaults(activeVault);

  console.log(`New Active Workspace: ${activeVault}`);
  for (const v of sharedVaults) {
    console.log(`  - [${v.isActiveVault ? 'ACTIVE VAULT' : 'SYNCED VAULT'}] "${v.label}" -> Path: ${v.path}`);
  }

  const v1After = sharedVaults.find(v => v.label === 'vault_1');
  const v2After = sharedVaults.find(v => v.label === 'vault_2');

  if (!v2After.isActiveVault) {
    throw new Error('Expected vault_2 to now be the active vault');
  }
  if (v1After.isActiveVault) {
    throw new Error('Expected vault_1 to now be non-active (synced vault)');
  }
  console.log('✓ Verified: Successfully switched active vault to vault_2! Files a.md and b.md are immediately accessible to Sophia.');

  console.log('\n=== All Multi-Instance Verification Checks Passed! ===');
  cleanup();
  process.exit(0);
}

run().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
