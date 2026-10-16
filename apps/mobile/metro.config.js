const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo root so workspace packages trigger fast refresh
config.watchFolders = [monorepoRoot];

// 2. Resolve packages from mobile node_modules first, then monorepo root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// 3. Enable package exports resolution
config.resolver.unstable_enablePackageExports = true;

module.exports = config;
