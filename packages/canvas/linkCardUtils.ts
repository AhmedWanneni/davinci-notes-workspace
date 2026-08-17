/**
 * Webpage embed card utilities, URL validation, and iframe security helpers.
 */

export const SANDBOX_PERMISSIONS =
  "allow-scripts allow-same-origin allow-forms allow-presentation";

export const FORBIDDEN_SANDBOX_TOKENS = Object.freeze([
  "allow-top-navigation",
  "allow-top-navigation-by-user-activation",
  "allow-top-navigation-to-custom-protocols",
  "allow-modals",
  "allow-pointer-lock",
]);

const ALLOWED_PROTOCOLS = new Set(["http:", "https:"]);

export function isValidWebUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== "string") return false;
  const trimmed = urlString.trim();
  if (!trimmed) return false;
  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.has(parsed.protocol) && Boolean(parsed.hostname);
  } catch {
    return false;
  }
}

export function sanitizeWebUrl(rawUrl: string): string | null {
  if (!rawUrl || typeof rawUrl !== "string") return null;
  let trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Reject dangerous protocols explicitly before auto-prefixing
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("file:") ||
    lower.startsWith("tauri:") ||
    lower.startsWith("about:") ||
    lower.startsWith("blob:") ||
    lower.startsWith("vbscript:")
  ) {
    return null;
  }

  // Prepend https:// if protocol is missing and it looks like a domain
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) return null;
    if (!parsed.hostname || !parsed.hostname.includes(".")) return null;
    return parsed.href;
  } catch {
    return null;
  }
}

export function extractDomain(urlString: string): string {
  try {
    const parsed = new URL(urlString);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return urlString;
  }
}

export function isYouTubeUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase().replace(/^www\./i, "");
    return (
      host === "youtube.com" ||
      host === "youtu.be" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    );
  } catch {
    return false;
  }
}

function parseYouTubeTimestamp(timeStr: string | null): number | null {
  if (!timeStr) return null;
  if (/^\d+$/.test(timeStr)) return parseInt(timeStr, 10);
  const match = timeStr.match(/(?:(\d+)h)?(?:(\d+)m)?(?:(\d+)s)?/);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const seconds = parseInt(match[3] || "0", 10);
  const total = hours * 3600 + minutes * 60 + seconds;
  return total > 0 ? total : null;
}

export function getYouTubeEmbedUrl(urlString: string): string | null {
  try {
    const parsed = new URL(urlString);
    const host = parsed.hostname.toLowerCase().replace(/^www\./i, "");
    let videoId: string | null = null;

    if (host === "youtu.be") {
      videoId = parsed.pathname.slice(1).split("/")[0] || null;
    } else if (
      host === "youtube.com" ||
      host === "m.youtube.com" ||
      host === "youtube-nocookie.com"
    ) {
      if (parsed.pathname === "/watch") {
        videoId = parsed.searchParams.get("v");
      } else if (parsed.pathname.startsWith("/shorts/")) {
        videoId = parsed.pathname.split("/")[2] || null;
      } else if (parsed.pathname.startsWith("/embed/")) {
        videoId = parsed.pathname.split("/")[2] || null;
      }
    }

    if (!videoId || !/^[\w-]{6,15}$/.test(videoId)) return null;

    const timeParam =
      parsed.searchParams.get("t") || parsed.searchParams.get("start");
    const startSec = parseYouTubeTimestamp(timeParam);
    const params = new URLSearchParams();
    if (startSec && startSec > 0) {
      params.set("start", String(startSec));
    }
    const query = params.toString();
    return `https://www.youtube-nocookie.com/embed/${videoId}${query ? `?${query}` : ""}`;
  } catch {
    return null;
  }
}

export function getEmbedUrl(urlString: string): string {
  const sanitized = sanitizeWebUrl(urlString);
  if (!sanitized) return "";
  if (isYouTubeUrl(sanitized)) {
    const ytEmbed = getYouTubeEmbedUrl(sanitized);
    if (ytEmbed) return ytEmbed;
  }
  return sanitized;
}

export function isSandboxSafe(sandbox: string): boolean {
  const tokens = sandbox.trim().split(/\s+/);
  for (const forbidden of FORBIDDEN_SANDBOX_TOKENS) {
    if (tokens.includes(forbidden)) return false;
  }
  return true;
}
