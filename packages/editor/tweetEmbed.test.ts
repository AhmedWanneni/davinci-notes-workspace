import { describe, expect, it } from "vitest";
import { isTweetImage, tweetImageToStatusUrl, tweetStatusUrl } from "./tweetEmbed";

describe("tweetEmbed", () => {
  it("supports canonical X and Twitter status URLs", () => {
    expect(tweetStatusUrl("https://x.com/alice/status/12345")).toBe("https://x.com/alice/status/12345");
    expect(tweetStatusUrl("https://twitter.com/alice/status/12345?ref=home")).toBe("https://x.com/alice/status/12345");
    expect(tweetImageToStatusUrl("![](https://x.com/alice/status/12345)")).toBe("https://x.com/alice/status/12345");
  });

  it("does not intercept near-miss URLs", () => {
    expect(isTweetImage("![](https://example.com/twitter/status/12345)")).toBe(false);
    expect(isTweetImage("![](https://x.com/alice/profile)")).toBe(false);
    expect(isTweetImage("![](https://x.com/alice/status/not-a-number)")).toBe(false);
  });
});
