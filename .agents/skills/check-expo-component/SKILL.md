---
name: check-expo-component
description: Check if an Expo SDK or officially bundled module exists before creating custom mobile components or installing third-party libraries.
---

# Check Expo Component Skill

Use this skill whenever tasked with implementing or enhancing any UI component, interaction, or device capability on mobile (`apps/mobile`).

## Workflow

1. **Search Expo SDK First**:
   - Query Expo documentation (`https://docs.expo.dev/versions/latest/`) or `node_modules/expo/bundledNativeModules.json` to see if a native component or module already exists.
   - Core candidates include:
     - Date / Time picking: `@react-native-community/datetimepicker`
     - Image & video capture/picking: `expo-image-picker` / `expo-camera`
     - Audio: `expo-audio`
     - Notifications: `expo-notifications`
     - Haptics: `expo-haptics`
     - Clipboard: `expo-clipboard`
     - File system: `expo-file-system`
     - Secure storage: `expo-secure-store`
     - Web browser: `expo-web-browser`
     - Blur: `expo-blur`
     - Screen / Navigation bar: `expo-navigation-bar` / `expo-status-bar`

2. **Check Compatible Version**:
   - Check `node_modules/expo/bundledNativeModules.json` in `apps/mobile` to find the exact pinned version for the active Expo SDK.
   - Install via `pnpm --filter @app/mobile add <package>@<version>`.

3. **Provide Proper Platform Adaptations**:
   - iOS: Native modals, wheels, spinners, sheets.
   - Android: Native material dialogs, system pickers.
   - Tests / Web: Colocate or configure mocks in `apps/mobile/tests/mocks/` and `vitest.config.ts`.
