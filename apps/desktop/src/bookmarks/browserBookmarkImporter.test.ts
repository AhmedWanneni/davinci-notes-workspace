import { describe, it, expect } from "vitest";
import { parseImportedBookmarksFile } from "./browserBookmarkImporter";

const SAMPLE_CHROME_BRAVE_HTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1700000000" LAST_MODIFIED="1700000000" PERSONAL_TOOLBAR_FOLDER="true">Bookmarks bar</H3>
    <DL><p>
        <DT><A HREF="https://tauri.app/" ADD_DATE="1710000000">Tauri v2 Docs</A>
        <DT><H3 ADD_DATE="1710000100">Development</H3>
        <DL><p>
            <DT><A HREF="https://www.rust-lang.org/" ADD_DATE="1710000200" TAGS="rust,systems">Rust Programming Language</A>
            <DT><H3 ADD_DATE="1710000300">Frontend</H3>
            <DL><p>
                <DT><A HREF="https://react.dev/" ADD_DATE="1710000400">React Reference</A>
            </DL><p>
        </DL><p>
    </DL><p>
    <DT><H3 ADD_DATE="1700000000">Other bookmarks</H3>
    <DL><p>
        <DT><A HREF="javascript:alert(1)">Malicious Bookmarklet</A>
        <DT><A HREF="https://news.ycombinator.com" ADD_DATE="1710000500">Hacker News</A>
    </DL><p>
</DL><p>`;

const SAMPLE_CHROME_JSON = JSON.stringify({
  checksum: "abc",
  roots: {
    bookmark_bar: {
      children: [
        {
          name: "AI Research",
          type: "folder",
          children: [
            {
              name: "ArXiv Papers",
              type: "url",
              url: "https://arxiv.org/list/cs.AI/recent",
              date_added: "13350000000000000",
            },
          ],
        },
      ],
      name: "Bookmarks bar",
      type: "folder",
    },
    other: {
      children: [
        {
          name: "GitHub",
          type: "url",
          url: "https://github.com",
          date_added: "1710000000",
        },
      ],
      name: "Other bookmarks",
      type: "folder",
    },
  },
  version: 1,
});

describe("browserBookmarkImporter", () => {
  it("parses Netscape HTML exports from Chrome/Brave/Firefox and strips root wrapper folders", () => {
    const summary = parseImportedBookmarksFile(SAMPLE_CHROME_BRAVE_HTML);
    expect(summary.detectedFormat).toBe("netscape-html");
    expect(summary.items).toHaveLength(4);

    const tauri = summary.items.find((i) => i.title === "Tauri v2 Docs");
    expect(tauri?.url).toBe("https://tauri.app/");
    expect(tauri?.domain).toBe("tauri.app");
    expect(tauri?.folder).toBeUndefined();
    expect(tauri?.addedAt).toBe(1710000000 * 1000);

    const rust = summary.items.find(
      (i) => i.title === "Rust Programming Language",
    );
    expect(rust?.folder).toBe("Development");
    expect(rust?.tags).toEqual(["rust", "systems"]);

    const react = summary.items.find((i) => i.title === "React Reference");
    expect(react?.folder).toBe("Development / Frontend");

    // Malicious javascript: link is rejected
    expect(
      summary.items.some((i) => i.url.startsWith("javascript:")),
    ).toBe(false);
  });

  it("parses Chrome / Firefox JSON bookmark exports", () => {
    const summary = parseImportedBookmarksFile(SAMPLE_CHROME_JSON);
    expect(summary.detectedFormat).toBe("browser-json");
    expect(summary.items).toHaveLength(2);
    expect(summary.folders).toEqual(["AI Research"]);

    const arxiv = summary.items.find((i) => i.title === "ArXiv Papers");
    expect(arxiv?.folder).toBe("AI Research");
    expect(arxiv?.domain).toBe("arxiv.org");
  });

  it("returns empty summary on blank or invalid input", () => {
    expect(parseImportedBookmarksFile("   ")).toEqual({
      items: [],
      folders: [],
      detectedFormat: "unknown",
    });
  });
});
