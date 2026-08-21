const IMAGE_PATTERN = /^!\[[^\]]*\]\((<[^>\n]+>|[^)\s]+)\)$/;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;

export function youtubeVideoId(rawUrl: string): string | null {
  let url: URL;
  try { url = new URL(rawUrl.trim().replace(/^<|>$/g, "")); } catch { return null; }
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") {
    const id = url.pathname.slice(1).split("/")[0] ?? "";
    return VIDEO_ID.test(id) ? id : null;
  }
  if (!["youtube.com", "www.youtube.com", "m.youtube.com"].includes(host)) return null;
  if (url.pathname !== "/watch") return null;
  const id = url.searchParams.get("v") ?? "";
  return VIDEO_ID.test(id) ? id : null;
}

export function youtubeImageToIframe(source: string): string | null {
  const match = IMAGE_PATTERN.exec(source.trim());
  if (!match) return null;
  const id = youtubeVideoId(match[1] ?? "");
  return id ? `<iframe src="https://www.youtube.com/embed/${id}"></iframe>` : null;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeEmbedVideoId(rawUrl: string): string | null {
  try {
    const url = new URL(rawUrl);
    const match = /^\/embed\/([A-Za-z0-9_-]{11})$/u.exec(url.pathname);
    return url.hostname === "www.youtube.com" ? match?.[1] ?? null : null;
  } catch { return null; }
}

export function isYoutubeImage(source: string): boolean {
  return youtubeImageToIframe(source) !== null;
}
