import { describe, expect, it } from "vitest";
import { parseGithubReleases, parseRegistryDocument } from "./pluginRegistry";
import {
  isUpdateAvailable,
  resolvePluginRelease,
} from "./resolvePluginRelease";

describe("plugin registry resolution", () => {
  it("parses the static catalog and selects the newest compatible release", () => {
    const entry = {
      id: "sample-plugin",
      name: "Sample",
      author: "Author",
      description: "Sample",
      repo: "https://github.com/author/sample",
    };
    expect(
      parseRegistryDocument({ schemaVersion: 1, plugins: [entry] }).plugins,
    ).toEqual([entry]);
    const releases = parseGithubReleases(
      [
        {
          tag_name: "v1.0.0",
          assets: [
            {
              name: "sample-plugin.zip",
              browser_download_url: "https://example.test/1.zip",
            },
          ],
        },
        {
          tag_name: "v1.1.0",
          assets: [
            {
              name: "sample-plugin.zip",
              browser_download_url: "https://example.test/2.zip",
            },
          ],
        },
      ],
      "sample-plugin.zip",
    );
    const resolved = resolvePluginRelease(
      entry,
      releases,
      { "1.0.0": "0.1.0", "1.1.0": "0.2.0" },
      "0.1.0",
    );
    expect(resolved?.version).toBe("1.0.0");
    expect(isUpdateAvailable("0.9.0", resolved!)).toBe(true);
  });

  it("rejects non-GitHub registry URLs", () => {
    expect(() =>
      parseRegistryDocument({
        schemaVersion: 1,
        plugins: [{ id: "x", repo: "http://example.test" }],
      }),
    ).toThrow();
  });

  it("accepts the shared themes catalog alongside plugins", () => {
    const theme = {
      id: "paper-dark",
      name: "Paper Dark",
      author: "Author",
      description: "Theme",
      repo: "https://github.com/author/paper-dark",
    };
    const document = parseRegistryDocument({
      schemaVersion: 1,
      plugins: [],
      themes: [theme],
    });
    expect(document.themes).toEqual([theme]);
  });
});
