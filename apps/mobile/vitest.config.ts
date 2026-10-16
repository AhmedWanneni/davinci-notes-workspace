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
      "@app/core-types": path.resolve(__dirname, "../../packages/core-types/index.ts"),
      "@app/indexer": path.resolve(__dirname, "../../packages/indexer/index.ts"),
      "@app/sync-client": path.resolve(__dirname, "../../packages/sync-client/index.ts"),
      "@app/attachments": path.resolve(__dirname, "../../packages/attachments/index.ts"),
    },
  },
});
