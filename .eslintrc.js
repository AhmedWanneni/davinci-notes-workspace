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
    "boundaries/elements": [
      { type: "core-types", pattern: "packages/core-types/**/*" },
      { type: "design-system", pattern: "packages/design-system/**/*" },
      { type: "indexer", pattern: "packages/indexer/**/*" },
      { type: "sync-client", pattern: "packages/sync-client/**/*" },
      { type: "app", pattern: "apps/**/*" },
      { type: "service", pattern: "services/**/*" }
    ]
  },
  rules: {
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          { from: "core-types", allow: [] },
          { from: "indexer", allow: ["core-types"] },
          { from: "sync-client", allow: ["core-types"] },
          { from: "design-system", allow: ["core-types"] },
          { from: "app", allow: ["core-types", "design-system", "indexer", "sync-client"] },
          { from: "service", allow: ["core-types", "indexer", "sync-client"] }
        ]
      }
    ]
  }
};
