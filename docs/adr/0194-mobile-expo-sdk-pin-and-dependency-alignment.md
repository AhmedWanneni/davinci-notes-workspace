# ADR-0194: Mobile Expo SDK pin and dependency alignment

## Status

Accepted

## Context

During development, `apps/mobile` encountered Metro startup failures:
`Cannot find module '.../@expo+metro@56.0.2/node_modules/metro/src/lib/isResolvedDependency.js'`.

Diagnostic analysis identified three root causes:
1. **Stale SDK 52 Root Overrides**: Legacy `pnpm.overrides` pinned `metro` and its subpackages (`metro-config`, `metro-cache`, `metro-core`, `metro-resolver`, `metro-source-map`, `metro-transform-plugins`, `metro-transform-worker`) to `0.81.5` and `react-native-screens` to `4.4.0`. Metro 0.81.5 lacked `isResolvedDependency.js` (introduced in Metro 0.84+), causing runtime loader crashes when `@expo/metro@56.0.2` attempted to load it.
2. **Accidental SDK 58 Beta Dependencies**: An upgrade pull brought beta packages (`@expo/dom-webview@58.0.2`, `@expo/log-box@58.0.12`), which conflicted with Expo Go (SDK 57 stable, React Native 0.86.3).
3. **Dual React Instance Resolution**: `packages/editor` auto-resolved `react@19.2.8` while `apps/mobile` ran on `react@19.2.3`, causing duplicate native module warnings in `expo-doctor` and React hook dispatcher collisions.
4. **Deprecated `expo-av`**: `expo-av` is unmaintained on React Native 0.86+ / New Architecture and flagged by `expo-doctor`.

## Decision

1. **Pin Mobile to Expo SDK 57 Stable**:
   - `expo`: `~57.0.30`
   - `expo-router`: `~57.0.28`
   - `react-native`: `0.86.3`
   - `react` / `react-dom`: `19.2.3`
   - Remove all stale SDK 52 `metro*` and `react-native-screens` overrides from root `package.json`.
   - Reject Expo SDK 58 beta until fully released and supported by store Expo Go clients.

2. **React Version Ownership & Peer Dependency Boundaries**:
   - Shared workspace packages (`@app/editor`, `@app/canvas`) declare `react` and `react-dom` exclusively as `peerDependencies: { "react": "^19.0.0", "react-dom": "^19.0.0" }`.
   - The application shells own the concrete React version:
     - Desktop (`apps/desktop`) uses `^19.2.8`, aliasing `react` and `react-dom` in `vite.config.ts` and `vitest.config.ts` to its local instance to prevent multi-instance hook crashes.
     - Mobile (`apps/mobile`) strictly uses `19.2.3` as mandated by React Native 0.86.3.
     - Root `pnpm.overrides` pins `@app/editor`'s dev peer resolution to `19.2.3`.

3. **Migrate from `expo-av` to `expo-audio`**:
   - Replace deprecated `expo-av` with `expo-audio` (`~57.0.5`) in `mediaCaptureService.ts` for voice memo recordings.
   - Install required peer `expo-asset` (`~57.0.20`) and `react-native-worklets` (`0.10.1`) required by `react-native-reanimated`.

4. **Monorepo Metro Bundling & DOM Export Configuration**:
   - Retain `watchFolders = [monorepoRoot]` and `nodeModulesPaths` in `apps/mobile/metro.config.js`.
   - Set `EXPO_NO_BUNDLE_SPLITTING=1` during static production exports (`expo export`) to ensure DOM components bundle without chunk-asset lookup errors.

5. **Upgrade Policy**:
   - Upgrade Expo only to stable SDK versions; never adopt canary/beta SDKs in production branches.
   - After any dependency modification, run `npx expo-doctor` and confirm 21/21 checks pass.

## Consequences

- `apps/mobile` starts cleanly on `pnpm dev` with 0 Metro errors.
- `npx expo-doctor` passes 21/21 checks.
- Production Android bundle builds and exports cleanly (`npx expo export --platform android`).
- Desktop test suite remains 100% green (122 test files, 477 tests).
- Clean monorepo dependency tree without duplicate native modules.
