class SampleVaultCommandPlugin extends DavinciPlugin {
  async onload(): Promise<void> {
    this.commands.register({
      id: "sample-vault-command:write-read",
      name: "Sample: write and read a vault file",
      callback: async () => {
        const path = "Sample Vault Command.md";
        const content = `Written by ${this.manifest.name} at ${new Date().toISOString()}\n`;
        await this.vault.write(path, content);
        const readBack = await this.vault.read(path);
        if (readBack !== content) {
          throw new Error("The vault round-trip did not preserve the content");
        }
        console.info(`[${this.manifest.name}] Wrote and read ${path}`);
      },
    });
  }
}

module.exports = SampleVaultCommandPlugin;
