import { describe, expect, it } from "vitest";
import { validatePluginManifest } from "./validatePluginManifest.js";
import { checkAppCompatibility } from "./checkAppCompatibility.js";
import {
  validateVersionsFile,
  resolveCompatiblePluginVersion,
} from "./versionsFile.js";
import { compareSemver, isValidSemver } from "./semverUtils.js";

describe("validatePluginManifest", () => {
  const validCompleteManifest = {
    id: "calendar-view",
    name: "Calendar View",
    version: "1.2.0",
    minAppVersion: "0.1.0",
    description:
      "Visual calendar view for daily notes and tasks in DaVinci Notes.",
    author: "DaVinci Team",
    main: "main.js",
    isDesktopOnly: false,
    permissions: ["vault:read", "vault:write", "commands", "ui:view"],
    authorUrl: "https://davinci-notes.app",
    fundingUrl: "https://github.com/sponsors/davinci",
    license: "MIT",
    styles: "styles.css",
    keywords: ["calendar", "daily-notes", "tasks"],
  };

  it("accepts a valid, complete manifest with all fields", () => {
    const result = validatePluginManifest(validCompleteManifest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.id).toBe("calendar-view");
      expect(result.data.name).toBe("Calendar View");
      expect(result.data.version).toBe("1.2.0");
      expect(result.data.minAppVersion).toBe("0.1.0");
      expect(result.data.permissions).toEqual([
        "vault:read",
        "vault:write",
        "commands",
        "ui:view",
      ]);
      expect(result.data.isDesktopOnly).toBe(false);
    }
  });

  it("accepts a minimal valid manifest and assigns sane defaults", () => {
    const minimalManifest = {
      id: "minimal-plugin",
      name: "Minimal Plugin",
      version: "0.1.0",
      minAppVersion: "0.1.0",
      description: "A minimal plugin.",
      author: "Alice",
      main: "main.js",
    };

    const result = validatePluginManifest(minimalManifest);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isDesktopOnly).toBe(false);
      expect(result.data.permissions).toEqual([]);
      expect(result.data.authorUrl).toBeUndefined();
    }
  });

  it("rejects a manifest missing a required field with a clear error", () => {
    const missingName = {
      id: "test-plugin",
      // name is omitted
      version: "1.0.0",
      minAppVersion: "0.1.0",
      description: "A test plugin",
      author: "Test",
      main: "main.js",
    };

    const result = validatePluginManifest(missingName);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "name",
            message: 'Required field "name" is missing or empty.',
          }),
        ]),
      );
    }
  });

  it("rejects a manifest missing multiple required fields", () => {
    const emptyObj = {};
    const result = validatePluginManifest(emptyObj);
    expect(result.success).toBe(false);
    if (!result.success) {
      const errorFields = result.errors.map((e) => e.field);
      expect(errorFields).toContain("id");
      expect(errorFields).toContain("name");
      expect(errorFields).toContain("version");
      expect(errorFields).toContain("minAppVersion");
      expect(errorFields).toContain("description");
      expect(errorFields).toContain("author");
      expect(errorFields).toContain("main");
    }
  });

  it("rejects a manifest with an invalid non-semver version", () => {
    const invalidVersionManifest = {
      ...validCompleteManifest,
      version: "1.0", // invalid: missing patch
    };

    const result = validatePluginManifest(invalidVersionManifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "version",
            message:
              'Invalid version "1.0". Must be a valid SemVer 2.0.0 string (e.g. "1.0.0").',
          }),
        ]),
      );
    }
  });

  it("rejects non-semver strings like 'v1.0.0' or 'latest'", () => {
    const result1 = validatePluginManifest({
      ...validCompleteManifest,
      version: "v1.0.0",
    });
    expect(result1.success).toBe(false);

    const result2 = validatePluginManifest({
      ...validCompleteManifest,
      minAppVersion: "latest",
    });
    expect(result2.success).toBe(false);
  });

  it("flags a manifest with unknown or duplicate fields in strict mode", () => {
    const unknownFieldManifest = {
      ...validCompleteManifest,
      permisions: ["vault:read"], // Typo for permissions
      customSetting: 42,
    };

    const result = validatePluginManifest(unknownFieldManifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      const fields = result.errors.map((e) => e.field);
      expect(fields).toContain("permisions");
      expect(fields).toContain("customSetting");
      expect(result.errors[0].message).toContain("Unknown field");
    }
  });

  it("permits unknown fields when strict: false is explicitly requested", () => {
    const unknownFieldManifest = {
      ...validCompleteManifest,
      extraFutureField: "allowed in permissive mode",
    };

    const result = validatePluginManifest(unknownFieldManifest, {
      strict: false,
    });
    expect(result.success).toBe(true);
  });

  it("rejects unauthorized permissions outside the defined capability vocabulary", () => {
    const invalidPerms = {
      ...validCompleteManifest,
      permissions: ["vault:read", "arbitrary:system:access"],
    };

    const result = validatePluginManifest(invalidPerms);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "permissions",
            message: expect.stringContaining(
              'Invalid permission "arbitrary:system:access"',
            ),
          }),
        ]),
      );
    }
  });

  it("rejects duplicate permissions in the permissions array", () => {
    const dupPerms = {
      ...validCompleteManifest,
      permissions: ["vault:read", "vault:read"],
    };

    const result = validatePluginManifest(dupPerms);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: "permissions",
            message: 'Duplicate permission "vault:read".',
          }),
        ]),
      );
    }
  });

  it("rejects path traversal attempts in main entry file", () => {
    const traversalManifest = {
      ...validCompleteManifest,
      main: "../../../etc/passwd",
    };

    const result = validatePluginManifest(traversalManifest);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.errors[0].field).toBe("main");
      expect(result.errors[0].message).toContain(
        "relative path within the plugin package",
      );
    }
  });
});

