# ADR-0190: Mobile Suspended Sync Semantics, Background Execution Limits, and Pending State Honesty

## Context

On desktop, background synchronization runs continuously in a background loop or tray process. On mobile operating systems (iOS and Android), the operating system aggressively suspends or kills apps to preserve battery life and memory.

We must define what "synced" means when the mobile app is suspended, what the realistic limits of the mobile platforms are with Expo tooling (`expo-background-fetch`, `expo-task-manager`, config plugins, native WorkManager, and `BGAppRefreshTask`), and guarantee that the UI never makes false claims of being "up to date" when local changes are pending.

## Decisions

### 1. Platform Background Realities & Realistic Limits

#### iOS Realities
- **Immediate Suspension**: iOS suspends app processes within seconds of backgrounding.
- **Short Background Tasks**: When backgrounded, apps can request a brief completion window (~15–30 seconds via `beginBackgroundTaskWithName`) to finish in-flight save flushes and uploads.
- **BGAppRefreshTask Discretion**: Background fetch (`BGAppRefreshTask`) is strictly opportunistic. iOS schedules wakeups using machine-learning heuristics based on charging state, battery level, Wi-Fi connectivity, and user opening frequency. If the user opens the app infrequently or enables Low Power Mode, iOS may not grant background wakeups for hours or days.
- **Decision for iOS**: Primary sync contract is **instant sync on foreground/open**, **short flush on backgrounding**, and **best-effort `BGAppRefreshTask`**. We explicitly **do not promise guaranteed periodic background sync** on iOS.

#### Android Realities
- **WorkManager Periodic Tasks**: Android supports periodic background tasks via `WorkManager`. However, Android enforces a hard minimum periodic interval of **15 minutes** (`PeriodicWorkRequest.MIN_PERIODIC_INTERVAL_MILLIS`).
- **Doze Mode & Standby Buckets**: In Android Doze mode, network and jobs are deferred until periodic maintenance windows.
- **Syncthing / Folder Sync Interop**: If a user synchronizes their vault folder externally (e.g. Syncthing Android app or Nextcloud), Syncthing runs as an independent persistent Android service. When DaVinci Notes is foregrounded, the foreground reconciler (`vaultReconciler.ts`) scans disk `mtime`/`size` and updates the SQLite index immediately under `withDbLock`.
- **Decision for Android**: Register a WorkManager periodic task with a 15-minute minimum interval and network/battery constraints. Defer heavy attachments during battery-saver or metered networks.

### 2. Safe Cancellation and Interruption Recovery
- **Abort Signal Support**: `MobileSyncEngine` accepts an `AbortSignal`. When the OS signals imminent suspension or expiration of the background execution window, the sync engine cleanly cancels further transfers.
- **Atomic Operations**: All downloads use atomic temp files (`.tmp.sync_<nonce>_<filename>`), and all uploads are content-addressed (`findByContentHash`). Mid-transfer interruption never leaves partial or corrupted notes on disk.
- **Idempotent Resume**: Upon the next sync trigger (background task or foreground return), the diff compares current local and remote hashes. Already-transferred files are skipped; only remaining un-transferred files are transferred.

### 3. UI Messaging: Honest Pending State
- The sync engine computes `pendingCount` by comparing the local file list/hashes against the last synced snapshot.
- **Strict Rule**: The UI must **never** display "Synced" or "Up to date" while `pendingCount > 0`.
- Display states:
  - 0 pending, idle: `"Synced just now"` / `"Synced Xm ago"`
  - N pending, idle: `"Synced Xm ago (N pending changes)"` or `"N changes pending sync"`
  - Active: `"Syncing X/Y..."`
  - Paused: `"Sync paused (Low Power Mode)"` / `"Sync paused (Metered network)"`
  - Interrupted: `"Sync interrupted — tap to resume"`
  - Error: `"Sync error — tap to retry"`

### 4. Battery and Data Governance
- **Low Power Mode**: When the OS reports Low Power Mode or battery is under 20%, automatic background/foreground sync is paused.
- **Metered Networks**: When on cellular or metered Wi-Fi, markdown text sync continues, but binary attachments (> 100 KB) are queued until unmetered Wi-Fi is restored.
- **Manual Override**: The user can tap "Sync Now" at any time to run an immediate sync pass regardless of battery or network restrictions.

## Consequences

- Zero false claims in the UI: users always know when local edits have not yet reached remote storage.
- Zero process terminations from exceeding iOS background execution deadlines.
- Clean recovery from force-kills or suspension mid-sync with 0 duplicate or corrupt files.
- Resilient interop with Syncthing on Android through foreground reconciliation.
