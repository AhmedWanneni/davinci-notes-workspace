class SampleVaultCommandPlugin extends DavinciPlugin {
  private runs = 0;

  async onload(): Promise<void> {
    this.workspace.registerView({
      id: "sample-vault-command:status",
      name: "Sample vault command",
      render: () => this.viewModel(),
      onEvent: async (event) => {
        if (event.type === "click" && event.targetId === "run-command") {
          await this.runRoundTrip();
        }
        return this.viewModel();
      },
    });
    this.workspace.openLeaf("sample-vault-command:status");

    this.commands.register({
      id: "sample-vault-command:write-read",
      name: "Sample: write and read a vault file",
      callback: () => this.runRoundTrip(),
    });
  }

  private async runRoundTrip(): Promise<void> {
    const path = "Sample Vault Command.md";
    const content = `Written by ${this.manifest.name} at ${new Date().toISOString()}\n`;
    await this.vault.write(path, content);
    const readBack = await this.vault.read(path);
    if (readBack !== content) throw new Error("The vault round-trip did not preserve the content");
    const snapshot = await this.editor.getContent();
    this.runs += 1;
    await this.saveData({ runs: this.runs });
    const stored = await this.loadData();
    console.info(`[${this.manifest.name}] vault/storage/editor RPC round-trip ${this.runs}`, {
      snapshot,
      stored,
    });
  }

  private viewModel(): PluginViewModel {
    return {
      type: "stack",
      children: [
        { type: "text", text: `Completed RPC runs: ${this.runs}` },
        { type: "button", id: "run-command", label: "Run vault round-trip" },
      ],
    };
  }
}

module.exports = SampleVaultCommandPlugin;
