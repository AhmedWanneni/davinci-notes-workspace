import { describe, expect, it } from "vitest";
import { findInsertItem } from "./InsertRegistry";
import { isYoutubeImage, youtubeVideoId } from "../embeds/youtubeEmbed";
import { isTweetImage, tweetStatusUrl } from "../embeds/tweetEmbed";
import { resolveEmbedLink } from "../embeds/embedLinkResolution";
import { IMAGE_PATTERN } from "../embeds/imageExtension";

describe("InsertRegistry media items", () => {
  it("registers image, youtube, and tweet items in the Media group", () => {
    const image = findInsertItem("image");
    const youtube = findInsertItem("youtube");
    const tweet = findInsertItem("tweet");

    expect(image).toBeDefined();
    expect(image?.group).toBe("Media");
    expect(image?.dialog?.kind).toBe("image-sources");

    expect(youtube).toBeDefined();
    expect(youtube?.group).toBe("Media");
    expect(youtube?.dialog?.kind).toBe("media-url");

    expect(tweet).toBeDefined();
    expect(tweet?.group).toBe("Media");
    expect(tweet?.dialog?.kind).toBe("media-url");
  });

  it("builds YouTube syntax matching the existing YouTube embed extension", () => {
    const youtube = findInsertItem("youtube")!;
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s";
    const result = youtube.build({
      selectedText: "",
      input: { url },
    });

    expect(result.block).toBe(true);
    expect(result.text).toBe(`![](${url})`);
    expect(isYoutubeImage(result.text)).toBe(true);
    expect(youtubeVideoId(url)).toBe("dQw4w9WgXcQ");
  });

  it("builds Tweet syntax matching the existing Tweet embed extension", () => {
    const tweet = findInsertItem("tweet")!;
    const url = "https://x.com/jack/status/20";
    const result = tweet.build({
      selectedText: "",
      input: { url },
    });

    expect(result.block).toBe(true);
    expect(result.text).toBe(`![](${url})`);
    expect(isTweetImage(result.text)).toBe(true);
    expect(tweetStatusUrl(url)).toBe("https://x.com/jack/status/20");
  });

  it("builds Image URL syntax matching the existing external image extension", () => {
    const image = findInsertItem("image")!;
    const url = "https://example.com/photo.png";
    const result = image.build({
      selectedText: "",
      input: { url },
    });

    expect(result.block).toBe(false);
    expect(result.text).toBe(`![](${url})`);
    IMAGE_PATTERN.lastIndex = 0;
    expect(IMAGE_PATTERN.test(result.text)).toBe(true);
    expect(isYoutubeImage(result.text)).toBe(false);
    expect(isTweetImage(result.text)).toBe(false);
  });

  it("builds Local Image syntax matching the existing embedLinkResolution extension", () => {
    const image = findInsertItem("image")!;
    const path = "attachments/photo.png";
    const result = image.build({
      selectedText: "",
      input: { path },
    });

    expect(result.block).toBe(false);
    expect(result.text).toBe(`![[${path}]]`);

    const resolution = resolveEmbedLink(result.text, {
      paths: [path],
    });
    expect(resolution).toEqual({
      type: "image",
      path: "attachments/photo.png",
    });
  });
});
