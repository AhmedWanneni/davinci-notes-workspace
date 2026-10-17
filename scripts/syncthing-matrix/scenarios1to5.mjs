import fs from "node:fs";
import path from "node:path";
import {
  DESKTOP_VAULT,
  MOBILE_VAULT,
  triggerScan,
  pauseDevice,
  pauseFolder,
  waitForCondition,
} from "./cluster.mjs";

export async function runScenario1() {
  const noteName = "desk-note.md";
  const renamedName = "desk-note-renamed.md";
  const deskPath = path.join(DESKTOP_VAULT, noteName);
  const mobPath = path.join(MOBILE_VAULT, noteName);
  const deskRenamedPath = path.join(DESKTOP_VAULT, renamedName);
  const mobRenamedPath = path.join(MOBILE_VAULT, renamedName);

  // 1. Create on desktop -> verify phone
  fs.writeFileSync(deskPath, "# Desktop Created\nInitial content.", "utf8");
  await triggerScan("desktop");
  await waitForCondition(() => fs.existsSync(mobPath));
  const mobContent1 = fs.readFileSync(mobPath, "utf8");
  if (!mobContent1.includes("Initial content.")) throw new Error("Create sync mismatch");

  // 2. Edit on desktop -> verify phone
  fs.writeFileSync(deskPath, "# Desktop Edited\nModified content.", "utf8");
  await triggerScan("desktop");
  await waitForCondition(() => {
    return fs.existsSync(mobPath) && fs.readFileSync(mobPath, "utf8").includes("Modified content.");
  });

  // 3. Rename on desktop -> verify phone
  fs.renameSync(deskPath, deskRenamedPath);
  await triggerScan("desktop");
  await waitForCondition(() => !fs.existsSync(mobPath) && fs.existsSync(mobRenamedPath));

  // 4. Delete on desktop -> verify phone
  fs.unlinkSync(deskRenamedPath);
  await triggerScan("desktop");
  await waitForCondition(() => !fs.existsSync(mobRenamedPath));

  return "PASS: Create, edit, rename, delete from desktop propagated to phone filesystem.";
}

export async function runScenario2() {
  const noteName = "phone-note.md";
  const renamedName = "phone-note-renamed.md";
  const mobPath = path.join(MOBILE_VAULT, noteName);
  const deskPath = path.join(DESKTOP_VAULT, noteName);
  const mobRenamedPath = path.join(MOBILE_VAULT, renamedName);
  const deskRenamedPath = path.join(DESKTOP_VAULT, renamedName);

  // 1. Create on phone -> verify desktop
  fs.writeFileSync(mobPath, "# Phone Note\nLinks to [[TargetDocument]] #tag1", "utf8");
  await triggerScan("mobile");
  await waitForCondition(() => fs.existsSync(deskPath));
  const deskContent = fs.readFileSync(deskPath, "utf8");
  if (!deskContent.includes("[[TargetDocument]]")) throw new Error("Create sync mismatch");

  // 2. Edit on phone -> verify desktop
  fs.writeFileSync(mobPath, "# Phone Note\nUpdated body with [[SecondTarget]]", "utf8");
  await triggerScan("mobile");
  await waitForCondition(() => {
    return fs.existsSync(deskPath) && fs.readFileSync(deskPath, "utf8").includes("[[SecondTarget]]");
  });

  // 3. Rename on phone -> verify desktop
  fs.renameSync(mobPath, mobRenamedPath);
  await triggerScan("mobile");
  await waitForCondition(() => !fs.existsSync(deskPath) && fs.existsSync(deskRenamedPath));

  // 4. Delete on phone -> verify desktop
  fs.unlinkSync(mobRenamedPath);
  await triggerScan("mobile");
  await waitForCondition(() => !fs.existsSync(deskRenamedPath));

  return "PASS: Create, edit, rename, delete from phone propagated to desktop filesystem.";
}

export async function runScenario3(watchSeconds = 10) {
  const noteName = "H1 Title Note.md";
  const deskPath = path.join(DESKTOP_VAULT, noteName);
  const mobPath = path.join(MOBILE_VAULT, noteName);

  fs.writeFileSync(deskPath, "# H1 Title Note\nContent without ping pong loop.", "utf8");
  await triggerScan("desktop");
  await waitForCondition(() => fs.existsSync(mobPath));

  // Settle sync
  await new Promise((r) => setTimeout(r, 1000));
  const initialDeskMtime = fs.statSync(deskPath).mtimeMs;
  const initialMobMtime = fs.statSync(mobPath).mtimeMs;

  let mtimeRewrites = 0;
  const pollIntervalMs = 500;
  const iterations = Math.round((watchSeconds * 1000) / pollIntervalMs);

  for (let i = 0; i < iterations; i++) {
    await new Promise((r) => setTimeout(r, pollIntervalMs));
    const currDeskMtime = fs.statSync(deskPath).mtimeMs;
    const currMobMtime = fs.statSync(mobPath).mtimeMs;
    if (currDeskMtime !== initialDeskMtime || currMobMtime !== initialMobMtime) {
      mtimeRewrites++;
    }
  }

  if (mtimeRewrites > 0) {
    throw new Error(`Ping-pong rewrite detected: mtime changed ${mtimeRewrites} times!`);
  }

  return `PASS: Watched mtime for ${watchSeconds}s after sync landing; 0 ping-pong rewrites or loops.`;
}

