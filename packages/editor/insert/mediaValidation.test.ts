import { describe, expect, it } from "vitest";
import {
  parseGeneralMediaUrl,
  validateImageUrl,
  validateTweetUrl,
  validateYoutubeUrl,
} from "./mediaValidation";

describe("mediaValidation general URL validation", () => {
  it("rejects empty input and whitespace", () => {
    expect(parseGeneralMediaUrl("").error).toBe("URL cannot be empty.");
    expect(parseGeneralMediaUrl("   ").error).toBe("URL cannot be empty.");
  });

  it("rejects overlong input (5,000 characters)", () => {
    const longUrl = `https://example.com/${"a".repeat(5000)}`;
    expect(parseGeneralMediaUrl(longUrl).error).toBe(
      "URL exceeds maximum length of 2048 characters.",
    );
  });

  it("rejects non-http/https protocols such as ftp, javascript, data", () => {
    expect(parseGeneralMediaUrl("ftp://x").error).toBe(
      "Only http and https protocols are supported.",
    );
    expect(parseGeneralMediaUrl("javascript:alert(1)").error).toBe(
      "Only http and https protocols are supported.",
    );
    expect(parseGeneralMediaUrl("data:text/html,x").error).toBe(
      "Only http and https protocols are supported.",
    );
    expect(parseGeneralMediaUrl("file:///etc/passwd").error).toBe(
      "Only http and https protocols are supported.",
    );
  });

  it("validates safe image URLs", () => {
    expect(validateImageUrl("https://example.com/pic.png")).toBeNull();
    expect(validateImageUrl("http://sub.domain.org/image.jpg")).toBeNull();
    expect(validateImageUrl("ftp://example.com/image.png")).toBe(
      "Only http and https protocols are supported.",
    );
  });
});

describe("mediaValidation YouTube validation", () => {
  it("accepts standard watch URLs with 11-char video ID", () => {
    expect(
      validateYoutubeUrl("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBeNull();
    expect(
      validateYoutubeUrl("https://youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBeNull();
    expect(
      validateYoutubeUrl("https://m.youtube.com/watch?v=dQw4w9WgXcQ"),
    ).toBeNull();
  });

  it("accepts youtu.be short URLs", () => {
    expect(validateYoutubeUrl("https://youtu.be/dQw4w9WgXcQ")).toBeNull();
  });

  it("accepts YouTube URLs with timestamps and extra query parameters", () => {
    expect(
      validateYoutubeUrl(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=42s&feature=share",
      ),
    ).toBeNull();
    expect(
      validateYoutubeUrl("https://youtu.be/dQw4w9WgXcQ?t=120"),
    ).toBeNull();
  });

  it("rejects YouTube Shorts with a clear message", () => {
    expect(
      validateYoutubeUrl("https://www.youtube.com/shorts/dQw4w9WgXcQ"),
    ).toBe("YouTube Shorts are not supported.");
    expect(
      validateYoutubeUrl("https://youtube.com/shorts/dQw4w9WgXcQ"),
    ).toBe("YouTube Shorts are not supported.");
    expect(
      validateYoutubeUrl("https://youtu.be/shorts/dQw4w9WgXcQ"),
    ).toBe("YouTube Shorts are not supported.");
  });

  it("rejects lookalike hosts such as youtube.com.evil.com", () => {
    expect(
      validateYoutubeUrl(
        "https://youtube.com.evil.com/watch?v=dQw4w9WgXcQ",
      ),
    ).toBe("Invalid YouTube host.");
    expect(
      validateYoutubeUrl("https://fakeyoutu.be/dQw4w9WgXcQ"),
    ).toBe("Invalid YouTube host.");
  });

  it("rejects invalid YouTube paths and malformed IDs", () => {
    expect(
      validateYoutubeUrl("https://www.youtube.com/channel/UC1234567"),
    ).toBe("Invalid YouTube watch URL.");
    expect(
      validateYoutubeUrl("https://www.youtube.com/watch?v=short"),
    ).toBe("Invalid YouTube video ID.");
    expect(
      validateYoutubeUrl("https://youtu.be/short"),
    ).toBe("Invalid YouTube video ID.");
  });
});

describe("mediaValidation X / Tweet validation", () => {
  it("accepts valid X and Twitter post URLs", () => {
    expect(
      validateTweetUrl("https://x.com/jack/status/20"),
    ).toBeNull();
    expect(
      validateTweetUrl("https://twitter.com/jack/status/20"),
    ).toBeNull();
    expect(
      validateTweetUrl("https://www.x.com/username_1/status/123456789012345"),
    ).toBeNull();
  });

  it("rejects lookalike hosts such as x.com.evil.com", () => {
    expect(
      validateTweetUrl("https://x.com.evil.com/jack/status/20"),
    ).toBe("Invalid X / Twitter host.");
    expect(
      validateTweetUrl("https://twitter.com.bad.com/jack/status/20"),
    ).toBe("Invalid X / Twitter host.");
  });

  it("rejects non-status paths and invalid status IDs", () => {
    expect(validateTweetUrl("https://x.com/jack")).toContain(
      "Invalid X / Tweet status URL format",
    );
    expect(validateTweetUrl("https://x.com/jack/likes")).toContain(
      "Invalid X / Tweet status URL format",
    );
    expect(validateTweetUrl("https://x.com/jack/status/abc")).toContain(
      "Invalid X / Tweet status URL format",
    );
  });
});
