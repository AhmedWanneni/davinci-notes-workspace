const WIDGET_CSP =
  "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; font-src 'none'; form-action 'none';";

export function extractThemeTokens(): Record<string, string> {
  if (typeof window === "undefined" || !window.getComputedStyle) {
    return {
      "--color-bg-primary": "#1e1e1e",
      "--color-bg-secondary": "#252525",
      "--color-text-normal": "#dcddde",
      "--color-text-muted": "#999999",
      "--color-border-subtle": "#333333",
      "--color-accent": "#7c3aed",
    };
  }

  const rootStyle = window.getComputedStyle(document.documentElement);
  const tokenNames = [
    "--color-bg-primary",
    "--color-bg-secondary",
    "--color-bg-hover",
    "--color-text-normal",
    "--color-text-muted",
    "--color-text-accent",
    "--color-border-subtle",
    "--color-border-bold",
    "--font-ui",
    "--font-mono",
    "--border-radius-sm",
    "--border-radius-md",
  ];

  const extracted: Record<string, string> = {};
  for (const name of tokenNames) {
    const val = rootStyle.getPropertyValue(name).trim();
    if (val) extracted[name] = val;
  }
  return extracted;
}

export function buildWidgetHtml(source: string, widgetId: string): string {
  const tokens = extractThemeTokens();
  const tokenVars = Object.entries(tokens)
    .map(([k, v]) => `${k}: ${v};`)
    .join(" ");

  const baseStyles = `
    :root {
      ${tokenVars}
      color-scheme: dark light;
      font-family: var(--font-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif);
      color: var(--color-text-normal, #dcddde);
      background-color: var(--color-bg-primary, #1e1e1e);
    }
    *, *::before, *::after {
      box-sizing: border-box;
    }
    html, body {
      margin: 0;
      padding: 0;
      width: 100%;
      min-height: 100%;
      background-color: transparent;
      color: var(--color-text-normal, #dcddde);
    }
    body {
      padding: 12px;
      overflow-x: hidden;
    }
  `;

  const resizeScript = `
    (function() {
      var id = ${JSON.stringify(widgetId)};
      function emitHeight() {
        var body = document.body;
        var doc = document.documentElement;
        if (!body || !doc) return;
        var h = Math.max(body.scrollHeight, body.offsetHeight, doc.scrollHeight);
        window.parent.postMessage({ type: "davinci:widget-resize", widgetId: id, height: h }, "*");
      }
      if (typeof ResizeObserver !== "undefined") {
        new ResizeObserver(emitHeight).observe(document.documentElement);
      }
      window.addEventListener("load", emitHeight);
      window.addEventListener("resize", emitHeight);
      setTimeout(emitHeight, 50);
      setTimeout(emitHeight, 250);
      setTimeout(emitHeight, 1000);
    })();
  `;

  const headInject = `
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="${WIDGET_CSP}" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>${baseStyles}</style>
    <script>${resizeScript}</script>
  `;

  const trimmed = source.trim();
  const hasHtmlTag = /<html\b[^>]*>/i.test(trimmed);
  const hasHeadTag = /<head\b[^>]*>/i.test(trimmed);

  if (hasHeadTag) {
    return trimmed.replace(
      /<head\b[^>]*>/i,
      (match) => `${match}${headInject}`,
    );
  }

  if (hasHtmlTag) {
    return trimmed.replace(
      /<html\b[^>]*>/i,
      (match) => `${match}<head>${headInject}</head>`,
    );
  }

  return `<!doctype html>
<html>
  <head>
    ${headInject}
  </head>
  <body>
    ${trimmed}
  </body>
</html>`;
}
