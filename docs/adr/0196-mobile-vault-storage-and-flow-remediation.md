# ADR-0196: Mobile vault storage and flow remediation

## Status

Accepted (extends ADR-0187, ADR-0195)

## Context

Testing on Android devices revealed critical runtime failures in `apps/mobile`:
1. **URI Parsing Failure (`FileSystemFile.move` rejection)**:
   - Creating vaults with spaces (e.g. `"Personal Vault"`) caused `Call to function 'FileSystemFile.move' has been rejected -> caused by: java.lang.IllegalArgumentException: Illegal character in path at index 146`.
   - On Android, `expo-file-system` (`JavaFile.kt:20`) parses paths with `java.net.URI.create(uri.toString())`. Hand-concatenated URI strings with unencoded space characters fail validation.
   - When destination files existed, `tempFile.move(targetFile)` failed without `{ overwrite: true }`.
2. **Missing Rollback on Creation Failure**:
   - Vault creation created the directory before seeding files; when file operations failed, the folder was left orphaned on disk while the registry remained un-updated, preventing retry due to collision checks.
3. **Startup Delay**:
   - `SplashScreen.preventAutoHideAsync()` held the splash screen while blocking on a synchronous recursive directory crawl (`scanVault()`), SQLite full indexing, and concurrent foreground sync baseline scan.
4. **Native Component Runtime Crashes**:
   - Lowercase intrinsic HTML tags (`<div>`, `<button>`) were rendered in `FormattingToolbar.tsx`, causing `View config getter callback for component 'button' must be a function (received undefined)`.
   - Raw numbers (e.g. `{item.count}`) and empty strings (`""`) leaked into native `<View>` containers from unsafe `{condition && <Component />}` patterns and un-coerced badge children, causing `Text string must be rendered within a <Text> component`.

## Decision

1. **Object-Based Filesystem Seam (`apps/mobile/vault/fs/`)**:
   - Eliminate raw string concatenation for filesystem paths. Pass object constructors (`new File(parentDir, segmentName)`, `new Directory(parentDir, segmentName)`).
   - Use `entryName.ts` as the single sanitization point for entry names (preserving Unicode, Arabic, emoji, and spaces while stripping illegal filesystem control chars and reserved names).
   - Atomic writes (`atomicWriteEntry`) write to a hidden temp file within the same directory and move with `{ overwrite: true }`.
2. **Transactional Vault Creation with Rollback**:
   - In `vaultManager.ts`, if seeding or registration fails after creating a vault directory, catch the error, execute `deleteVaultDirectory(dir)`, and re-throw the error so no orphaned corrupt folders linger on disk.
3. **Startup Performance & Deferred Indexing**:
   - Hide the splash screen in a `finally` block as soon as the active vault is resolved.
   - Defer full vault scanning, indexing, and foreground sync baseline scans until 300 ms after the initial screen renders.
4. **Native Design System Hardening & ESLint Enforcement**:
   - Replace all HTML primitives in `FormattingToolbar.tsx` with React Native `View`, `ScrollView`, `Pressable`, and typography `Text`.
   - Coerce all text/count props in `Badge`, `ListItem`, `Input`, and `Button` to string inside `<Text>`.
   - Add ESLint `no-restricted-syntax` rules in `apps/mobile/.eslintrc.js`:
     - Reject all lowercase JSX intrinsic elements (`div`, `span`, `button`, `input`).
     - Reject logical expressions (`condition && <Element />`) in JSX, mandating explicit ternaries (`condition ? <Element /> : null`).

## Consequences

- Vault creation, note writing, and renaming succeed reliably on Android regardless of spaces, Arabic, emoji, or accents in the vault or note name.
- Startup time to first paint is sub-second, with indexing running smoothly in the background.
- React Native rendering errors from HTML primitives or un-wrapped text strings are completely eliminated and prevented at lint time.
