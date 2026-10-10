class SecurityProbe extends DavinciPlugin {
  async onload() {
    const invoke = window?.__TAURI_INTERNALS__?.invoke;
    const attempt = async (name, operation) => {
      try {
        const result = await operation();
        await this.reportProbeResult(name, "ok", String(result));
      } catch (error) {
        await this.reportProbeResult(name, "error", String(error));
      }
    };

    await attempt("arbitrary-code", () => new Function("return 6 * 7")());
    await attempt("ambient-fetch", async () => (await fetch("https://example.com", { method: "HEAD" })).status);
    await attempt("network-request", () => this.net.fetch("https://example.com", { method: "GET" }));
    await attempt("outside-vault", () => this.vault.read("../outside.md"));
    await attempt("oauth", () => invoke("start_oauth_listener"));
    await attempt("ai-key", () => invoke("load_ai_key", { providerId: "probe" }));
    await attempt("raw-sql", () => invoke("plugin:sql|execute", {
      db: "sqlite:vault-index.db", query: "SELECT 1", values: [],
    }));
  }
}

module.exports = SecurityProbe;
