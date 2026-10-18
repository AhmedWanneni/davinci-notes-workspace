import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
  },
  resolve: {
    alias: {
      "@app/editor": path.resolve(__dirname, "../../packages/editor/index.ts"),
      "@app/core-types": path.resolve(
        __dirname,
        "../../packages/core-types/index.ts",
      ),
      "@app/indexer": path.resolve(
        __dirname,
        "../../packages/indexer/index.ts",
      ),
      "@app/sync-client": path.resolve(
        __dirname,
        "../../packages/sync-client/index.ts",
      ),
      "@app/attachments": path.resolve(
        __dirname,
        "../../packages/attachments/index.ts",
      ),
      "@app/syncthing-api": path.resolve(
        __dirname,
        "../../packages/syncthing-api/index.ts",
      ),
      "react-native-svg": path.resolve(
        __dirname,
        "tests/mocks/react-native-svg.ts",
      ),
      "expo-file-system": path.resolve(
        __dirname,
        "tests/mocks/expoFileSystemMock.ts",
      ),
      "expo-sqlite": path.resolve(__dirname, "tests/mocks/expoSqliteMock.ts"),
      "expo-secure-store": path.resolve(
        __dirname,
        "tests/mocks/expoSecureStoreMock.ts",
      ),
      "expo-web-browser": path.resolve(
        __dirname,
        "tests/mocks/expoWebBrowserMock.ts",
      ),
      "expo-constants": path.resolve(
        __dirname,
        "tests/mocks/expoConstantsMock.ts",
      ),
      "react-native-safe-area-context": path.resolve(
        __dirname,
        "tests/mocks/safeAreaContextMock.ts",
      ),
      "expo-splash-screen": path.resolve(
        __dirname,
        "tests/mocks/expoSplashScreenMock.ts",
      ),
      "expo-syncthing": path.resolve(
        __dirname,
        "modules/expo-syncthing/index.ts",
      ),
      "expo-modules-core": path.resolve(
        __dirname,
        "tests/mocks/expoModulesCoreMock.ts",
      ),
      "react-native": "react-native-web",
    },
  },
  define: {
    __DEV__: "true",
  },
});
