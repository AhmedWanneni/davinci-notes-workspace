# Expo Component First Rule (Mandatory for Mobile Development)

Before building, designing, or implementing ANY component, UI control, or system functionality for the mobile app (`apps/mobile`):

### 1. Check Expo SDK & Bundled Ecosystem First
- **Always verify Expo SDK**: Always check the [Expo Documentation](https://docs.expo.dev/versions/latest/) and officially bundled native modules (`@react-native-community/*`, `expo-*`) before creating a custom implementation from scratch or pulling in random external npm packages.
- Common components & APIs:
  - Date & Time Pickers: Always use `@react-native-community/datetimepicker` (https://docs.expo.dev/versions/latest/sdk/date-time-picker/).
  - Image & Media Pickers: Always use `expo-image-picker`.
  - Audio recording / playback: Always use `expo-audio`.
  - Camera: Always use `expo-camera`.
  - Secure storage: Always use `expo-secure-store`.
  - File system operations: Always use `expo-file-system`.
  - Local push notifications: Always use `expo-notifications`.
  - Haptics: Always use `expo-haptics`.
  - Status bar / navigation bar: Always use `expo-status-bar` / `expo-navigation-bar`.
  - Web browser / auth: Always use `expo-web-browser`.
  - SQLite: Always use `expo-sqlite`.

### 2. Version Compatibility & Bundled Modules
- Never guess versions. Check `node_modules/expo/bundledNativeModules.json` or run `npx expo install <package>` to install the exact compatible version matched with the project's current Expo SDK version.
- Avoid duplicate or unvetted npm packages when an official Expo-managed module exists.

### 3. Native Platform UX & Safe Testing
- Leverage platform-specific affordances (e.g., iOS spinner/inline wheels vs Android native picker dialogs).
- Ensure components render properly in tests and web fallbacks by adding lightweight test mocks under `apps/mobile/tests/mocks/` when required by Vitest / jsdom.
