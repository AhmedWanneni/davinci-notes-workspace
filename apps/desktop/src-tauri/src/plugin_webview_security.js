function disablePluginGlobals() {
  const denied = [
    "fetch",
    "XMLHttpRequest",
    "WebSocket",
    "EventSource",
    "Worker",
    "SharedWorker",
    "WebTransport",
  ];
  for (const name of denied) hideRunnerGlobal(name);
  hideRunnerGlobal("__TAURI_INTERNALS__");
}

function hideRunnerGlobal(name) {
  Object.defineProperty(window, name, {
    value: undefined,
    writable: false,
    configurable: false,
  });
  if (window[name] !== undefined) {
    throw new Error(`Could not disable plugin runner global: ${name}`);
  }
}
