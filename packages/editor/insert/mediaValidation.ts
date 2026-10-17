const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
]);

const TWEET_HOSTS = new Set([
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
]);

const VIDEO_ID_REGEX = /^[A-Za-z0-9_-]{11}$/;
const STATUS_ID_REGEX = /^\d+$/;
const MAX_URL_LENGTH = 2048;

export interface UrlParseResult {
  url?: URL;
  cleanUrl?: string;
  error?: string;
}

export function parseGeneralMediaUrl(rawUrl: string): UrlParseResult {
  const trimmed = rawUrl.trim().replace(/^<|>$/g, "");
  if (!trimmed) {
    return { error: "URL cannot be empty." };
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    return { error: "URL exceeds maximum length of 2048 characters." };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { error: "Invalid URL format." };
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== "http:" && protocol !== "https:") {
    return { error: "Only http and https protocols are supported." };
  }

  const host = parsed.hostname.toLowerCase();
  if (!host || (!host.includes(".") && host !== "localhost")) {
    return { error: "Invalid hostname." };
  }

  return { url: parsed, cleanUrl: trimmed };
}

export function validateImageUrl(rawUrl: string): string | null {
  const result = parseGeneralMediaUrl(rawUrl);
  return result.error ?? null;
}

export function validateYoutubeUrl(rawUrl: string): string | null {
  const result = parseGeneralMediaUrl(rawUrl);
  if (result.error || !result.url) return result.error ?? "Invalid URL.";

  const host = result.url.hostname.toLowerCase();
  if (!YOUTUBE_HOSTS.has(host)) {
    return "Invalid YouTube host.";
  }

  if (
    result.url.pathname === "/shorts" ||
    result.url.pathname.startsWith("/shorts/")
  ) {
    return "YouTube Shorts are not supported.";
  }

  if (host === "youtu.be") {
    const id = result.url.pathname.slice(1).split("/")[0] ?? "";
    if (id === "shorts") {
      return "YouTube Shorts are not supported.";
    }
    if (!VIDEO_ID_REGEX.test(id)) {
      return "Invalid YouTube video ID.";
    }
    return null;
  }

  if (result.url.pathname !== "/watch") {
    return "Invalid YouTube watch URL.";
  }

  const id = result.url.searchParams.get("v") ?? "";
  if (!VIDEO_ID_REGEX.test(id)) {
    return "Invalid YouTube video ID.";
  }

  return null;
}

export function validateTweetUrl(rawUrl: string): string | null {
  const result = parseGeneralMediaUrl(rawUrl);
  if (result.error || !result.url) return result.error ?? "Invalid URL.";

  const host = result.url.hostname.toLowerCase();
  if (!TWEET_HOSTS.has(host)) {
    return "Invalid X / Twitter host.";
  }

  const parts = result.url.pathname.split("/").filter(Boolean);
  if (
    parts.length !== 3 ||
    parts[1] !== "status" ||
    !parts[0] ||
    !STATUS_ID_REGEX.test(parts[2]!)
  ) {
    return "Invalid X / Tweet status URL format (expected x.com/<user>/status/<id>).";
  }

  return null;
}
