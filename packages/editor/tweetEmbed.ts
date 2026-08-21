const IMAGE_PATTERN = /^!\[[^\]]*\]\((<[^>\n]+>|[^)\s]+)\)$/;
const STATUS_ID = /^\d+$/;

export function tweetStatusUrl(rawUrl: string): string | null {
  let url: URL;
  try { url = new URL(rawUrl.trim().replace(/^<|>$/g, "")); } catch { return null; }
  if (!["twitter.com", "www.twitter.com", "x.com", "www.x.com"].includes(url.hostname.toLowerCase())) return null;
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 3 || parts[1] !== "status" || !parts[0] || !STATUS_ID.test(parts[2]!)) return null;
  return `https://x.com/${parts[0]}/status/${parts[2]}`;
}

export function tweetImageToStatusUrl(source: string): string | null {
  const match = IMAGE_PATTERN.exec(source.trim());
  return match ? tweetStatusUrl(match[1] ?? "") : null;
}

export function isTweetImage(source: string): boolean {
  return tweetImageToStatusUrl(source) !== null;
}
