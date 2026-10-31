# 0251. Mobile Android Native Library Extraction and Prebuild Plugin

Date: 2026-10-31

## Status

Accepted

## Context

On modern Android (targetSdk >= 29, Android 10+), the operating system's security architecture enforces W^X (Write XOR Execute) memory protection via SELinux. Binaries located within writable application storage directories (`context.filesDir`, `context.cacheDir`) cannot be executed; attempting to invoke `execve()` on these paths fails with `avc: denied { execute }` errors.

To run embedded standalone binaries (such as the Syncthing daemon) without requiring external applications or root privileges, the executable must reside inside `context.applicationInfo.nativeLibraryDir` (`/data/app/.../lib/<abi>/`).

However, in AGP 8+ and Expo SDK 58, `extractNativeLibs` defaults to `false` and `useLegacyPackaging` defaults to `false`. Under these defaults:
1. Native `.so` libraries are stored uncompressed and page-aligned inside the APK package.
2. The Android package manager does **not** extract `.so` files into `nativeLibraryDir` on installation.
3. While shared libraries can be dynamically loaded into memory via `System.loadLibrary()`, standalone executable ELF binaries spawned as child processes via `ProcessBuilder` fail with "file not found or not executable" because no filesystem file exists at `nativeLibraryDir`.
4. Running `expo prebuild --clean` discards manually generated `android/` directory contents, risking loss of untracked native binary assets.

## Decisions

### 1. Dedicated Prebuild Plugin (`plugins/withSyncthingAndroid.js`)
We implement an automated Expo Config Plugin that executes during every `expo prebuild`:
- **Deterministic Asset Deployment**: Copies pinned, checksummed `libsyncthing.so` executables from tracked project assets (`apps/mobile/assets/syncthing/<abi>/`) directly into `android/app/src/main/jniLibs/<abi>/` during `withDangerousMod`.
- **Manifest Extraction Flag**: Explicitly sets `android:extractNativeLibs="true"` on the `<application>` node in `AndroidManifest.xml` via `withAndroidManifest`.
- **Gradle Legacy Packaging**: Enforces `expo.useLegacyPackaging=true` in `gradle.properties` and injects `packagingOptions.jniLibs.useLegacyPackaging = true` into `app/build.gradle` via `withAppBuildGradle`.

### 2. ABI Scope & Bundle Constraints
- We package `arm64-v8a` (standard modern Android hardware, ~27.5 MB uncompressed) and `x86_64` (emulators, ~29.4 MB uncompressed).
- 32-bit legacy ABIs (`armeabi-v7a`, `x86`) are excluded to avoid inflating bundle size.
- Restricting release packages to `arm64-v8a` limits standalone APK size to ~55 MB (~83 MB with x86_64 emulator support included).

### 3. Native Execution & Diagnostic Feedback
- `SyncthingProcessManager.kt` resolves the daemon binary strictly via `File(context.applicationInfo.nativeLibraryDir, "libsyncthing.so")`.
- It verifies `exists()` and `canExecute()` separately, invoking `binaryFile.setExecutable(true, false)` if needed, and logs diagnostic state with `Log.i("SyncthingProcess", ...)`.
- Captures a thread-safe ring buffer (last 50 lines) of stdout/stderr logs and exit codes, exposing them to the React Native bridge for actionable UI error reporting.

## Consequences

- Android devices running the standalone APK reliably extract and execute the embedded Syncthing daemon out-of-the-box.
- `expo prebuild --clean` is idempotent and never loses native library configurations or binary assets.
- App startup remains fast (<500ms) because Syncthing process initialization is lazy and only triggered when the user enters the Sync/Pairing screens.
- Completely eliminates "install Syncthing-Fork" instructions and external setup friction on Android.
