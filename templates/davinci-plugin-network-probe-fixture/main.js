class NetworkProbe extends DavinciPlugin {
  async onload() {
    const response = await this.net.fetch("https://example.com", { method: "GET" });
    console.info("[network-probe] mediated-fetch", {
      status: response.status,
      bodyPrefix: response.body.slice(0, 32),
    });
  }
}

module.exports = NetworkProbe;
