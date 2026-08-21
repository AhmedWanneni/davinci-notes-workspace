// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { mountTweetCard } from "./tweetCard";

afterEach(() => vi.unstubAllGlobals());

describe("tweetCard", () => {
  it("renders oEmbed text as DOM text without injecting returned HTML", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        author_name: "Alice",
        html: '<blockquote><p>Hello <script>alert(1)</script></p></blockquote>',
      }),
    }));
    const container = document.createElement("div");
    await mountTweetCard(container, "https://x.com/alice/status/12345");
    expect(container.className).toBe("cm-tweet-card");
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("Hello");
    expect(container.querySelector("script")).toBeNull();
    expect(container.querySelector("a")?.getAttribute("rel")).toBe("noopener noreferrer");
  });
});