describe("checkAppCompatibility", () => {
  it("flags incompatibility when minAppVersion exceeds the current app version", () => {
    const currentAppVersion = "0.1.0";
    const minAppVersion = "0.2.0"; // plugin requires a newer version than current app

    const compat = checkAppCompatibility(minAppVersion, currentAppVersion);
    expect(compat.compatible).toBe(false);
    expect(compat.minAppVersion).toBe("0.2.0");
    expect(compat.currentAppVersion).toBe("0.1.0");
    expect(compat.reason).toBe(
      "Plugin requires DaVinci Notes version 0.2.0 or higher (current version is 0.1.0).",
    );
  });

  it("confirms compatibility when current app version meets or exceeds minAppVersion", () => {
    const currentAppVersion = "1.0.0";
    const minAppVersion = "0.1.0";

    const compat = checkAppCompatibility(minAppVersion, currentAppVersion);
    expect(compat.compatible).toBe(true);
    expect(compat.reason).toBeUndefined();
  });

  it("confirms compatibility when versions match exactly", () => {
    const compat = checkAppCompatibility("0.1.0", "0.1.0");
    expect(compat.compatible).toBe(true);
  });

  it("handles pre-release tags correctly", () => {
    // 0.1.0-rc.1 is lower than 0.1.0 release
    const compat = checkAppCompatibility("0.1.0", "0.1.0-rc.1");
    expect(compat.compatible).toBe(false);
  });
});

describe("versionsFile and resolution", () => {
  const versionsMap = {
    "1.0.0": "0.1.0",
    "1.1.0": "0.1.0",
    "1.2.0": "0.2.0",
    "2.0.0": "1.0.0",
  };

  it("validates a well-formed versions.json map", () => {
    const result = validateVersionsFile(versionsMap);
    expect(result.success).toBe(true);
  });

  it("rejects invalid semver entries in versions.json", () => {
    const invalidMap = {
      "invalid-version": "0.1.0",
    };
    const result = validateVersionsFile(invalidMap);
    expect(result.success).toBe(false);
  });

  it("resolves the latest compatible plugin version for the running app", () => {
    // On app v0.1.0: can run 1.0.0 and 1.1.0, latest is 1.1.0
    expect(resolveCompatiblePluginVersion(versionsMap, "0.1.0")).toBe("1.1.0");

    // On app v0.2.0: can run up to 1.2.0
    expect(resolveCompatiblePluginVersion(versionsMap, "0.2.0")).toBe("1.2.0");

    // On app v1.0.0: can run 2.0.0
    expect(resolveCompatiblePluginVersion(versionsMap, "1.0.0")).toBe("2.0.0");

    // On an ancient app v0.0.9: no version compatible
    expect(resolveCompatiblePluginVersion(versionsMap, "0.0.9")).toBeNull();
  });
});

describe("semverUtils", () => {
  it("validates SemVer strings according to spec", () => {
    expect(isValidSemver("1.0.0")).toBe(true);
    expect(isValidSemver("0.1.0-alpha.1")).toBe(true);
    expect(isValidSemver("2.0.0+build.123")).toBe(true);
    expect(isValidSemver("1.0")).toBe(false);
    expect(isValidSemver("v1.0.0")).toBe(false);
    expect(isValidSemver("latest")).toBe(false);
  });

  it("correctly orders SemVer versions", () => {
    expect(compareSemver("1.0.0", "0.9.9")).toBe(1);
    expect(compareSemver("1.0.0", "1.0.1")).toBe(-1);
    expect(compareSemver("1.0.0", "1.0.0")).toBe(0);
    expect(compareSemver("1.0.0", "1.0.0-rc.1")).toBe(1); // normal > prerelease
  });
});
