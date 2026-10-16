module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["boundaries", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:boundaries/recommended"
  ],
  settings: {
    "import/resolver": {
      typescript: {
        alwaysTryTypes: true,
        project: "./tsconfig.json"
      }
    },
    "boundaries/root-path": __dirname,
    "boundaries/ignore": ["**/*.scss", "**/*.css", "**/*.json", "**/*.sql"],
    "boundaries/elements": [
      { type: "core-types", pattern: "packages/core-types/**/*", mode: "full" },
      { type: "design-system", pattern: "packages/design-system/**/*", mode: "full" },
      { type: "canvas", pattern: "packages/canvas/**/*", mode: "full" },
      { type: "editor", pattern: "packages/editor/**/*", mode: "full" },
      { type: "indexer", pattern: "packages/indexer/**/*", mode: "full" },
      { type: "sync-client", pattern: "packages/sync-client/**/*", mode: "full" },
      { type: "plugin-api", pattern: "packages/plugin-api/**/*", mode: "full" },
      { type: "plugin-runtime", pattern: "packages/plugin-runtime/**/*", mode: "full" },
      { type: "theme-api", pattern: "packages/theme-api/**/*", mode: "full" },
      { type: "ai-api", pattern: "packages/ai-api/**/*", mode: "full" },
      { type: "ai-runtime", pattern: "packages/ai-runtime/**/*", mode: "full" },
      { type: "attachments", pattern: "packages/attachments/**/*", mode: "full" },
      { type: "sanitize", pattern: "packages/sanitize/**/*", mode: "full" },
      { type: "app-desktop", pattern: "apps/desktop/**/*", mode: "full" },
      { type: "app-mobile", pattern: "apps/mobile/**/*", mode: "full" },
      { type: "service", pattern: "services/**/*", mode: "full" }
    ]
  },
  rules: {
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          { from: "core-types", allow: ["core-types"] },
          { from: "indexer", allow: ["core-types", "indexer"] },
          { from: "sync-client", allow: ["core-types", "sync-client"] },
          { from: "design-system", allow: ["core-types", "design-system"] },
          { from: "canvas", allow: ["core-types", "design-system", "editor", "canvas"] },
          { from: "editor", allow: ["core-types", "indexer", "editor", "attachments", "sanitize"] },
          { from: "attachments", allow: ["attachments"] },
          { from: "sanitize", allow: ["sanitize"] },
          { from: "plugin-api", allow: ["core-types", "plugin-api"] },
          { from: "plugin-runtime", allow: ["core-types", "plugin-api", "plugin-runtime"] },
          { from: "theme-api", allow: ["theme-api"] },
          { from: "ai-api", allow: ["ai-api"] },
          { from: "ai-runtime", allow: ["ai-api", "ai-runtime"] },
          {
            from: "app-desktop",
            allow: [
              "core-types",
              "design-system",
              "indexer",
              "sync-client",
              "editor",
              "canvas",
              "plugin-api",
              "plugin-runtime",
              "theme-api",
              "ai-api",
              "ai-runtime",
              "attachments",
              "sanitize",
              "app-desktop"
            ]
          },
          {
            from: "app-mobile",
            allow: [
              "core-types",
              "indexer",
              "sync-client",
              "editor",
              "canvas",
              "plugin-api",
              "plugin-runtime",
              "theme-api",
              "ai-api",
              "ai-runtime",
              "attachments",
              "sanitize",
              "app-mobile"
            ]
          },
          { from: "service", allow: ["core-types", "indexer", "sync-client", "service"] }
        ]
      }
    ],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }
    ]
  },
  overrides: [
    {
      files: ["packages/editor/**/*.{ts,tsx}", "apps/mobile/**/*.{ts,tsx}"],
      rules: { "boundaries/no-private": "off" }
    },
    {
      files: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
      rules: {
        "boundaries/no-private": "off"
      }
    }
  ]
};