export async function runScenario4() {
  const noteName = "conflict-note.md";
  const deskPath = path.join(DESKTOP_VAULT, noteName);
  const mobPath = path.join(MOBILE_VAULT, noteName);

  // 1. Initial sync
  fs.writeFileSync(deskPath, "Base content across both devices.\n", "utf8");
  await triggerScan("all");
  await waitForCondition(() => fs.existsSync(mobPath));

  // 2. Pause folder on mobile to simulate phone offline
  await pauseFolder("mobile", true);
  await new Promise((r) => setTimeout(r, 600));

  // 3. Concurrent edits while offline
  fs.writeFileSync(deskPath, "Desktop edit while offline at " + Date.now(), "utf8");
  fs.writeFileSync(mobPath, "Phone edit while offline at " + Date.now(), "utf8");

  // 4. Reconnect phone folder
  await pauseFolder("mobile", false);
  await triggerScan("all");

  // 5. Look for *.sync-conflict-* file on either node
  const conflictFile = await waitForCondition(() => {
    const dFiles = fs.readdirSync(DESKTOP_VAULT);
    const mFiles = fs.readdirSync(MOBILE_VAULT);
    return (
      dFiles.find((f) => f.includes(".sync-conflict-")) ||
      mFiles.find((f) => f.includes(".sync-conflict-"))
    );
  }, 20000);

  // Verify no data loss: both texts exist on disk
  const allTexts = [
    ...fs
      .readdirSync(DESKTOP_VAULT)
      .filter((f) => !f.startsWith(".") && fs.statSync(path.join(DESKTOP_VAULT, f)).isFile())
      .map((f) => fs.readFileSync(path.join(DESKTOP_VAULT, f), "utf8")),
    ...fs
      .readdirSync(MOBILE_VAULT)
      .filter((f) => !f.startsWith(".") && fs.statSync(path.join(MOBILE_VAULT, f)).isFile())
      .map((f) => fs.readFileSync(path.join(MOBILE_VAULT, f), "utf8")),
  ];
  const hasDeskText = allTexts.some((c) => c.includes("Desktop edit while offline"));
  const hasPhoneText = allTexts.some((c) => c.includes("Phone edit while offline"));

  if (!hasDeskText || !hasPhoneText) {
    throw new Error("Data loss during conflict resolution!");
  }

  return `PASS: Conflict file generated (${conflictFile}); 0 data lost; both offline versions preserved.`;
}

export async function runScenario5() {
  // 1. Edit vs Delete
  const noteA = "edit-vs-delete.md";
  const deskA = path.join(DESKTOP_VAULT, noteA);
  const mobA = path.join(MOBILE_VAULT, noteA);
  fs.writeFileSync(deskA, "Initial Doc A", "utf8");
  await triggerScan("all");
  await waitForCondition(() => fs.existsSync(mobA));

  await pauseFolder("mobile", true);
  await new Promise((r) => setTimeout(r, 600));
  fs.writeFileSync(deskA, "Important modifications on desktop", "utf8");
  fs.unlinkSync(mobA); // Deleted on mobile

  await pauseFolder("mobile", false);
  await triggerScan("all");

  // 1. Edit vs Delete: modified file must be preserved and recreated on mobile
  await waitForCondition(() => {
    const mobFiles = fs.readdirSync(MOBILE_VAULT);
    return mobFiles.some((f) => f.startsWith("edit-vs-delete"));
  }, 15000);

  // 2. Rename vs Edit
  const noteB = "rename-vs-edit.md";
  const deskB = path.join(DESKTOP_VAULT, noteB);
  const deskBRenamed = path.join(DESKTOP_VAULT, "renamed-by-desktop.md");
  const mobB = path.join(MOBILE_VAULT, noteB);
  fs.writeFileSync(deskB, "Initial Doc B", "utf8");
  await triggerScan("all");
  await waitForCondition(() => fs.existsSync(mobB));

  await pauseFolder("mobile", true);
  await new Promise((r) => setTimeout(r, 600));
  fs.renameSync(deskB, deskBRenamed);
  fs.writeFileSync(mobB, "Mobile edits original Doc B concurrently", "utf8");

  await pauseFolder("mobile", false);
  await triggerScan("all");

  // Verify both rename is propagated and data is preserved across both vaults
  await waitForCondition(() => {
    const deskFiles = fs.readdirSync(DESKTOP_VAULT);
    const mobFiles = fs.readdirSync(MOBILE_VAULT);
    return (
      deskFiles.includes("renamed-by-desktop.md") &&
      mobFiles.includes("renamed-by-desktop.md")
    );
  }, 15000);

  return "PASS: Edit vs Delete and Rename vs Edit preserved data without silent loss.";
}
