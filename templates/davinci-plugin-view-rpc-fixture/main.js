class RpcCounterViewPlugin extends DavinciPlugin {
  async onload() {
    let count = 0;
    const model = () => ({
      type: "stack",
      children: [
        { type: "text", text: `Count: ${count}` },
        { type: "button", id: "increment", label: "Increment" },
      ],
    });

    this.workspace.registerView({
      id: "rpc-counter-view:counter",
      name: "RPC Counter",
      render: model,
      onEvent: (event) => {
        if (event.type === "click" && event.targetId === "increment") count += 1;
        return model();
      },
    });
    this.workspace.openLeaf("rpc-counter-view:counter");
  }
}

module.exports = RpcCounterViewPlugin;
