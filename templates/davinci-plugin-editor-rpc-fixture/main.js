class RpcEditorFixture extends DavinciPlugin {
  async onload() {
    await this.editor.subscribe((snapshot) => {
      console.info("[rpc-editor-fixture] editor.changed", snapshot);
    });
    this.commands.register({
      id: "rpc-editor-fixture:append",
      name: "RPC editor: read and append",
      callback: async () => {
        const snapshot = await this.editor.getContent();
        const selection = await this.editor.getSelection();
        console.info("[rpc-editor-fixture] read", snapshot);
        console.info("[rpc-editor-fixture] selection", selection);
        const updated = await this.editor.setContent(
          `${snapshot.content}\nEdited through editor RPC.`,
          snapshot.version,
        );
        console.info("[rpc-editor-fixture] wrote", updated);
      },
    });
  }
}

module.exports = RpcEditorFixture;
