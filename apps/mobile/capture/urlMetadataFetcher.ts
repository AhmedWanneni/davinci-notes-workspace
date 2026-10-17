/**
 * Fetches page title from a shared URL with a strict 3-second timeout.
 * Gracefully falls back to domain or URL path on failure, network disconnect, or timeout.
 */
export async function fetchUrlMetadata(
  url: string,
): Promise<{ title: string; url: string }> {
  let domain = url;
  try {
    const parsed = new URL(url);
    domain = parsed.hostname;
  } catch {
    // Keep raw string if malformed
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "DaVinciNotes/1.0" },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const html = await response.text();
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
      if (titleMatch && titleMatch[1]) {
        const cleanTitle = titleMatch[1].replace(/\s+/g, " ").trim();
        if (cleanTitle) {
          return { title: cleanTitle, url };
        }
      }
    }
  } catch {
    // Network failure, timeout, or CORS error -> return graceful domain fallback
  }

  return { title: domain, url };
}
