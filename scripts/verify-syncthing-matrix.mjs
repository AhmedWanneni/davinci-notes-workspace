import { initCluster, teardownCluster } from "./syncthing-matrix/cluster.mjs";
import {
  runScenario1,
  runScenario2,
  runScenario3,
  runScenario4,
  runScenario5,
} from "./syncthing-matrix/scenarios1to5.mjs";
import {
  runScenario6,
  runScenario7,
  runScenario8,
  runScenario9,
  runScenario10,
} from "./syncthing-matrix/scenarios6to10.mjs";

const scenarios = [
  { id: 1, name: "Desktop -> Phone (Create / Edit / Rename / Delete)", fn: runScenario1 },
  { id: 2, name: "Phone -> Desktop (Create / Edit / Rename / Delete)", fn: runScenario2 },
  { id: 3, name: "Round Trip (No ping-pong rewrites, stable mtime)", fn: runScenario3 },
  { id: 4, name: "Concurrent Edit While Offline (*.sync-conflict-* surfaced)", fn: runScenario4 },
  { id: 5, name: "Edit vs Delete & Rename vs Edit Across Devices", fn: runScenario5 },
  { id: 6, name: "Syncthing .tmp Files Never Opened or Indexed", fn: runScenario6 },
  { id: 7, name: "Background Mobile Rescan Upon Reopening", fn: runScenario7 },
  { id: 8, name: "5,000-Note Vault Scale & Memory Benchmark", fn: runScenario8 },
  { id: 9, name: "Unpair & Re-pair Devices from Scratch", fn: runScenario9 },
  { id: 10, name: "Convergence (SHA-256 Hash Match Across Vaults)", fn: runScenario10 },
];

async function main() {
  console.log("==================================================================");
  console.log("  DAVINCI NOTES: SYNCTHING DESKTOP + PHONE VERIFICATION MATRIX   ");
  console.log("==================================================================\n");

  console.log("Setting up live Syncthing cluster (Desktop @ 8384, Mobile Peer @ 8385)...");
  await initCluster();
  console.log("Cluster ready. Executing 10-Item Matrix...\n");

  const results = [];

  for (const s of scenarios) {
    const t0 = performance.now();
    process.stdout.write(`[${s.id}/10] Running: ${s.name}... `);
    try {
      const output = await s.fn();
      const elapsed = Math.round(performance.now() - t0);
      console.log(`✓ (${elapsed}ms)`);
      results.push({ id: s.id, name: s.name, status: "PASS", detail: output, elapsed });
    } catch (err) {
      const elapsed = Math.round(performance.now() - t0);
      console.log(`✗ (${elapsed}ms)`);
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: s.id, name: s.name, status: "FAIL", detail: msg, elapsed });
    }
  }

  console.log("\nTearing down test cluster...");
  await teardownCluster();
  console.log("Teardown complete.\n");

  console.log("==================================================================");
  console.log("                        MATRIX RESULTS                           ");
  console.log("==================================================================");
  for (const r of results) {
    const symbol = r.status === "PASS" ? "PASS" : "FAIL";
    console.log(`[${symbol}] #${r.id}: ${r.name}`);
    console.log(`       Result: ${r.detail}`);
    console.log(`       Duration: ${r.elapsed}ms\n`);
  }

  const allPassed = results.every((r) => r.status === "PASS");
  if (!allPassed) {
    console.error("Some scenarios FAILED. Check root-cause details above.");
    process.exit(1);
  } else {
    console.log("ALL 10 SCENARIOS PASSED WITH DIRECT FILESYSTEM VERIFICATION.");
  }
}

main().catch((err) => {
  console.error("Fatal error during matrix execution:", err);
  process.exit(1);
});
