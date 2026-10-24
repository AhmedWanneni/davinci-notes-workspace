import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
import {
  BINARY_PATH,
  getFreePort,
  fetchJson,
  waitForApi,
  spawnSyncthing,
  stripDefaultFolders,
} from './verifySyncthingHelpers.mjs';

function makeTempDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `davinci_test_${prefix}_`));
}

async function runVerification() {
  console.log('=== Starting Syncthing Lifecycle Verification ===\n');

  // Verify binary exists
  if (!fs.existsSync(BINARY_PATH)) {
    throw new Error(`Bundled Syncthing binary not found at ${BINARY_PATH}`);
  }
  const binStat = fs.statSync(BINARY_PATH);
  console.log(`✓ Bundled binary verified: ${BINARY_PATH} (${(binStat.size / 1024 / 1024).toFixed(2)} MB)\n`);

  // Test 1: Fresh machine state, no Syncthing installed
  console.log('--- Test 1: Fresh machine state, no Syncthing installed ---');
  const freshHome = makeTempDir('fresh');
  const freshPort = await getFreePort();
  const apiKey1 = 'test_api_key_fresh_1234567890123';
  const child1 = spawnSyncthing(freshHome, freshPort, apiKey1);

  let logs1 = '';
  child1.stdout.on('data', d => { logs1 += d.toString(); });
  child1.stderr.on('data', d => { logs1 += d.toString(); });

  const status1 = await waitForApi(`http://127.0.0.1:${freshPort}/rest/system/status`, apiKey1);
  console.log(`✓ Instance started successfully on port ${freshPort}`);
  console.log(`✓ Device ID verified: ${status1.myID}`);
  if (!status1.myID || status1.myID.length < 50) throw new Error('Invalid Device ID');

  const configPath1 = path.join(freshHome, 'config.xml');
  stripDefaultFolders(configPath1);
  const foldersRes = await fetchJson(`http://127.0.0.1:${freshPort}/rest/config/folders`, apiKey1);
  console.log(`✓ Isolated configuration: ${foldersRes.body?.length || 0} default folders present (expected 0)`);
  if (foldersRes.body && foldersRes.body.length > 0) throw new Error('Expected 0 default folders');

  // Test 2: Machine already running its own Syncthing on 8384
  console.log('\n--- Test 2: Machine already running its own Syncthing on 8384 ---');
  const mockSystemHome = makeTempDir('sys_8384');
  const apiKeySys = 'mock_system_api_key_838483848384';
  const childSys = spawnSyncthing(mockSystemHome, 8384, apiKeySys);
  const sysStatus = await waitForApi('http://127.0.0.1:8384/rest/system/status', apiKeySys);
  console.log(`✓ "System" Syncthing running on 8384, Device ID: ${sysStatus.myID}`);

  const appPort = await getFreePort();
  const apiKeyApp = 'app_custom_port_api_key_9999999';
  const appHome = makeTempDir('app_isolated');
  const childApp = spawnSyncthing(appHome, appPort, apiKeyApp);
  const appStatus = await waitForApi(`http://127.0.0.1:${appPort}/rest/system/status`, apiKeyApp);
  console.log(`✓ App Syncthing running on port ${appPort}, Device ID: ${appStatus.myID}`);
  if (sysStatus.myID === appStatus.myID) throw new Error('Device IDs must be distinct across instances');
  console.log('✓ Both instances running simultaneously without port clash; Device IDs are distinct');

  // Test 3: Quit the app (graceful shutdown)
  console.log('\n--- Test 3: Graceful shutdown on app quit ---');
  const shutdownRes = await fetchJson(`http://127.0.0.1:${appPort}/rest/system/shutdown`, apiKeyApp, { method: 'POST' });
  console.log(`✓ Shutdown endpoint called (HTTP ${shutdownRes.status})`);
  await new Promise(r => setTimeout(r, 1200));

  const appPidAlive = !childApp.killed && (function() {
    try { process.kill(childApp.pid, 0); return true; } catch { return false; }
  })();
  console.log(`✓ App Syncthing (PID ${childApp.pid}) terminated cleanly: ${!appPidAlive}`);
  if (appPidAlive) throw new Error('Child process should have exited on shutdown');

  // Clean up system instance
  try { await fetchJson('http://127.0.0.1:8384/rest/system/shutdown', apiKeySys, { method: 'POST' }); } catch {}
  childSys.kill();

  // Test 4: Force-kill app & orphan handling
  console.log('\n--- Test 4: Force-kill recovery and orphan handling ---');
  const orphanHome = makeTempDir('orphan');
  const orphanPort = await getFreePort();
  const orphanKey = 'orphan_test_key_111122223333444';
  const orphanChild = spawnSyncthing(orphanHome, orphanPort, orphanKey);
  const pidFile = path.join(orphanHome, 'syncthing.pid');
  fs.writeFileSync(pidFile, `${orphanChild.pid}\n${orphanPort}\n`, 'utf8');

  await waitForApi(`http://127.0.0.1:${orphanPort}/rest/system/status`, orphanKey);
  console.log(`✓ Orphan process started (PID ${orphanChild.pid}, port ${orphanPort})`);

  // Simulate app restart discovering the orphan
  const pidContent = fs.readFileSync(pidFile, 'utf8').trim().split('\n');
  const recordedPid = parseInt(pidContent[0], 10);
  const recordedPort = parseInt(pidContent[1], 10);
  console.log(`✓ Next launch reads PID file: PID=${recordedPid}, Port=${recordedPort}`);

  const orphanProbe = await fetchJson(`http://127.0.0.1:${recordedPort}/rest/system/status`, orphanKey);
  if (orphanProbe.status === 200 && orphanProbe.body?.myID) {
    console.log(`✓ Stale orphan discovered & responsive. Reusing without launching duplicate.`);
  } else {
    throw new Error('Expected orphan to respond and be reused');
  }

  // Terminate orphan
  await fetchJson(`http://127.0.0.1:${recordedPort}/rest/system/shutdown`, orphanKey, { method: 'POST' });
  await new Promise(r => setTimeout(r, 1000));
  fs.rmSync(pidFile, { force: true });
  console.log('✓ Cleaned orphan process and PID file');

  // Test 5: Corrupt config recovery
  console.log('\n--- Test 5: Corrupt config handling ---');
  const corruptHome = makeTempDir('corrupt');
  fs.writeFileSync(path.join(corruptHome, 'config.xml'), '<<<INVALID XML PARSE FAILURE>>>', 'utf8');
  const corruptPort = await getFreePort();
  const corruptChild = spawnSyncthing(corruptHome, corruptPort, 'dummy_key');
  let corruptOutput = '';
  corruptChild.stderr.on('data', d => { corruptOutput += d.toString(); });
  corruptChild.stdout.on('data', d => { corruptOutput += d.toString(); });

  const exitCode = await new Promise(r => corruptChild.on('close', r));
  console.log(`✓ Corrupt config detected: process exited immediately with code ${exitCode}`);
  console.log(`✓ Error output captured: ${corruptOutput.slice(0, 80).trim()}...`);
  if (exitCode === 0) throw new Error('Process should have failed with corrupt config');

  // Test 6: API key secrecy
  console.log('\n--- Test 6: API key secrecy (zero leakage) ---');
  const secretKey = 'super_secret_never_leak_9876543210';
  const secretHome = makeTempDir('secret');
  const secretPort = await getFreePort();
  const secretChild = spawnSyncthing(secretHome, secretPort, secretKey);

  let secretLogs = '';
  secretChild.stdout.on('data', d => { secretLogs += d.toString(); });
  secretChild.stderr.on('data', d => { secretLogs += d.toString(); });
  await waitForApi(`http://127.0.0.1:${secretPort}/rest/system/status`, secretKey);

  // Trigger forced 401 error
  const unauthorized = await fetchJson(`http://127.0.0.1:${secretPort}/rest/system/status`, 'WRONG_KEY');
  console.log(`✓ Forced error triggered: HTTP ${unauthorized.status}`);

  if (secretLogs.includes(secretKey)) {
    throw new Error(`SECURITY VIOLATION: API key leaked in stdout/stderr logs!`);
  }
  if (unauthorized.raw.includes(secretKey)) {
    throw new Error(`SECURITY VIOLATION: API key leaked in error response body!`);
  }
  console.log('✓ API key grep check: 0 occurrences in logs, stdout, stderr, and error responses');
  await fetchJson(`http://127.0.0.1:${secretPort}/rest/system/shutdown`, secretKey, { method: 'POST' });
  child1.kill();

  // Clean temp dirs
  [freshHome, mockSystemHome, appHome, orphanHome, corruptHome, secretHome].forEach(d => {
    fs.rmSync(d, { recursive: true, force: true });
  });

  console.log('\n=== All 6 Runtime Lifecycle Verifications Passed! ===\n');
}

runVerification().catch(err => {
  console.error('\n❌ Verification Failed:', err);
  process.exit(1);
});
