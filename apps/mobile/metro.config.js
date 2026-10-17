const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
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

// 4. Resolve TypeScript ESM imports (e.g. ./NoteTags.js -> ./NoteTags.ts)
const defaultResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.endsWith(".js")) {
    try {
      return defaultResolveRequest
        ? defaultResolveRequest(context, moduleName, platform)
        : context.resolveRequest(context, moduleName, platform);
    } catch {
      const tsName = moduleName.slice(0, -3) + ".ts";
      try {
        return defaultResolveRequest
          ? defaultResolveRequest(context, tsName, platform)
          : context.resolveRequest(context, tsName, platform);
      } catch {
        const tsxName = moduleName.slice(0, -3) + ".tsx";
        return defaultResolveRequest
          ? defaultResolveRequest(context, tsxName, platform)
          : context.resolveRequest(context, tsxName, platform);
      }
    }
  }
  return defaultResolveRequest
    ? defaultResolveRequest(context, moduleName, platform)
    : context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
