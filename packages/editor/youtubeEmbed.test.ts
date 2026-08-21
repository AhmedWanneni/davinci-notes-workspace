import { describe, expect, it } from "vitest";
import { isYoutubeImage, youtubeImageToIframe, youtubeVideoId } from "./youtubeEmbed";

describe("youtubeEmbed", () => {
  it("supports watch and short-link video URLs", () => {
    expect(youtubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeVideoId("https://youtu.be/dQw4w9WgXcQ?t=10")).toBe("dQw4w9WgXcQ");
    expect(youtubeImageToIframe("![](https://www.youtube.com/watch?v=dQw4w9WgXcQ)")).toBe(
      '<iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ"></iframe>',
    );
  });

  it("does not intercept ordinary images, near misses, or Shorts", () => {
    expect(isYoutubeImage("![](https://example.com/youtube-video.png)")).toBe(false);
    expect(isYoutubeImage("![](https://www.youtube.com/channel/abc)")).toBe(false);
    expect(isYoutubeImage("![](https://www.youtube.com/shorts/dQw4w9WgXcQ)")).toBe(false);
  });
});
