interface OEmbedResponse {
  author_name?: string;
  author_url?: string;
  html?: string;
}

function textFromEmbedHtml(html: string): string {
  const document = new DOMParser().parseFromString(html, "text/html");
  return document.body.textContent?.replace(/\s+/g, " ").trim() ?? "";
}

function addText(parent: HTMLElement, className: string, value: string) {
  const node = document.createElement("span");
  node.className = className;
  node.textContent = value;
  parent.append(node);
}

export async function mountTweetCard(container: HTMLElement, statusUrl: string) {
  try {
    const endpoint = `https://publish.x.com/oembed?url=${encodeURIComponent(statusUrl)}&omit_script=1&dnt=true`;
    const response = await fetch(endpoint, { credentials: "omit" });
    if (!response.ok) throw new Error(`oEmbed request failed: ${response.status}`);
    const data = await response.json() as OEmbedResponse;
    container.replaceChildren();
    container.className = "cm-tweet-card";
    if (data.author_name) addText(container, "cm-tweet-card__author", data.author_name);
    const text = data.html ? textFromEmbedHtml(data.html) : "Tweet unavailable";
    addText(container, "cm-tweet-card__text", text);
    const link = document.createElement("a");
    link.className = "cm-tweet-card__link";
    link.href = statusUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open on X";
    container.append(link);
  } catch {
    container.replaceChildren();
    container.className = "cm-tweet-card cm-tweet-card--error";
    addText(container, "cm-tweet-card__text", "Tweet could not be loaded.");
    const link = document.createElement("a");
    link.href = statusUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = "Open on X";
    container.append(link);
  }
}
