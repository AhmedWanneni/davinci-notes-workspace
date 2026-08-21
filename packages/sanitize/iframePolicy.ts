export const DEFAULT_SANDBOX = "allow-scripts";
export const YOUTUBE_SANDBOX = "allow-scripts allow-same-origin";
const ALLOW = "autoplay 'src'; fullscreen 'src'; encrypted-media 'src'; picture-in-picture 'src'";
const REFERRER_POLICY = "no-referrer";

export interface IframePolicyResult {
  html: string;
  allowed: boolean;
  hostname?: string;
}

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split(".").map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return false;
  const [first, second] = parts;
  return first === 0 || first === 10 || first === 127 || first === 169 && second === 254
    || first === 172 && second! >= 16 && second <= 31
    || first === 192 && second === 168 || first >= 224;
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal") || !host.includes(".")) return true;
  if (isPrivateIpv4(host)) return true;
  return host === "::1" || host.startsWith("fc") || host.startsWith("fd")
    || host.startsWith("fe8") || host.startsWith("fe9") || host.startsWith("fea")
    || host.startsWith("feb") || host.startsWith("ff");
}

export function validateIframeSrc(rawSrc: string): URL | null {
  let url: URL;
  try { url = new URL(rawSrc); } catch { return null; }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || isPrivateHost(url.hostname)) return null;
  return url;
}

function blockedMessage(): string {
  return '<div class="embed-blocked">Embed blocked by the app safety policy.</div>';
}

function sandboxForHost(hostname: string): string {
  return hostname === "www.youtube.com" ? YOUTUBE_SANDBOX : DEFAULT_SANDBOX;
}

function policyIframe(src: string, hostname: string): string {
  const escaped = src.replaceAll("&", "&amp;").replaceAll('"', "&quot;");
  return `<iframe src="${escaped}" sandbox="${sandboxForHost(hostname)}" allow="${ALLOW}" referrerpolicy="${REFERRER_POLICY}"></iframe>`;
}

export function applyIframePolicy(html: string): IframePolicyResult {
  const window = globalThis.window;
  if (!window) throw new Error("applyIframePolicy requires a DOM window");
  const document = new window.DOMParser().parseFromString(`<body>${html}</body>`, "text/html");
  const frames = [...document.body.querySelectorAll("iframe")];
  if (frames.length === 0) return { html, allowed: true };
  let allowed = true;
  let hostname: string | undefined;
  frames.forEach((frame) => {
    const url = validateIframeSrc(frame.getAttribute("src") ?? "");
    if (!url) {
      allowed = false;
      frame.outerHTML = blockedMessage();
      return;
    }
    hostname = url.hostname;
    frame.outerHTML = policyIframe(url.href, url.hostname);
  });
  return { html: document.body.innerHTML, allowed, hostname };
}
