module.exports = {
  extends: ["../../.eslintrc.js"],
  overrides: [
    {
      files: ["**/*.ts", "**/*.tsx"],
      rules: {
        // `apps/web-clipper/**` is one boundary element whose modules must import
        // each other (entrypoint -> src). `no-private` exists to protect another
        // element's internals, which does not apply inside a single app element.
        // The meaningful boundary — that this app may only import
        // `@app/clipper-core` (and later `@app/design-system`) — is still enforced
        // by `boundaries/element-types`.
        "boundaries/no-private": "off",
      },
    },
  ],
};
