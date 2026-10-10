window.addEventListener("DOMContentLoaded", () => {
  try {
    const invoke = window.__TAURI_INTERNALS__.invoke;
    const pending = new Map();
    const loadedPlugins = new Map();
    let sequence = 0;

    const request = (method, params) => {
      const requestId = `runner-${++sequence}`;
      const message = { protocol: 1, sessionId: "plugin-lifecycle-session", requestId, kind: "request", method, params };
      return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject });
        void invoke("plugin_webview_request", { message });
      });
    };

    const respond = (request, result, error) => invoke("plugin_webview_response", {
      message: {
        protocol: 1,
        sessionId: request.sessionId,
        requestId: request.requestId,
        kind: "response",
        method: request.method,
        ...(error ? { error } : { result }),
      },
    });

    class DavinciPlugin {
      constructor(manifest, context) {
        this.manifest = manifest;
        this.context = context;
        this.vault = context.vault;
        this.net = context.net;
        this.commands = context.commands;
        this.settings = context.settings;
        this.workspace = context.workspace;
        this.editor = context.editor;
      }
      async onload() {}
      async onunload() {}
      async loadData() { return this.context.loadData(); }
      async saveData(data) { await this.context.saveData(data); }
      async reportProbeResult(name, outcome, detail) {
        await this.context.reportProbeResult(name, outcome, detail);
      }
    }

    const createContext = (plugin) => ({
      vault: {
        read: (path) => request("vault.read", { path }),
        write: (path, content) => request("vault.write", { path, content }),
        list: (folder) => request("vault.list", folder === undefined ? {} : { folder }),
        delete: (path) => request("vault.delete", { path }),
      },
      net: {
        fetch: (url, requestOptions) => request("network.request", {
          id: plugin.id,
          capabilityToken: plugin.capabilityToken,
          url,
          ...(requestOptions === undefined ? {} : { request: requestOptions }),
        }),
      },
      commands: {
        register: (command) => {
          const title = typeof command?.title === "string" ? command.title : command?.name;
          if (!command?.id || typeof title !== "string" || typeof command.callback !== "function") {
            throw new Error("commands.register requires id, title/name, and callback");
          }
          if (plugin.commands.has(command.id)) throw new Error(`Command already registered: ${command.id}`);
          plugin.commands.set(command.id, { title, hotkey: command.hotkey, callback: command.callback });
          return () => plugin.commands.delete(command.id);
        },
      },
      settings: { addTab: () => { throw new Error("Plugin settings are not available in the runner yet"); }, getTabs: () => [] },
      workspace: {
        registerView: (view) => {
          if (!view?.id || typeof view.name !== "string" || typeof view.render !== "function") {
            throw new Error("workspace.registerView requires id, name, and render");
          }
          if (plugin.views.has(view.id)) throw new Error(`View already registered: ${view.id}`);
          plugin.views.set(view.id, view);
          return () => {
            plugin.views.delete(view.id);
            if (plugin.openViewId === view.id) plugin.openViewId = null;
          };
        },
        openLeaf: (viewId) => {
          if (!plugin.views.has(viewId)) throw new Error(`Unknown plugin view: ${viewId}`);
          plugin.openViewId = viewId;
        },
        closeLeaf: () => { plugin.openViewId = null; },
        focusLeaf: () => {},
        isViewOpen: (viewId) => plugin.openViewId !== null && (!viewId || viewId === plugin.openViewId),
      },
      editor: {
        getContent: () => request("editor.getContent", { id: plugin.id }),
        setContent: (content, expectedVersion) => request("editor.setContent", { id: plugin.id, content, ...(expectedVersion === undefined ? {} : { expectedVersion }) }),
        getSelection: () => request("editor.getSelection", { id: plugin.id }),
        setSelection: (selection, expectedVersion) => request("editor.setSelection", { id: plugin.id, selection, ...(expectedVersion === undefined ? {} : { expectedVersion }) }),
        insertText: (text, expectedVersion) => request("editor.insertText", { id: plugin.id, text, ...(expectedVersion === undefined ? {} : { expectedVersion }) }),
        subscribe: async (listener) => {
          if (typeof listener !== "function") throw new Error("editor.subscribe requires a callback");
          const subscriptionId = `${plugin.id}:editor:${++plugin.editorSequence}`;
          await request("editor.subscribe", { id: plugin.id, subscriptionId });
          plugin.editorSubscriptions.set(subscriptionId, listener);
          return () => {
            plugin.editorSubscriptions.delete(subscriptionId);
            void request("editor.unsubscribe", { id: plugin.id, subscriptionId });
          };
        },
      },
      loadData: () => request("storage.load", { dirName: plugin.dirName }),
      saveData: (data) => request("storage.save", { dirName: plugin.dirName, data }),
      reportProbeResult: (name, outcome, detail) => request("probe.result", {
        id: plugin.id,
        name,
        outcome,
        detail,
      }),
    });

    const evaluatePlugin = (source, manifest, context) => {
      const module = { exports: {} };
      const evaluator = new Function(
        "module", "exports", "DavinciPlugin", "fetch", "XMLHttpRequest",
        "WebSocket", "EventSource", "window", "globalThis", "document", source,
      );
      evaluator(module, module.exports, DavinciPlugin, undefined, undefined, undefined, undefined, undefined, undefined, undefined);
      const exported = module.exports.default || module.exports;
      const candidate = typeof exported === "function"
        ? exported
        : Object.values(module.exports).find((value) => typeof value === "function" && value.prototype instanceof DavinciPlugin);
      if (typeof candidate !== "function" || !(candidate.prototype instanceof DavinciPlugin)) {
        throw new Error(`Plugin \"${manifest.id}\" does not export a class extending DavinciPlugin`);
      }
      return new candidate(manifest, context);
    };

    const descriptors = (plugin) => Array.from(plugin.commands, ([id, command]) => ({ id, title: command.title, ...(command.hotkey ? { hotkey: command.hotkey } : {}) }));
    const viewSnapshots = (plugin) => Array.from(plugin.views, ([id, view]) => ({
      id,
      name: view.name,
      model: view.render(),
      open: plugin.openViewId === id,
    }));

    const handleRequest = async (message) => {
      if (message.method === "ping") return { source: "plugin-runner" };
      if (message.method === "synthetic.start") {
        const single = await request("vault.read", { path: message.params?.single });
        const paths = Array.isArray(message.params?.concurrent) ? message.params.concurrent : [];
        const results = await Promise.all(paths.map((path) => request("vault.read", { path })));
        return { single, paths, results };
      }
      if (message.method === "plugins.load") {
        const { id, manifest, source, dirName, capabilityToken } = message.params ?? {};
        if (typeof id !== "string" || typeof source !== "string" || !manifest || typeof dirName !== "string" || typeof capabilityToken !== "string") {
          throw new Error("plugins.load requires id, manifest, source, dirName, and capabilityToken");
        }
        const plugin = { id, manifest, dirName, capabilityToken, commands: new Map(), views: new Map(), openViewId: null, editorSubscriptions: new Map(), editorSequence: 0 };
        plugin.instance = evaluatePlugin(source, manifest, createContext(plugin));
        loadedPlugins.set(id, plugin);
        console.info("[plugin-runner] evaluated", id);
        return { id, loaded: true, commands: [] };
      }
      const id = message.params?.id;
      if (typeof id !== "string") throw new Error(`${message.method} requires a plugin id`);
      const plugin = loadedPlugins.get(id);
      if (!plugin) throw new Error(`Plugin is not loaded: ${id}`);
      if (message.method === "plugins.onload") {
        await plugin.instance.onload();
        console.info("[plugin-runner] onload completed", id);
        return { id, lifecycle: "plugins.onload", commands: descriptors(plugin), views: viewSnapshots(plugin) };
      }
      if (message.method === "plugins.onunload") {
        try { await plugin.instance.onunload(); } finally { plugin.editorSubscriptions.clear(); loadedPlugins.delete(id); }
        console.info("[plugin-runner] onunload completed", id);
        return { id, lifecycle: "plugins.onunload" };
      }
      if (message.method === "commands.invoke") {
        const command = plugin.commands.get(message.params.commandId);
        if (!command) throw new Error(`Plugin command is not registered: ${message.params.commandId}`);
        await command.callback();
        console.info("[plugin-runner] command completed", message.params.commandId);
        return { id, commandId: message.params.commandId, invoked: true, views: viewSnapshots(plugin) };
      }
      if (message.method === "views.event") {
        const view = plugin.views.get(message.params.viewId);
        if (!view) throw new Error(`Plugin view is not registered: ${message.params.viewId}`);
        const result = typeof view.onEvent === "function" ? await view.onEvent(message.params.event) : undefined;
        const model = result === undefined ? view.render() : result;
        console.info("[plugin-runner] view event completed", message.params.viewId);
        return { id, viewId: message.params.viewId, model };
      }
      throw new Error(`Method is not implemented: ${message.method}`);
    };

    const callback = window.__TAURI_INTERNALS__.transformCallback((event) => {
      const message = event.payload;
      if (message.protocol !== 1) return;
      if (message.kind === "response") {
        const pendingRequest = pending.get(message.requestId);
        if (!pendingRequest) return;
        pending.delete(message.requestId);
        if (message.error) pendingRequest.reject(new Error(message.error.message));
        else pendingRequest.resolve(message.result);
        return;
      }
      if (message.kind === "notification") {
        if (message.method !== "editor.changed") return;
        const plugin = loadedPlugins.get(message.params?.id);
        const listener = plugin?.editorSubscriptions.get(message.params?.subscriptionId);
        if (listener) {
          try { listener(message.params.snapshot); } catch (error) { console.error("[plugin-runner] editor subscription failed", error); }
        }
        return;
      }
      if (message.kind !== "request") return;
      void handleRequest(message)
        .then((result) => respond(message, result))
        .catch((error) => respond(message, undefined, { code: "runner-request-failed", message: error instanceof Error ? error.message : String(error) }));
    });

    void invoke("plugin_webview_booted");
    void invoke("plugin:event|listen", { event: "davinci-plugin-rpc", target: { kind: "Any" }, handler: callback })
      .then(() => {
        disablePluginGlobals();
        return invoke("plugin_webview_listening");
      })
      .catch((error) => invoke("plugin_webview_script_error", {
        message: error instanceof Error ? error.message : String(error),
      }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (window.__TAURI_INTERNALS__?.invoke) void window.__TAURI_INTERNALS__.invoke("plugin_webview_script_error", { message });
  }
});
